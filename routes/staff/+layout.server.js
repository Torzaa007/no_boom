import { loadFlash } from 'sveltekit-flash-message/server';
import { SESSION_COOKIE_NAME } from '$lib/constants';
import { createBaseMetaTags } from '$lib/utils/metaTags';
import Database from 'better-sqlite3';
import path from 'path';

export const load = loadFlash(async ({ url, cookies }) => {
  const baseMetaTags = createBaseMetaTags(url);
  const sessionCookie = cookies.get(SESSION_COOKIE_NAME);
  let userSession;

  try {
    userSession = sessionCookie ? JSON.parse(sessionCookie) : null;
  } catch (error) {
    console.error('Failed to parse session cookie:', error);
    userSession = null;
  }

  if (!userSession || userSession.type !== 'staff') {
    return {
      error: 'Unauthorized access',
      success: false,
    };
  }
  const staff_id = userSession.id; // Retrieve staff_id from the session
  const dbPath = path.resolve('src/lib/databaseStorage/dbforTrain-2.db');
  const db = new Database(dbPath);

  try {
    // Extract query parameters
    const selectedTripId = url.searchParams.get('selectedTripId');
    const origin = url.searchParams.get('origin');
    const destination = url.searchParams.get('destination');
    const date = url.searchParams.get('date');
    let start_id = url.searchParams.get('start_id');
    let end_id = url.searchParams.get('end_id');

    // Fetch station data
    const stations = db.prepare('SELECT * FROM STATIONS').all();

    // Adjust start and end stations if necessary
    if (start_id > end_id) {
      [start_id, end_id] = [end_id, start_id];
    }

    // Fetch stations between start_id and end_id
    const stationsQ = db.prepare(`
      SELECT station_id, station_name
      FROM STATIONS
      WHERE station_id BETWEEN ? AND ?
    `).all(start_id, end_id);

    // Fetch trip data if origin, destination, and date are provided
    let tripsWithDetails = [];
    if (origin && destination && date) {
      const tripsQuery = `
        SELECT 
          t.trip_id,
          CONCAT(UPPER(SUBSTRING(t.trip_id, 4, 2)), SUBSTRING(t.trip_id, 7)) AS trip_name,
          s1.station_name AS start_name, 
          s2.station_name AS end_name,
          t.from_datetime
        FROM TRIPS t 
        JOIN STATIONS s1 ON t.start_station_id = s1.station_id 
        JOIN STATIONS s2 ON t.end_station_id = s2.station_id 
        WHERE DATE(t.from_datetime) = ?
          AND t.start_station_id = ?
          AND t.end_station_id = ?
        ORDER BY t.from_datetime
      `;
      tripsWithDetails = db.prepare(tripsQuery).all(date, origin, destination);
    }

    // Fetch specific trip details if selectedTripId is provided
    let tripsQ = [];
    if (selectedTripId) {
      const tripDetailsQuery = `
        SELECT trip_id, seat_type, count(seat_id)
        FROM SEAT
        JOIN PAX_COACHES USING (coach_id)
        JOIN TRAINS USING (train_id)
        WHERE seat_id NOT IN (SELECT reserved_seat_id FROM RESERVATIONS)
        AND trip_id = ?
        GROUP BY trip_id, seat_type
      `;
      tripsQ = db.prepare(tripDetailsQuery).all(selectedTripId);
    }

    // Fetch additional trip data
    const trips = db.prepare(`
      SELECT t.trip_id, t.staff_id, t.start_station_id, t.end_station_id, t.route, t.from_datetime, 
      s.station_name AS 'start', s2.station_name AS 'end', s.station_id 'start_id', s2.station_id 'end_id'
      FROM TRIPS t
      JOIN STATIONS s ON t.start_station_id = s.station_id
      JOIN STATIONS s2 ON s2.station_id = t.end_station_id
    `).all();

    // Fetch reservations with joined information
    const reservations = db.prepare(`
      SELECT 
        r.reserved_seat_id, r.reserve_status, r.reserve_trip_id, r.passenger_id, r.booking_datetime, 
        r.from_station_id, r.to_station_id, r.payment_id,
        s.seat_id, s.seat_type,
        st.price,
        sta_from.station_name AS from_station_name,
        sta_to.station_name AS to_station_name,
        t.from_datetime, t.route, t.trip_id
      FROM RESERVATIONS r
      JOIN TRIPS t ON r.reserve_trip_id = t.trip_id
      JOIN STATIONS sta_from ON sta_from.station_id = r.from_station_id
      JOIN STATIONS sta_to ON sta_to.station_id = r.to_station_id
      JOIN SEAT s ON s.seat_id = r.reserved_seat_id
      JOIN SEAT_TYPE st ON s.seat_type = st.seat_type
    `).all();

    // Fetch trips for export
    const trips2 = db.prepare(`
      SELECT 
        t.trip_id, 
        t.staff_id, 
        t.start_station_id, 
        t.end_station_id, 
        t.route, 
        t.from_datetime, 
        s1.station_name AS 'start', 
        s2.station_name AS 'end', 
        GROUP_CONCAT(DISTINCT 
            SUBSTRING(pc.class_1, 1, 1) 
            ORDER BY SUBSTRING(pc.class_1, 1, 1)
        ) AS available_classes
      FROM TRIPS t
      JOIN STATIONS s1 ON (t.start_station_id = s1.station_id)
      JOIN STATIONS s2 ON (t.end_station_id = s2.station_id)
      LEFT JOIN TRAINS tr ON (tr.trip_id = t.trip_id)
      LEFT JOIN PAX_COACHES pc ON (tr.train_id = pc.train_id)
      GROUP BY t.trip_id
    `).all();

    // Fetch passenger data and related reservation/trip info
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
      LIMIT 1
    `).get();

    const staffs = db.prepare('SELECT * FROM STAFFS').all();

    const checktripQuery = `
      SELECT 
      CONCAT(
          UPPER(SUBSTRING(t.trip_id, 4, 2)), 
          SUBSTRING(t.trip_id, 7), ' ', 
          s.station_name, '-', s2.station_name
        ) AS trip_name,
          trip_id,
          s.station_name AS 'start', 
          s2.station_name AS 'end', 
          s.station_id 'start_id', 
          s2.station_id 'end_id',
          firstname,
          lastname,
          from_datetime
          from TRIPS t
          JOIN STATIONS s ON t.start_station_id = s.station_id
          JOIN STATIONS s2 ON s2.station_id = t.end_station_id
          join STAFFS using (staff_id)
          where staff_id = ?

    `;
    const tripsC = db.prepare(checktripQuery).all(staff_id);
    const seat = db.prepare('SELECT * FROM SEAT_TYPE').all();

    return {
      session: userSession,
      baseMetaTags: Object.freeze(baseMetaTags),
      trips,
      stations,
      tripsWithDetails,
      stationsQ,
      tripsQ,
      start_id,
      end_id,
      tripsC,
      reservations,
      trips2,
      ticket,
      staffs,
      seat,
      success: true,
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      error: 'Unable to fetch data from the database',
      success: false,
    };
  } finally {
    db.close();
  }
});