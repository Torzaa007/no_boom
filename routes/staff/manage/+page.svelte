<script>
  export let data;
  let trips = data.trips2;
  let stations = data.stations;
  let editingTripId = null;
  let editingStationId = null;
  let showAddTripForm = false;  // Toggle visibility of the Add Trip form
  let showAddStationForm = false
  let groupedStations = {};

  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];
    const stationId = station['station_id'];
    const stationName = station['station_name'];
    const timeInSeconds = timeToSeconds(station['time_use']);

    // Extract prefix based on first underscore ('_')
    const prefix = stationId.split('_')[1];

    // Initialize the array for this prefix if it doesn't exist
    if (!groupedStations[prefix]) {
      groupedStations[prefix] = [];
    }

    // Add station data to the appropriate group
    groupedStations[prefix].push([stationId, stationName, timeInSeconds]);
  }

  let lstLine = Object.keys(groupedStations)
  let locationDict = {}

  for (let i = 0; i < lstLine.length; i++) {
    let temLst = [];
    for (let j = 0; j < groupedStations[lstLine[i]].length; j++) {
        temLst.push(groupedStations[lstLine[i]][j][1]);
      }
    locationDict[lstLine[i]] = temLst;
  }

  let newTrip = {
    trip_id: '',
    start: '',
    end: '',
    from_datetime: '',
    arrivalTime: '',
    class: '',
    seats: '',
    staff_id: ''
  };

  let newStation = {
    station_id: '',
    station_name: '',
    station_address: '',
    time_use: '',
    station_status: ''
  };
  function timeToSeconds(timeStr) {
  // Handle null or undefined input
  if (!timeStr) {
    console.error('Error: No input provided');
    return null;
  }

  // Check if the input is a string
  if (typeof timeStr !== 'string') {
    console.error('Error: Input must be a string');
    return null;
  }

  const parts = timeStr.split(':');

  // Check if the input has exactly three parts (HH:MM:SS)
  if (parts.length !== 3) {
    console.error('Error: Invalid time format. Expected format: HH:MM:SS');
    return null;
  }

  const [hours, minutes, seconds] = parts.map(Number);

  // Ensure all parts are valid numbers
  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
    console.error('Error: Time values must be numbers.');
    return null;
  }

  // Calculate and return total seconds
  return (hours * 3600) + (minutes * 60) + seconds;
}

  function editTrip(tripId) {
    editingTripId = tripId;
  }
  function findTime(start, end) {
  for (let i = 0; i < lstLine.length; i++) {
    if (locationDict[lstLine[i]].includes(start) && locationDict[lstLine[i]].includes(end)) {

      let stations = groupedStations[lstLine[i]];
      stations.sort((a, b) => {
        const numA = parseInt(a[0].split('_')[2]); // Extract the number from 'st_nl_xx'
        const numB = parseInt(b[0].split('_')[2]);
        return numA - numB; // Compare the numbers
      });


      // Find the indices of the start and end stations
      let startIndex = stations.findIndex(station => station[1] === start);
      let endIndex = stations.findIndex(station => station[1] === end);

      let totalTime = 0;

      if (startIndex < endIndex) {
        // Forward trip (start comes before end)
        for (let j = startIndex + 1; j <= endIndex; j++) {
          totalTime += stations[j][2]; // Add the time
        }
      } else if (startIndex > endIndex) {
        // Reverse trip (end comes before start)
        for (let j = startIndex; j >= endIndex; j--) {
          totalTime += stations[j][2]; // Add the time
        }
      }

      return totalTime;
    }
  }
}

