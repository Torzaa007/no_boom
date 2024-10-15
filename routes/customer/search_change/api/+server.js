import { json } from '@sveltejs/kit';
import Database from 'better-sqlite3';
import path from 'path';
import { generateSQLQuery } from '$lib/utils.js';
import { deleteExpiredReservations } from '$lib/clean_up'; // นำเข้า clean-up function

export async function POST({ request }) {
  deleteExpiredReservations();

  const { fromStationName, toStationName, route, date, old_seat_id} = await request.json();
  const dbPath = path.resolve('src/lib/databaseStorage/dbforTrain-2.db');
  const db = new Database(dbPath);

  try {
    if (fromStationName && toStationName && route && date) {
      // First, get the station IDs for the given station names
      const fromStationQuery = db.prepare('SELECT station_id FROM STATIONS WHERE station_name = ?');
      const toStationQuery = db.prepare('SELECT station_id FROM STATIONS WHERE station_name = ?');

      const fromStation = fromStationQuery.get(fromStationName);
      const toStation = toStationQuery.get(toStationName);

      if (!fromStation || !toStation) {
        return json({ error: 'Invalid station names' }, { status: 400 });
      }

      const tripsQuery = generateSQLQuery(fromStation.station_id, toStation.station_id, date, route);
      const trips = db.prepare(tripsQuery).all();
      return json({ trips });
    }

    if (!date) {
      return json({ error: 'กรุณาเลือกวันที่เดินทาง' }, { status: 400 });
    }

    return json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching data:', error);
    return json({ trips: [], error: 'ไม่สามารถดึงข้อมูลจากฐานข้อมูลได้' }, { status: 500 });
  } finally {
    db.close();
  }
}