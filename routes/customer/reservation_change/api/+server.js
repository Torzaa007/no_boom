import { json } from '@sveltejs/kit';
import Database from 'better-sqlite3';
import path from 'path';

// Path to your SQLite database
const dbPath = path.resolve('src/lib/databaseStorage/dbforTrain-2.db');

export const POST = async ({ request }) => {
    // Open the database connection inside the POST handler
    const db = new Database(dbPath);

    try {
        // Parse the incoming request data
        const formData = await request.json();
        const { userId, tripId, seatType, quantity, totalPrice, fromStation, toStation, old_seat_id } = formData;
        console.log("Received form data:", formData);

        // Start a transaction
        db.prepare('BEGIN').run();

        // If there is an old reservation, handle its deletion
        if (old_seat_id) {
            const paymentResult = db.prepare(
                'SELECT payment_id FROM RESERVATIONS WHERE reserved_seat_id = ?'
            ).get(old_seat_id);

            if (paymentResult) {
                const oldPaymentId = paymentResult.payment_id;

                // Delete old reservation and payment
                db.prepare('DELETE FROM RESERVATIONS WHERE reserved_seat_id = ?').run(old_seat_id);
                db.prepare('DELETE FROM PAYMENT WHERE payment_id = ?').run(oldPaymentId);

                console.log(`Deleted reservation for seat ${old_seat_id} and payment ${oldPaymentId}`);
            }
        }

        // Get station IDs from station names
        const fromStationID = db.prepare('SELECT station_id FROM STATIONS WHERE station_name = ?')
            .get(fromStation)?.station_id;
        const toStationID = db.prepare('SELECT station_id FROM STATIONS WHERE station_name = ?')
            .get(toStation)?.station_id;

        if (!fromStationID || !toStationID) {
            throw new Error('Invalid station names provided.');
        }

        // Check for available seats
        const availableSeats = db.prepare(`
            SELECT seat_id FROM SEAT
            JOIN TRAINS USING (train_id)
            WHERE seat_id NOT IN (SELECT reserved_seat_id FROM RESERVATIONS)
            AND trip_id = ? AND seat_type = ?
            ORDER BY seat_id ASC LIMIT ?
        `).all(tripId, seatType, quantity);

        if (availableSeats.length < quantity) {
            throw new Error('Not enough seats available.');
        }

        // Generate a new payment ID
        const lastPaymentId = db.prepare(`
            SELECT MAX(CAST(payment_id AS INTEGER)) as last_payment_id FROM PAYMENT
        `).get()?.last_payment_id || 0;
        const newPaymentId = lastPaymentId + 1;

        console.log(`New Payment ID: ${newPaymentId}`);

        // Insert the payment record
        const paymentDatetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        db.prepare(`
            INSERT INTO PAYMENT (payment_id, amount, payment_datetime, payment_method)
            VALUES (?, ?, ?, ?)
        `).run(newPaymentId, totalPrice, paymentDatetime, null);

        // Insert the reservations
        const bookingDatetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const reservationInsert = db.prepare(`
            INSERT INTO RESERVATIONS (
                reserved_seat_id, passenger_id, reserve_trip_id, from_station_id,
                to_station_id, booking_datetime, reserve_status, payment_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const seat of availableSeats) {
            reservationInsert.run(
                seat.seat_id, userId, tripId, fromStationID, toStationID,
                bookingDatetime, 'wait', newPaymentId
            );
            console.log(`Reserved seat ${seat.seat_id} for user ${userId}`);
        }

        // Commit the transaction
        db.prepare('COMMIT').run();

        // Return a success response
        return json({ success: true, paymentId: newPaymentId });
    } catch (error) {
        // Rollback the transaction if any error occurs
        db.prepare('ROLLBACK').run();
        console.error('Error processing reservation:', error);
        return json({ error: 'Unable to add new reservation', details: error.message }, { status: 500 });
    } finally {
        // Close the database connection
        db.close();
    }
};
