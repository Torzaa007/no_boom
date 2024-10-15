<script>
  import { onMount } from 'svelte';
  import { calculateTravelTime } from '../../../lib/travelTimeCalculator.js';
  export let data;
  let { stations } = data;
  
  let selectedLine = '';
  let origin = '';
  let destination = '';
  let selectedDate = '';
  let allStations = [];
  let trips = [];
  let isLoading = false;
  let errorMessage = '';
  let noTrips = false;

  let originStationName = '';
  let destinationStationName = '';

  function updateStationNames() {
    const originStation = allStations.find(station => station.station_id === origin);
    const destinationStation = allStations.find(station => station.station_id === destination);

    originStationName = originStation ? originStation.station_name : 'ไม่ระบุ';
    destinationStationName = destinationStation ? destinationStation.station_name : 'ไม่ระบุ';
  }

  function formatDateTime(dateTime, onlyDate = false) {
    const date = new Date(dateTime);
    const formattedDate = date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    
    if (onlyDate) {
      return formattedDate;
    }
    
    const formattedTime = date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }).replace(':', '.');

    return `${formattedTime} น. (${formattedDate})`;
  }

  $: origin, destination, updateStationNames();

  onMount(async () => {
    await fetchStations();
  });

  async function fetchStations() {
    const response = await fetch('/customer/search/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ line: selectedLine }),
    });

    const result = await response.json();
    allStations = result.stations;
  }

  async function handleLineChange() {
    origin = '';
    destination = '';
    trips = [];
    await fetchStations();
  }

  async function searchTrips() {
    isLoading = true;
    errorMessage = '';
    noTrips = false;

    if (!selectedDate) {
      errorMessage = 'กรุณาเลือกวันที่เดินทาง';
      isLoading = false;
      return;
    }

    const response = await fetch('/customer/search/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        line: selectedLine,
        origin,
        destination,
        date: selectedDate,
      }),
    });

    const result = await response.json();

    if (result.error) {
      errorMessage = result.error;
      trips = [];
      isLoading = false;
      return;
    }

    trips = result.trips || [];

    if (trips.length === 0) {
      noTrips = true;
    }

    isLoading = false;
  }

  async function bookTrip(trip) {
    const formData = new FormData();
    formData.append('tripId', trip.trip_id);
    formData.append('tripName', trip.trip_name);
    formData.append('startStation', trip.start_name);
    formData.append('endStation', trip.end_name);
    formData.append('date', trip.from_datetime);
    formData.append('user_from_station', originStationName);
    formData.append('user_to_station', destinationStationName);


    const response = await fetch('customer/reservation', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      window.location.href = 'customer/reservation';
    } else {
      console.error('Error saving trip to session');
    }
  }


</script>

