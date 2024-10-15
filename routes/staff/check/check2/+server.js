import Database from 'better-sqlite3';

export async function POST({ request }) {
  let db;
  try {
    // Open the database connection for each request
    db = new Database('src/lib/databaseStorage/dbforTrain-2.db');

    // Parse the request body
    const data = await request.json();
    console.log('Received Data:', data);

    // Parse qrData if it's a JSON string
    let qrData = data.qrData;
    if (typeof qrData === 'string') {
      console.log('Parsing qrData as JSON string');
      qrData = JSON.parse(qrData);
    }

    console.log(`Passenger ID: ${qrData.passenger_id}`);
    console.log(`Reserved Seat ID: ${qrData.reserve_id}`);
    console.log(`Check: ${qrData.check}`);

    // Ensure the required fields exist
    const { passenger_id, reserve_id } = qrData;
    if (!passenger_id || !reserve_id) {
      console.error('Missing passenger_id or reserve_id');
      return new Response(
        JSON.stringify({ message: 'ข้อมูล QR ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Query the database to find matching tickets
    const tickets = db
      .prepare('SELECT * FROM RESERVATIONS WHERE passenger_id = ? AND reserved_seat_id = ?')
      .all(passenger_id, reserve_id);

    console.log('Fetched Tickets:', tickets);

    if (tickets.length > 0) {
      const ticket = tickets[0];

      if (ticket.reserve_status === 'used') {
        console.log(`Ticket already used: ${passenger_id}, ${reserve_id}`);
        console.error('No rows updated. Please check the data.')
        return new Response(
          JSON.stringify({ message: 'ตั๋วนี้ถูกใช้ไปแล้ว' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Update the status to 'used'
      const result = db
        .prepare('UPDATE RESERVATIONS SET reserve_status = ? WHERE passenger_id = ? AND reserved_seat_id = ?')
        .run('used', passenger_id, reserve_id);

      console.log('Update Result:', result);

      if (result.changes > 0) {
        console.log(`Ticket updated to 'used': ${passenger_id}, ${reserve_id}`);
        return new Response(
          JSON.stringify({ message: 'ตั๋วถูกต้องและได้รับการยืนยัน' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        console.error('No rows updated. Please check the data.');
        throw new Error('Failed to update ticket status');
      }
    } else {
      console.log('Ticket not found or invalid');
      return new Response(
        JSON.stringify({ message: 'ตั๋วไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error processing QR data:', error);
    return new Response(
      JSON.stringify({ message: 'เกิดข้อผิดพลาดในการประมวลผลข้อมูล' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    // Ensure the database connection is closed properly
    if (db) db.close();
  }
}