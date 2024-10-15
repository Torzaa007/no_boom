import Database from 'better-sqlite3';
import path from 'path';

// สร้างเส้นทางไปยังฐานข้อมูล
const dbPath = path.resolve('src/lib/databaseStorage/dbforTrain-2.db');
const db = new Database(dbPath);

export function deleteExpiredReservations() {
  // เปิดใช้งาน Foreign Key Constraints
  db.exec('PRAGMA foreign_keys = ON;'); 

  // เวลาปัจจุบันและ 5 นาทีที่แล้วในรูปแบบ 'YYYY-MM-DD HH:MM:SS'
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const formattedTime = fiveMinutesAgo.toISOString().replace('T', ' ').slice(0, 19);

  console.log('Current Time:', now.toISOString().replace('T', ' ').slice(0, 19));
  console.log('Time 5 Minutes Ago:', formattedTime);

  try {
    // ค้นหาการจองที่หมดอายุ
    const expiredReservations = db.prepare(`
      SELECT payment_id, reserved_seat_id
      FROM RESERVATIONS
      WHERE reserve_status = 'wait'
      AND booking_datetime <= ?
    `).all(formattedTime);

    console.log('Expired Reservations:', expiredReservations);

    if (expiredReservations.length === 0) {
      console.log('No expired reservations found.');
      return;
    }

    // เตรียมคำสั่ง SQL สำหรับลบ
    const deleteReservationStmt = db.prepare(`
      DELETE FROM RESERVATIONS WHERE reserved_seat_id = ?
    `);
    const deletePaymentStmt = db.prepare(`
      DELETE FROM PAYMENT WHERE payment_id = ?
    `);

    // ใช้ transaction สำหรับการลบ reservations
    db.transaction(() => {
      for (const reservation of expiredReservations) {
        console.log(`Deleting reservation: ${reservation.reserved_seat_id}`);
        deleteReservationStmt.run(reservation.reserved_seat_id);
      }
    })();

    // ใช้ transaction สำหรับการลบ payments
    db.transaction(() => {
      for (const reservation of expiredReservations) {
        console.log(`Deleting payment: ${reservation.payment_id}`);
        deletePaymentStmt.run(reservation.payment_id);
      }
    })();

    console.log('Deleted expired reservations and related payments successfully.');
  } catch (error) {
    console.error('Error deleting expired reservations:', error);
  }
}