<main class="container mx-auto px-16 ">
  <h1 class="text-3xl font-bold text-left mb-4 ">ค้นหาเที่ยวโดยสาร</h1>
  <div class="bg-white shadow-md rounded px-4 pt-6 pb-8 mb-4">
    <!-- ฟอร์มการค้นหา -->
    <div class="flex flex-wrap items-center gap-8 mb-4"> <!-- ใช้ flex เพื่อจัดเรียง -->
      <div class="flex-1">
        <label class="block text-gray-700 text-sm font-bold mb-2">เส้นทางโดยสาร</label>
        <select class="shadow border rounded w-full py-2 px-3 text-gray-700 bg-gray-200" bind:value={selectedLine} on:change={handleLineChange}>
          <option value="">--เส้นทางโดยสาร--</option>
          <option value="ne">สายตะวันออกเฉียงเหนือ (NE Line)</option>
          <option value="nl">สายเหนือ (NL Line)</option>
        </select>
      </div>

      <div class="flex-1">
        <label class="block text-gray-700 text-sm font-bold mb-2">ต้นทาง</label>
        <select class="shadow border rounded w-full py-2 px-3 text-gray-700 bg-gray-200" bind:value={origin}>
          <option value="">--ต้นทาง--</option>
          {#each allStations as station}
            <option value={station.station_id}>{station.station_name}</option>
          {/each}
        </select>
      </div>

      <div class="flex-1">
        <label class="block text-gray-700 text-sm font-bold mb-2">ปลายทาง</label>
        <select class="shadow border rounded w-full py-2 px-3 text-gray-700 bg-gray-200" bind:value={destination}>
          <option value="">--ปลายทาง--</option>
          {#each allStations as station}
            <option value={station.station_id}>{station.station_name}</option>
          {/each}
        </select>
      </div>

      <div class="flex-1">
        <label class="block text-gray-700 text-sm font-bold mb-2">วันที่เดินทาง</label>
        <input type="date" class="shadow border rounded w-full py-2 px-3 text-gray-700 bg-gray-200" bind:value={selectedDate}>
      </div>
    </div>

    <div class="flex items-center justify-left mt-6">
      <button class="rounded-sm bg-[#102C57] hover:bg-blue-700 text-white font-bold py-2 px-4" on:click={searchTrips} disabled={isLoading}>
        {isLoading ? 'กำลังค้นหา...' : 'แสดงเที่ยวโดยสาร'}
      </button>
    </div>
  </div>

  <!-- แสดงข้อความข้อผิดพลาด -->
  {#if errorMessage}
    <p class="text-center text-red-500 font-bold bg-red-100 border border-red-400 rounded p-2">{errorMessage}</p>
  {/if}

  <!-- แสดงข้อความเมื่อไม่พบทริป -->
  {#if noTrips}
    <p class="text-center text-red-500 font-bold bg-red-100 border border-red-400 rounded p-2">ไม่พบข้อมูลเที่ยวโดยสารสำหรับการค้นหานี้</p>
  {/if}
  <!-- แสดงตารางทริปเมื่อมีข้อมูล -->
  {#if trips.length > 0}
    <div class="w-full border-t border-gray-300 my-4 mt-10"></div>
      {#each trips as trip}
    <div>
      <h1 class="text-xl font-md mb-6 mt-6 text-left text-gray-700">
        {trip.trip_name.substring(6)} {formatDateTime(trip.from_datetime, true)} <!-- แสดงเฉพาะวันที่ -->
      </h1>
    </div>

    <div class=" py-2 rounded-lg">
      <div class="">
        <div
          class="w-full bg-gray-200 p-6 rounded-xl shadow-md grid grid-cols-7 items-center gap-8">
          <!-- ข้อมูลการเดินทาง -->
          <div class="col-span-6 w-full">
            <p class="font-bold text-lg">
              จาก <span class="font-normal">{originStationName} -> {destinationStationName}</span>
            </p>
            <div class="grid grid-cols-2 gap-48 mt-2">
              <p class="font-bold text-lg whitespace-nowrap">
                เที่ยวโดยสาร <span class="font-normal">{trip.trip_id} {trip.start_name} -> {trip.end_name}</span>
              </p>
              <p class="font-bold text-lg gap-48">
                ประเภท <span class="font-normal">ชั้น {trip.available_classes}</span>
              </p>
            </div>
            <div class="grid grid-cols-2 gap-48 mt-2">
              <p class="font-bold text-lg">
                ออกเดินทาง <span class="font-normal">{formatDateTime(trip.from_datetime)}</span>
              </p>
              <p class="font-bold text-lg">
                ถึง <span class="font-normal">{formatDateTime(
                  calculateTravelTime(
                    stations,
                    originStationName, 
                    destinationStationName, 
                    trip.from_datetime
                  )
                )}</span>
              </p>
            </div>
          </div>

          <!-- ในแต่ละทริป -->
          <form method="POST" action="?/saveTrip">
            <!-- สร้าง bookingInfo สำหรับแต่ละทริป -->
            <input type="hidden" name="bookingInfo" value={JSON.stringify({
              tripId: trip.trip_id,
              tripName: trip.trip_name,
              startName: trip.start_name,
              endName: trip.end_name,
              fromDatetime: trip.from_datetime,
              toDatetime: calculateTravelTime(
                stations,
                originStationName, 
                destinationStationName, 
                trip.from_datetime
              ),
              availableClasses: trip.available_classes,
              user_from_station: originStationName,
              user_to_station: destinationStationName
            })}>
            <button
            type="submit"
            class="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
            จอง
            </button>
          </form>
        </div>
      </div>
    </div>
  {/each}
  {/if}

  <!-- แสดงรายละเอียดการค้นหา -->
  {#if selectedLine && origin && destination && selectedDate}
    <p class="text-center mt-4">
      คุณเลือก: {originStationName} ถึง {destinationStationName} บนสาย {selectedLine.toUpperCase()} วันที่ {selectedDate}
    </p>
  {/if}
</main>
