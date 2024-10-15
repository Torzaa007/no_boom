import { json } from '@sveltejs/kit';
import Database from 'better-sqlite3';
import path from 'path';
import { generateSQLQuery } from '$lib/utils.js';
import { deleteExpiredReservations } from '$lib/clean_up'; // นำเข้า clean-up function

export async function POST({ request }) {
  deleteExpiredReservations();

  const { line, origin, destination, date } = await request.json();

  const dbPath = path.resolve('src/lib/databaseStorage/dbforTrain-2.db');
  const db = new Database(dbPath);

  try {
    if (!origin && !destination) {
      let stationsQuery = `SELECT station_id, station_name FROM STATIONS`;
      if (line) {
        stationsQuery += ` WHERE station_id LIKE '%_${line.toLowerCase()}_%'`;
      }
      const allStations = db.prepare(stationsQuery).all();
      return json({ stations: allStations });
    }

    if (origin && destination && date) {
      const tripsQuery = generateSQLQuery(origin, destination, date);
      const trips = db.prepare(tripsQuery).all();
      return json({ trips });
    }

    if (!date) {
      return json({ error: 'กรุณาเลือกวันที่เดินทาง' }, { status: 400 });
    }

    return json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching data:', error);
    return json({ stations: [], trips: [], error: 'ไม่สามารถดึงข้อมูลจากฐานข้อมูลได้' }, { status: 500 });
  } finally {
    db.close();
  }
}
