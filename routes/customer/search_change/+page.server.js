import { redirect } from '@sveltejs/kit';
import path from 'path';
import Database from 'better-sqlite3';

// กำหนดเส้นทางของฐานข้อมูล
const dbPath = path.resolve('src/lib/databaseStorage/dbforTrain-2.db');

// ฟังก์ชันสำหรับการเชื่อมต่อฐานข้อมูล
function getDbConnection() {
  return new Database(dbPath);
}

// ฟังก์ชันโหลดข้อมูล
export async function load({ url }) {
  let db = getDbConnection();

  // รับพารามิเตอร์จาก URL
  const fromStationName = url.searchParams.get('from_station_name');
  const toStationName = url.searchParams.get('to_station_name');
  const route = url.searchParams.get('route');
  const old_seat_id = url.searchParams.get('old_seat_id');

  // คิวรีข้อมูลสถานีทั้งหมด
  const stations = db.prepare(`SELECT * FROM STATIONS`).all();

  // คิวรีข้อมูลทริป
  const trips = db.prepare(`
    SELECT
      t.trip_id,
      t.staff_id,
      t.start_station_id,
      t.end_station_id,
      t.route,
      t.from_datetime,
      s1.station_name AS 'start',
      s2.station_name AS 'end',
      GROUP_CONCAT(DISTINCT SUBSTRING(pc.class_1, 1, 1)
        ORDER BY SUBSTRING(pc.class_1, 1, 1)) AS available_classes
    FROM TRIPS t
    JOIN STATIONS s1 ON t.start_station_id = s1.station_id
    JOIN STATIONS s2 ON t.end_station_id = s2.station_id
    LEFT JOIN TRAINS tr ON tr.trip_id = t.trip_id
    LEFT JOIN PAX_COACHES pc ON tr.train_id = pc.train_id
    GROUP BY t.trip_id;
  `).all();

  // คิวรีข้อมูลตั๋ว
  const ticket = db.prepare(`
    SELECT
      p.passenger_id, p.firstname, p.lastname, p.phonenumber,
      r.reserved_seat_id, r.reserve_trip_id, r.passenger_id,
      r.from_station_id, r.to_station_id,
      s.seat_id, s.seat_type, s.train_id,
      sta_from.station_name AS from_station_name,
      sta_to.station_name AS to_station_name,
      t.from_datetime, t.trip_id,
      train.train_id, train.train_name
    FROM PASSENGERS p
    JOIN RESERVATIONS r ON p.passenger_id = r.passenger_id
    JOIN TRIPS t ON r.reserve_trip_id = t.trip_id
    JOIN STATIONS sta_from ON sta_from.station_id = r.from_station_id
    JOIN STATIONS sta_to ON sta_to.station_id = r.to_station_id
    JOIN SEAT s ON s.seat_id = r.reserved_seat_id
    JOIN SEAT_TYPE st ON s.seat_type = st.seat_type
    JOIN TRAINS train ON s.train_id = train.train_id
    LIMIT 1;
  `).get();

  // ปิดการเชื่อมต่อฐานข้อมูล
  if (db) {
    db.close();
  }

  // ส่งคืนข้อมูลไปยังหน้า Svelte
  return {
    fromStationName,
    toStationName,
    route,
    old_seat_id,
    stations,
    trips,
    ticket
  };
}

// กำหนด actions สำหรับจัดการฟอร์ม
export const actions = {
  saveTrip: async ({ request, locals }) => {
    const data = await request.formData();
    const bookingInfo = JSON.parse(data.get('bookingInfo'));

    if (!locals.session) {
      locals.session = {};
    }

    const tripData = {
      tripId: bookingInfo.tripId,
      tripName: bookingInfo.tripName,
      startStation: bookingInfo.startName,
      endStation: bookingInfo.endName,
      fromDatetime: bookingInfo.fromDatetime,
      toDatetime: bookingInfo.toDatetime,
      availableClasses: bookingInfo.availableClasses,
      user_from_station: bookingInfo.user_from_station,
      user_to_station: bookingInfo.user_to_station,
      old_seat_id: bookingInfo.old_seat_id
    };

    console.log("from_server", tripData);

    // บันทึกข้อมูลทริปใน session
    locals.session.trip = tripData;

    // สร้าง query string สำหรับการ redirect ไปยังหน้าการจอง
    const searchParams = new URLSearchParams(tripData);
    throw redirect(302, `reservation_change?${searchParams.toString()}`);
  }
};
