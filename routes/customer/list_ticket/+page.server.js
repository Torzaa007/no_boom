import { redirect } from 'sveltekit-flash-message/server';
import { SESSION_COOKIE_NAME } from '$lib/constants';
import { getUserName } from '$lib/database/databaseUtils.server';
import { route } from '$lib/ROUTES';
import path from 'path';
import Database from 'better-sqlite3'; // ตรวจสอบการติดตั้งไลบรารี

export const load = async ({ cookies, url }) => {
  const sessionCookie = cookies.get(SESSION_COOKIE_NAME);
  let userSession;

  try {
    // แปลง cookie จาก JSON กลับเป็น Object
    userSession = sessionCookie ? JSON.parse(sessionCookie) : null;
  } catch (error) {
    console.error('Failed to parse session cookie:', error);
    userSession = null;
  }

  // ตรวจสอบการล็อกอิน
  if (!userSession || !userSession.id) {
    throw redirect(
      route('/auth/login'),
      {
        type: 'error',
        message: 'กรุณาเข้าสู่ระบบเพื่อดูหน้านี้',
      },
      cookies
    );
  }

  const passengerId = userSession.id; // ดึง passenger_id จาก session

  const dbPath = path.resolve('src/lib/databaseStorage/dbforTrain-2.db');
  let db;
  let reservations;
  let loggedOnUserName;

  try {
    // เปิดการเชื่อมต่อกับฐานข้อมูล
    db = new Database(dbPath);

    // สอบถามข้อมูลการจองของผู้ใช้ พร้อมดึงชื่อสถานีเริ่มต้นและปลายทาง
    reservations = db
      .prepare(`
        SELECT
          r.reserved_seat_id, reserve_status, r.reserve_trip_id, r.passenger_id, 
          r.booking_datetime, r.from_station_id, r.to_station_id, r.payment_id,
          UPPER(REPLACE(SUBSTR(r.reserve_trip_id, 4), '_', ' ')) AS formatted_trip_id,
          s.seat_id, s.seat_type, st.price,
          sta_from.station_name AS from_station_name,
          sta_to.station_name AS to_station_name,
          t.from_datetime, t.route, 
          t.start_station_id, start_sta.station_name AS start_station_name,
          t.end_station_id, end_sta.station_name AS end_station_name
        FROM RESERVATIONS r
        JOIN TRIPS t ON r.reserve_trip_id = t.trip_id
        JOIN STATIONS sta_from ON sta_from.station_id = r.from_station_id
        JOIN STATIONS sta_to ON sta_to.station_id = r.to_station_id
        JOIN STATIONS start_sta ON start_sta.station_id = t.start_station_id
        JOIN STATIONS end_sta ON end_sta.station_id = t.end_station_id
        JOIN SEAT s ON s.seat_id = r.reserved_seat_id
        JOIN SEAT_TYPE st ON s.seat_type = st.seat_type
        WHERE r.passenger_id = ?
      `)
      .all(passengerId); // ใช้ passengerId ในการ query

    console.log('result form query', reservations);

    // ดึงชื่อผู้ใช้ที่ล็อกอินอยู่
    loggedOnUserName = await getUserName(passengerId);

  } catch (error) {
    console.error('Database query failed:', error);
    throw error;
  } finally {
    if (db) db.close();
  }

  return {
    session: userSession,
    reservations,
    loggedOnUserName,
  };
};