for (let i = 0; i < trips.length; i++) {
    let dateTime = new Date(trips[i].from_datetime); // Your initial date-time
    let secondsToAdd = findTime(trips[i].start, trips[i].end);
    dateTime.setSeconds(dateTime.getSeconds() + secondsToAdd);

    // Use toLocaleString to preserve local time
    let result = dateTime.toLocaleString('sv-SE', { // 'sv-SE' gives "YYYY-MM-DDTHH:MM"
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    let dateTime2 = trips[i].from_datetime; // The original date-time string
    let formattedDateTime = dateTime2.replace('T', ' '); // Replace 'T' with a space

    // Remove the seconds and format the string
    trips[i]["from_datetime"] = formattedDateTime;
    trips[i]["arrivalTime"] = result.replace(',','').slice(0, 16); // Format to "YYYY-MM-DDTHH:MM"
}


  function editStation(stationId) {
    editingStationId = stationId;
  }

  async function saveTrip(tripId) {
    let st_name = []
    for (let i = 0; i < stations.length; i++) {
      st_name.push(stations[i]["station_name"]);
    }
    const formData = new FormData();
    const trip = trips.find(t => t.trip_id === tripId);
    formData.append('tripId', tripId);
    formData.append('start', trip.start);
    formData.append('end', trip.end);
    formData.append('fromDatetime', trip.from_datetime);
    formData.append('staff', trip.staff_id);

    if ((st_name.includes(trip.start)) && (st_name.includes(trip.end))) {

      try {
          const response = await fetch('/staff/manage/?/updateTrip', {
              method: 'POST',
              body: formData
          });

          const result = await response.json();

          // Log the result for debugging
          console.log('Result from server:', result);
          if (result.type == 'success') {
              alert('Trip updated successfully!');
          } else {
              alert('error.');
          }

      } catch (error) {
          console.error('Fetch error:', error);
          alert('An error occurred while updating the trip.');
      }

      editingTripId = null; // Exit edit mode
  }

  else {
    alert('กรุณากรอกสถานี ต้นทาง/ปลายทาง ให้ถูกต้อง');
  }
}

async function saveStation(stationId) {
    let st_name = []
    for (let i = 0; i < stations.length; i++) {
      st_name.push(stations[i]["station_name"]);
    }
    const formData = new FormData();
    const station = stations.find(s => s.station_id === stationId);
    formData.append('stationId', stationId);
    formData.append('name', station.station_name);
    formData.append('address', station.station_address);
    formData.append('time', station.time_use);
    formData.append('status', station.statio_status);

    if (st_name.includes(station.station_name)) {

      try {
          const response = await fetch('/staff/manage/?/updateStation', {
              method: 'POST',
              body: formData
          });

          const result = await response.json();

          // Log the result for debugging
          console.log('Result from server:', result);
          if (result.type == 'success') {
              alert('Station updated successfully!');
          } else {
              alert('error.');
              //console.log(stations[0])
          }

      } catch (error) {
          console.error('Fetch error:', error);
          alert('An error occurred while updating the station.');
      }

      editingStationId = null; // Exit edit mode
  }

  else {
    alert('กรุณากรอกชื่อสถานีให้ถูกต้อง');
  }
}

  async function deleteTrip(tripId) {
    if (editingTripId === tripId) {
      alert("คุณกำลังแก้ไขเที่ยวโดยสารอยู่ กรุณาออกจากการแก้ไขเที่ยวโดยสาร ก่อนลบเที่ยวโดยสาร");
      return;
    }

    const confirmDelete = confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเที่ยวโดยสารนี้?");
    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch('/staff/manage/?/deleteTrip', {
        method: 'POST',
        body: new URLSearchParams({ tripId })
      });

      const result = await response.json();

      if (result.type == 'success') {
        trips = trips.filter(trip => trip.trip_id !== tripId);
        alert("ลบเที่ยวโดยสารสำเร็จ");
      } else {
        alert("เกิดข้อผิดพลาดในการลบเที่ยวโดยสาร");
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert("เกิดข้อผิดพลาดในการลบเที่ยวโดยสาร");
    }
  }

  async function deleteStation(stationId) {
    if (editingStationId === stationId) {
      alert("คุณกำลังแก้ไขสถานีรถไฟอยู่ กรุณาออกจากการแก้ไขสถานีรถไฟ ก่อนลบสถานีรถไฟ");
      return;
    }

    const confirmDelete = confirm("คุณแน่ใจหรือไม่ว่าต้องการลบสถานีรถไฟนี้?");
    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch('/staff/manage/?/deleteStation', {
        method: 'POST',
        body: new URLSearchParams({ stationId })
      });

      const result = await response.json();

      if (result.type == 'success') {
        stations = stations.filter(station => station.station_id !== stationId);
        alert("ลบสถานีรถไฟสำเร็จ");
      } else {
        alert("เกิดข้อผิดพลาดในการลบสถานีรถไฟ");
      }
    } catch (error) {
      console.error('Error deleting station:', error);
      alert("เกิดข้อผิดพลาดในการลบสถานีรถไฟ");
    }
  }

  // Toggle visibility of the Add Trip form
  function toggleAddTripForm() {
    showAddTripForm = !showAddTripForm;
  }

  function toggleAddStationForm() {
    showAddStationForm = !showAddStationForm;
  }
</script>

<div class="flex justify-center px-8 lg:px-12 min-h-screen bg-white">
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold text-center text-[#102C57] underline mb-8">
      จัดการเที่ยวโดยสาร
    </h1>
    <h2 class="text-xl font-bold mb-4 text-[#102C57]">เที่ยวโดยสารปัจจุบัน</h2>

    <!-- Trip Management Table -->
    <section class="overflow-auto h-96">
      <table class="w-full text-left border-collapse table-auto whitespace-nowrap">
        <thead class="sticky top-0 bg-gray-200">
          <tr>
            <th class="px-4 py-2">รหัสเที่ยวโดยสาร</th>
            <th class="px-4 py-2">ต้นทาง</th>
            <th class="px-4 py-2">ปลายทาง</th>
            <th class="px-4 py-2">วัน / เวลาที่ออก</th>
            <th class="px-4 py-2">เวลาที่ถึง</th>
            <th class="px-4 py-2">ชั้นโดยสาร</th>
            <th class="px-4 py-2">จำนวนที่นั่ง</th>
            <th class="px-4 py-2">พนักงานตรวจ</th>
            <th class="px-4 py-2">จัดการเที่ยวโดยสาร</th>
          </tr>
        </thead>
        <tbody>
          {#each trips as trip}
            <tr class="even:bg-gray-100">
              <td class="border px-4 py-2">{trip.trip_id}</td>
              <td class="border px-4 py-2">
                {#if editingTripId === trip.trip_id}
                  <input type="text" bind:value={trip.start} class="w-full border p-1" />
                {:else}
                  {trip.start}
                {/if}
              </td>
              <td class="border px-4 py-2">
                {#if editingTripId === trip.trip_id}
                  <input type="text" bind:value={trip.end} class="w-full border p-1" />
                {:else}
                  {trip.end}
                {/if}
              </td>
              <td class="border px-4 py-2">
                {#if editingTripId === trip.trip_id}
                  <input type="datetime-local" bind:value={trip.from_datetime} class="w-full border p-1" />
                {:else}
                  {trip.from_datetime}
                {/if}
              </td>
              <td class="border px-4 py-2">{trip.arrivalTime}</td>
              <td class="border px-4 py-2">{trip.available_classes}</td>
              <td class="border px-4 py-2">{trip.seats}</td>
              <td class="border px-4 py-2">
                {#if editingTripId === trip.trip_id}
                  <input type="text" bind:value={trip.staff_id} class="w-full border p-1" />
                {:else}
                  {trip.staff_id}
                {/if}
              </td>
              <td class="border px-4 py-2 flex flex-col sm:flex-row">
                {#if editingTripId === trip.trip_id}
                  <button
                    on:click={() => saveTrip(trip.trip_id)}
                    class="w-full sm:w-32 bg-green-500 text-white rounded px-4 py-2 mb-2 sm:mr-2">
                    บันทึก
                  </button>
                {:else}
                  <button
                    on:click={() => editTrip(trip.trip_id)}
                    class="w-full sm:w-32 bg-[#102C57] text-white rounded px-4 py-2 mb-2 sm:mr-2">
                    แก้ไข
                  </button>
                {/if}
                <button
                  on:click={() => deleteTrip(trip.trip_id)}
                  class="w-full sm:w-32 bg-red-500 text-white rounded px-4 py-2">
                  ลบเที่ยวโดยสาร
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>

    <!-- Add Trip Button -->
    <div class="flex justify-center mt-10">
      <a
        href="/staff/addtrips"
        class="w-1/2 sm:w-1/6 text-center bg-[#102C57] text-white rounded px-4 py-2">
        เพิ่มเที่ยวโดยสาร
      </a>
    </div>

    <h2 class="text-xl font-bold mt-12 mb-4 text-[#102C57]">สถานีรถไฟ</h2>

    <!-- Station Management Table -->
    <section class="overflow-auto h-96">
      <table class="w-full text-left border-collapse table-auto whitespace-nowrap">
        <thead class="sticky top-0 bg-gray-200">
          <tr>
            <th class="px-4 py-2">รหัสสถานี</th>
            <th class="px-4 py-2">ชื่อสถานี</th>
            <th class="px-4 py-2">ที่อยู่</th>
            <th class="px-4 py-2">ระยะเวลา</th>
            <th class="px-4 py-2">สถานะการใช้งาน</th>
            <th class="px-4 py-2">จัดการสถานีรถไฟ</th>
          </tr>
        </thead>
        <tbody>
          {#each stations as station}
            <tr class="even:bg-gray-100">
              <td class="border px-4 py-2">
                {#if editingStationId === station.station_id}
                  <input type="text" bind:value={station.station_id} class="w-full border p-1" />
                {:else}
                  {station.station_id}
                {/if}
              </td>
              <td class="border px-4 py-2">
                {#if editingStationId === station.station_id}
                  <input type="text" bind:value={station.station_name} class="w-full border p-1" />
                {:else}
                  {station.station_name}
                {/if}
              </td>
              <td class="border px-4 py-2">
                {#if editingStationId === station.station_id}
                  <input type="text" bind:value={station.station_address} class="w-full border p-1" />
                {:else}
                  {station.station_address}
                {/if}
              </td>
              <td class="border px-4 py-2">
                {#if editingStationId === station.station_id}
                  <input type="datetime-local" bind:value={station.time_use} class="w-full border p-1" />
                {:else}
                  {station.time_use}
                {/if}
              </td>
              <td class="border px-4 py-2">
                {#if editingStationId === station.station_id}
                  <input type="text" bind:value={station.station_status} class="w-full border p-1" />
                {:else}
                  {station.station_status}
                {/if}
              </td>
              <td class="border px-4 py-2 flex flex-col sm:flex-row justify-center items-center">
                {#if editingStationId === station.station_id}
                  <button
                    on:click={() => saveStation(station.station_id)}
                    class="w-full sm:w-32 bg-green-500 text-white rounded px-4 py-2 mb-2 sm:mr-2">
                    บันทึก
                  </button>
                {:else}
                  <button
                    on:click={() => editStation(station.station_id)}
                    class="w-full sm:w-32 bg-[#102C57] text-white rounded px-4 py-2 mb-2 sm:mr-2">
                    แก้ไข
                  </button>
                {/if}
                <button
                  on:click={() => deleteStation(station.station_id)}
                  class="w-full sm:w-32 bg-red-500 text-white rounded px-4 py-2">
                  ลบสถานีรถไฟ
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>

    <!-- Add Station Button -->
    <div class="flex justify-center mt-10">
      <a
        href="/staff/addstations"
        class="w-1/2 sm:w-1/6 text-center bg-[#102C57] text-white rounded px-4 py-2">
        เพิ่มสถานีรถไฟ
      </a>
    </div>
  </div>
</div>