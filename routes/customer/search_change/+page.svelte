<script>
  import { onMount } from 'svelte';
  import { calculateTravelTime } from '../../../lib/travelTimeCalculator.js';
  export let data;
  let { fromStationName, toStationName, route, stations, old_seat_id} = data;
  
  let selectedDate = '';
  let trips = [];
  let isLoading = false;
  let errorMessage = '';
  let noTrips = false;

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

  async function searchTrips() {
    isLoading = true;
    errorMessage = '';
    noTrips = false;

    if (!selectedDate) {
      errorMessage = 'กรุณาเลือกวันที่เดินทาง';
      isLoading = false;
      return;
    }

    const response = await fetch('search_change/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fromStationName,
        toStationName,
        route,
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
    formData.append('user_from_station', fromStationName);
    formData.append('user_to_station', toStationName);
    formData.append("old_seat_id", old_seat_id);

    const response = await fetch('customer/reservation_change', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      window.location.href = 'customer/reservation_change';
    } else {
      console.error('Error saving trip to session');
    }
  }
</script>

<main class="container mx-auto px-16 ">
  <h1 class="text-3xl font-bold text-left mb-4 ">ค้นหาเที่ยวโดยสาร</h1>
  <div class="bg-white shadow-md rounded px-4 pt-6 pb-8 mb-4">
    <!-- ฟอร์มการค้นหา -->
    <div class="flex flex-wrap items-center gap-8 mb-4">
      <div class="flex-1">
        <label class="block text-gray-700 text-sm font-bold mb-2">เส้นทางโดยสาร</label>
        <input type="text" class="shadow border rounded w-full py-2 px-3 text-gray-700 bg-gray-200" value={route === 'ne' ? 'สายตะวันออกเฉียงเหนือ (NE Line)' : 'สายเหนือ (NL Line)'} disabled>
      </div>
    
      <div class="flex-1">
        <label class="block text-gray-700 text-sm font-bold mb-2">ต้นทาง</label>
        <input type="text" class="shadow border rounded w-full py-2 px-3 text-gray-700 bg-gray-200" value={fromStationName} disabled>
      </div>
    
      <div class="flex-1">
        <label class="block text-gray-700 text-sm font-bold mb-2">ปลายทาง</label>
        <input type="text" class="shadow border rounded w-full py-2 px-3 text-gray-700 bg-gray-200" value={toStationName} disabled>
      </div>
    
      <div class="flex-1">
        <label class="block text-gray-700 text-sm font-bold mb-2">วันที่เดินทาง</label>
        <input type="date" class="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white" bind:value={selectedDate}>
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
          {trip.trip_name.substring(6)} {formatDateTime(trip.from_datetime, true)}
        </h1>
      </div>

      <div class="py-2 rounded-lg">
        <div class="">
          <div class="w-full bg-gray-200 p-6 rounded-xl shadow-md grid grid-cols-7 items-center gap-8">
            <!-- ข้อมูลการเดินทาง -->
            <div class="col-span-6 w-full">
              <p class="font-bold text-lg">
                จาก <span class="font-normal">{fromStationName} -> {toStationName}</span>
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
                      fromStationName, 
                      toStationName, 
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
                  fromStationName, 
                  toStationName, 
                  trip.from_datetime
                ),
                availableClasses: trip.available_classes,
                user_from_station: fromStationName,
                user_to_station: toStationName,
                old_seat_id: old_seat_id
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
</main>