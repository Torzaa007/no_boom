import Database from 'better-sqlite3';
import path from 'path';
import { json } from '@sveltejs/kit';

// Handle POST request and query trip details

export async function POST({ request }) {
    const dbPath = path.resolve('src/lib/databaseStorage/dbforTrain-3.db'); // Adjust path if needed
    const db = new Database(dbPath);

    try {
        const { tripId } = await request.json();
        const checktripQuery = `
      SELECT 
        CONCAT(
          UPPER(SUBSTRING(t.trip_id, 4, 2)), 
          SUBSTRING(t.trip_id, 7), ' ', 
          s.station_name, '-', s2.station_name
        ) AS trip_name,
        trip_id, seat_id, seat_type, coach_id, 
        substr((class_1),1,1) as class, 
        count(seat_id) as available_seats, 
        price, s.station_name AS 'start', 
        s2.station_name AS 'end', 
        s.station_id 'start_id', 
        s2.station_id 'end_id',
        from_datetime,
        firstname,
        lastname
      FROM SEAT
      JOIN PAX_COACHES USING (coach_id)
      JOIN TRAINS USING (train_id)
      JOIN SEAT_TYPE USING (seat_type)
      JOIN TRIPS t USING (trip_id)
      JOIN STATIONS s ON t.start_station_id = s.station_id
      JOIN STATIONS s2 ON s2.station_id = t.end_station_id
      join STAFFS using (staff_id)

      WHERE seat_id NOT IN (SELECT reserved_seat_id FROM RESERVATIONS)
      AND staff_id = 's01001'
      GROUP BY trip_id, seat_type
    `;
        const tripsC = db.prepare(checktripQuery).all();
        if (!tripId) {
            return json({ success: false, message: 'Trip ID is required' }, { status: 400 });
        }

        const tripDetailsQuery = `
            SELECT trip_id, seat_id, seat_type, coach_id, 
                   substr((class_1),1,1) as class, 
                   count(seat_id) as available_seats, 
                   price, s.station_name AS 'start', 
                   s2.station_name AS 'end', 
                   s.station_id 'start_id', 
                   s2.station_id 'end_id'
            FROM SEAT
            JOIN PAX_COACHES USING (coach_id)
            JOIN TRAINS USING (train_id)
            JOIN SEAT_TYPE USING (seat_type)
            JOIN TRIPS t USING (trip_id)
            JOIN STATIONS s ON t.start_station_id = s.station_id
            JOIN STATIONS s2 ON s2.station_id = t.end_station_id
            WHERE seat_id NOT IN (SELECT reserved_seat_id FROM RESERVATIONS)
              AND trip_id = ?
            GROUP BY trip_id, seat_type;
        `;
        const tripsQ = db.prepare(tripDetailsQuery).all(tripId);


        console.log('Received trip ID:', tripId);
        // console.log('Queried trip details:', tripsQ);
        

        return json({ success: true, tripsQ, tripsC });
    } catch (error) {
        console.error('Error processing request:', error);
        return json({ success: false, message: 'Failed to retrieve trip details' }, { status: 500 });
    } finally {
        db.close();
    }
}
