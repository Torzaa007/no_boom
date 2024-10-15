<script>
  import { fade } from 'svelte/transition';
  import { page } from '$app/stores';
  import { Html5Qrcode } from 'html5-qrcode';

  
  export let data;

  let seatP = data.seat;
  let videoElement;
  let isCameraOpen = false;
  let qrCodeScanner;
  let qrData = {};

  console.log(seatP)

  let stationsQ = data.stationsQ;
  let currentTab = 'ตรวจตั๋วโดยสาร'; // ตั้งค่า tab เริ่มต้น

  let from_datetime = $page.url.searchParams.get('from_datetime') || '';
  let arrivalTime = $page.url.searchParams.get('arrivalTime') || '';
  let trip_id = $page.url.searchParams.get('trip_id') || '';
  let start_id = $page.url.searchParams.get('start_id') || '';
  let end_id = $page.url.searchParams.get('end_id') || '';
  let start = $page.url.searchParams.get('start') || '';
  let end = $page.url.searchParams.get('end') || '';
  let selectedPrice = 0;
  let price = parseInt(selectedPrice) || 0; // แปลงค่าเป็น int ตั้งแต่เริ่มต้น
  let selectedSeats = '1';  // จำนวนที่นั่ง (string)
  let selectedStartStation = start_id;
  let selectedEndStation = end_id;
  let trip_class = $page.url.searchParams.get('class') || '';
  let trip_name = $page.url.searchParams.get('trip_name') || '';
  $: price = parseInt(selectedPrice) || 0;
  $: totalPrice = price * parseInt(selectedSeats); // คำนวณราคารวม


  $: {
  console.log(`Selected Price (int): ${price}`);   
  console.log(`Selected Seats: ${selectedSeats}`);   
  console.log(`Total Price: ${totalPrice}`);  
}



  console.log(selectedPrice)
  function changeTab(tabName) {
    currentTab = tabName;
  }

  function confirmTicket() {
    try {
      const query = new URLSearchParams({
        trip_name: trip_name, 
        trip_class: trip_class,
        seats: selectedSeats.toString(),
        start_station: selectedStartStation,
        price: totalPrice.toString(),
        end_station: selectedEndStation,
        from_datetime: from_datetime,
        arrivalTime: arrivalTime,
        trip_id: trip_id,
        start: start,
        end: end,
        class: trip_class
      }).toString();

      window.location.href = `/staff/check/check2/confirm_ticket?${query}`;
    } catch (error) {
      console.error("Error occurred while confirming the ticket:", error);
      alert("เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองอีกครั้ง");
    }
  }

  async function sendQrDataToServer(qrData) {
    try {
      const response = await fetch('/staff/check/check2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData }),
      });

      if (!response.ok) {
        throw new Error('Failed to send QR data to the server');
      }

      const result = await response.json();
      alert(`ผลลัพธ์จากเซิร์ฟเวอร์: ${result.message}`);
    } catch (error) {
      console.error('Error sending QR data:', error);
      alert('ตั๋วถูกใช้ไปแล้ว หรือ เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองอีกครั้ง');
    }
  }

  // ฟังก์ชันเปิดกล้อง
  async function openCamera() {
    try {
      if (!qrCodeScanner) {
        qrCodeScanner = new Html5Qrcode("reader"); // ระบุ div ที่จะแสดงกล้อง
      }

      await qrCodeScanner.start(
        { facingMode: "environment" }, // ใช้กล้องหลัง
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          console.log("QR Code scanned:", decodedText);
          qrData = decodedText;
          console.log(qrData)
          alert(`QR Code: ${qrData}`);
          sendQrDataToServer(qrData); // ส่งข้อมูลไปยังเซิร์ฟเวอร์
          closeCamera();
        }
      );

      isCameraOpen = true;
    } catch (error) {
      console.error("ไม่สามารถเปิดกล้องได้:", error);
      alert("ไม่สามารถเปิดกล้องได้ กรุณาลองใหม่");
    }
  }
  
  // ฟังก์ชันปิดกล้อง
  function closeCamera() {
    let stream = videoElement.srcObject;
    if (stream) {
      let tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
    videoElement.srcObject = null;
    isCameraOpen = false;
  }
</script>

<div class="min-h-screen bg-white py-12">
  <div class="text-center">
    <h1 class="text-2xl font-bold text-[#102C57]">เที่ยวโดยสาร {trip_id} / {start} - {end}</h1>
  </div>

  <div class="flex justify-center mt-4">
    <!-- ปุ่มสลับ tab -->
    <button 
      on:click={() => changeTab('ตรวจตั๋วโดยสาร')} 
      class="px-6 py-2 text-lg font-bold text-[#102C57]"
      class:bg-gray-300={currentTab === 'ตรวจตั๋วโดยสาร'}>
      ตรวจตั๋วโดยสาร
    </button>
    <span class="px-2 text-4xl">|</span>
    <button 
      on:click={() => changeTab('ออกตั๋วโดยสาร')} 
      class="px-6 py-2 text-lg font-bold text-[#102C57]"
      class:bg-gray-300={currentTab === 'ออกตั๋วโดยสาร'}>
      ออกตั๋วโดยสาร
    </button>
  </div>

  <div class="container mx-auto mt-4 p-6 border border-gray-400 rounded-md bg-gray-300 max-w-md">
    {#if currentTab === 'ตรวจตั๋วโดยสาร'}
      <div in:fade={{ duration: 400 }}>
        <p class="text-lg font-bold text-[#102C57]">โปรดสแกน QR code หรือนำกล้องส่องไปที่ตั๋ว</p>
          <!-- วิดีโอที่จะแสดงผลการถ่ายจากกล้อง -->
          <div in:fade={{ duration: 400 }}>
            <div id="reader" class="w-128 h-128 mt-4 border-2 border-gray-300">
              <video bind:this={videoElement} autoplay playsinline class=" mt-4 border-2 border-gray-300"></video>
            </div>
          </div>
      </div>
      <button on:click={openCamera} class="bg-[#102C57] text-white px-6 py-2 rounded-md mt-4">เปิดกล้อง</button>
    {/if}

    {#if currentTab === 'ออกตั๋วโดยสาร'}
      <div in:fade={{ duration: 400 }}>
        <h3 class="text-lg font-bold text-[#102C57]">เที่ยวโดยสาร</h3>
        <div>
          <p class="mt-4 text-gray-700">จำนวนที่นั่ง</p>
          <select bind:value={selectedSeats} class="border rounded text-sm">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </div>
        <div>
          <p class="text-gray-700">สถานีต้นทาง</p>
          <select bind:value={selectedStartStation} class="border rounded text-sm">
            <option value="" disabled selected hidden>โปรดเลือกสถานีต้นทาง</option>
            {#each stationsQ as station}
              <option value={station.station_name}>{station.station_name}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <p class="text-gray-700">สถานีปลายทาง</p>
          <select bind:value={selectedEndStation} class="border rounded text-sm">
            <option value="" disabled selected hidden>โปรดเลือกสถานีปลายทาง</option>
            {#each stationsQ as station}
              <option value={station.station_name}>{station.station_name}</option>
            {/each}
          </select>
        </div>
        <div>
          <p> ราคา </p>
          <select bind:value={selectedPrice} class="border rounded text-sm">
            {#each seatP as seat}
              <option value={seat.price}>{seat.price}</option>
            {/each}
          </select>
        </div>
        
      </div>

      <div class="mt-8">
        <button on:click={confirmTicket} class="bg-[#102C57] text-white px-6 py-2 rounded-md">ยืนยัน</button>
      </div>
    {/if}
  </div>
</div>

<style>
  button {
    transition: background-color 0.3s ease-in-out;
  }
  video {
    display: block;
    margin: 20px auto;
  }
</style>
