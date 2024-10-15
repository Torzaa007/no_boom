import Database from 'better-sqlite3';
import path from 'path';
import "../../../app.css";  // Adjust the path if your CSS file is located elsewhere

export const actions = {
  addStation: async ({ request }) => {
    const dbPath = path.resolve('src/lib/databaseStorage/dbforTrain-3.db');
    const db = new Database(dbPath);
    const formData = await request.formData();
    const stationId = formData.get('station_id');
    const name = formData.get('station_name');
    const address = formData.get('station_address');
    const time = formData.get('time_use');
    const status = formData.get('station_status');
    try {
      db.prepare(`
        INSERT INTO STATIONS (station_id, station_name, station_address, time_use, station_status)
        VALUES (?, ?, ?, ?, ?)
      `).run(stationId, name, address, time, status);

      return { success: true };
    } catch (error) {
      console.error('Error adding new station:', error);
      return { error: 'Unable to add new station' };
    } finally {
      db.close();
    }
  }
};
