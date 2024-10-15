import Database from 'better-sqlite3';
import path from 'path';

// /** @type {import('./$types').PageServerLoad} */
export async function load() {
  const dbPath = path.resolve('src/lib/databaseStorage/dbforTrain-2.db');
  const db = new Database(dbPath);

  try {
    const trips = db.prepare(`   SELECT 
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
    GROUP BY 
    t.trip_id; 
`).all();

    const stations = db.prepare(`
      SELECT 
      *
      FROM STATIONS
    `).all();
  // Query 3: Fetch passenger data and related reservation/trip info
    const ticket = db.prepare(`
      SELECT
        p.passenger_id, p.firstname, p.lastname, p.phonenumber, -- Passenger data
        r.reserved_seat_id, r.reserve_trip_id, r.passenger_id, -- Reservation data
        r.from_station_id, r.to_station_id, -- Station data
        s.seat_id, s.seat_type, s.train_id, -- Seat data
        sta_from.station_name AS from_station_name, -- From station
        sta_to.station_name AS to_station_name, -- To station
        t.from_datetime, t.trip_id, -- Trip data
        train.train_id, train.train_name -- Train data
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

    // Return fetched data
    return {
      trips,
      ticket,
      stations
    };

  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      error: 'Unable to fetch data from the database'
    };
  } finally {
    db.close();
  }
  
}