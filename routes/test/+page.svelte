<script>
  import { calculateTravelTime } from '../../lib/travelTimeCalculator.js';
  
  export let data;
  let { stations, trips } = data;

  // เรียกใช้ฟังก์ชันและเก็บผลลัพธ์
  let arrivalTime = calculateTravelTime(
    stations, 
    'สถานีกลางกรุงเทพอภิวัฒน์', 
    'สระบุรี', 
    '2024-09-25T18:00'
  );
</script>

<main>
  <h1>คำนวณเวลาเดินทาง</h1>
  <p>เวลาที่คาดว่าจะถึง: {arrivalTime}</p>
</main>
