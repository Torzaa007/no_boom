import Database from 'better-sqlite3';
import path from 'path';
import "../../../app.css";  

export const actions = {
  addTrip: async ({ request }) => {
    const dbPath = path.resolve('src/lib/databaseStorage/dbforTrain-2.db');
    const db = new Database(dbPath);
    const formData = await request.formData();

    const tripId = formData.get('tripId');
    const trainId = formData.get('trainId');
    const route = formData.get('route');
    const start = formData.get('start');
    const end = formData.get('end');
    const fromDatetime = formData.get('fromDatetime');
    const trainNo = formData.get('trainNo');
    const classType = formData.get('class');
    const seatType1 = formData.get('seatType1');
    const seatCount1 = formData.get('seatCount1');
    const seatType2 = formData.get('seatType2');
    const seatCount2 = formData.get('seatCount2');
    const emId = formData.get('emId');
    const class_1 = classType + "_" + seatType1.slice(6, 9) + "-" + seatCount1
    const class_2 = classType + "_" + seatType2.slice(6, 9) + "-" + seatCount2

    try {
      const tripExists = db
      .prepare(`SELECT COUNT(*) AS count FROM TRIPS WHERE trip_id = ?`)
      .get(tripId).count == 0;

      if (tripExists) {
        db.prepare(`
          INSERT INTO TRIPS (trip_id, start_station_id, end_station_id, from_datetime, staff_id, route)
          VALUES (?, 
          (SELECT station_id FROM STATIONS WHERE station_name = ?), 
          (SELECT station_id FROM STATIONS WHERE station_name = ?), 
          ?, ?, ?)
        `).run(tripId, start, end, fromDatetime, emId, route);
      }

      // Check if the train_id exists in the TRAINS table
      const trainExists = db
        .prepare(`SELECT COUNT(*) AS count FROM TRAINS WHERE train_id = ?`)
        .get(trainId).count > 0;

      if (trainExists) {
        // If the train exists, update the trip_id
        db.prepare(`
          UPDATE TRAINS
          SET trip_id = ?
          WHERE train_id = ?
        `).run(tripId, trainId);
      } else {
        // If the train does not exist, insert a new train with the trip_id
        db.prepare(`
          INSERT INTO TRAINS (train_id, trip_id)
          VALUES (?, ?)
        `).run(trainId, tripId);
      }
      db.prepare(`
        INSERT INTO PAX_COACHES (coach_id, train_id, class_1, class_2)
        VALUES (?, ?, ?, ?)
      `).run(trainNo, trainId, class_1, class_2);

      return { success: true };
    } catch (error) {
      console.error('Error adding new trip:', error);
      return { error: 'Unable to add new trip' };
    } finally {
      db.close();
    }
  }
};