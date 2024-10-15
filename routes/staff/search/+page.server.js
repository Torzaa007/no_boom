import { redirect } from '@sveltejs/kit';
import path from 'path';
import Database from 'better-sqlite3'; 

// สร้างการเชื่อมต่อฐานข้อมูลที่ระดับ global
const dbPath = path.resolve('src/lib/databaseStorage/dbforTrain-2.db');
const db = new Database(dbPath, { verbose: console.log });

export async function load() {
  try {
    console.log('Database connection opened');

    // Query ข้อมูลทริป
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

    // Query ข้อมูลสถานี
    const stations = db.prepare(`SELECT * FROM STATIONS`).all();

    // Query ข้อมูลตั๋ว
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

    return { trips, stations, ticket };

  } catch (error) {
    console.error('Error fetching data:', error);
    return { error: 'Unable to fetch data from the database' };
  }
}

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
      user_to_station: bookingInfo.user_to_station
    };

    console.log("from_server", tripData);

    if (locals.session) {
      locals.session.trip = tripData;
      console.log("tripData", tripData)
    } else {
      console.warn('Session is not available. Using alternative method to pass data.');
    }

    const searchParams = new URLSearchParams(tripData);
    throw redirect(302, `reservation?${searchParams.toString()}`);
  }
};
