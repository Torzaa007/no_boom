<script>
  export let data;
  let trips = data.trips2;
  let stations = data.stations;
  let staffs = data.staffs;

  let newTrip = {
    tripCode: '',
    trainCode: '',
    route: '',
    startStation: '',
    endStation: '',
    travelTime: '',
    trainNo: '',
    seatingClass: '',
    seatType1: '',
    seatCount1: '',
    seatType2: '',
    seatCount2: '',
    emId: '',
  };

  // Function to filter stations based on the selected route
  $: filteredStations = stations.filter(station =>
    station.station_id.includes(newTrip.route)
  );

   // Reactive statement to filter seat types based on the selected class
   $: seatOptions =
    newTrip.seatingClass === '1'
      ? ['seat1_room', 'seat1_1downBed', 'seat1_1upBed']
      : newTrip.seatingClass === '2'
      ? [
          'seat2_1upBed',
          'seat2_1downBed',
          'seat2_2upBed',
          'seat2_2downBed',
          'seat2_1normal',
          'seat2_2normal',
        ]
      : newTrip.seatingClass === '3'
      ? ['seat3_2normal']
      : [];

  async function addNewTrip() {
    const formData = new FormData();
    formData.append('tripId', newTrip.tripCode);
    formData.append('trainId', newTrip.trainCode);
    formData.append('route', newTrip.route);
    formData.append('start', newTrip.startStation);
    formData.append('end', newTrip.endStation);
    formData.append('fromDatetime', newTrip.travelTime);
    formData.append('trainNo', newTrip.trainNo);
    formData.append('class', newTrip.seatingClass);
    formData.append('seatType1', newTrip.seatType1);
    formData.append('seatCount1', newTrip.seatCount1);
    formData.append('seatType2', newTrip.seatType2);
    formData.append('seatCount2', newTrip.seatCount2);
    formData.append('emId', newTrip.emId);

    try {
      const response = await fetch('/staff/addtrips/?/addTrip', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.type == 'success') {
        trips = [...trips, newTrip];
        alert('Trip added successfully!');
      } else {
        alert('Error adding trip.');
      }
    } catch (error) {
      console.error('Error adding trip:', error);
      alert('An error occurred while adding the trip.');
    }
  }
</script>

<div class="min-h-screen bg-white">
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-8 text-center text-[#102C57] underline">
      เพิ่มเที่ยวโดยสาร
    </h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <input
        type="text"
        bind:value={newTrip.tripCode}
        class="border border-gray-300 rounded-md px-4 py-2 text-gray-500"
        placeholder="รหัสเที่ยวโดยสาร"
      />
      <input
        type="text"
        bind:value={newTrip.trainCode}
        class="border border-gray-300 rounded-md px-4 py-2 text-gray-500"
        placeholder="รหัสรถไฟ"
      />
      <select
        bind:value={newTrip.route}
        class="border border-gray-300 rounded-md px-4 py-2 text-gray-500"
      >
        <option value="" disabled selected hidden>เส้นทางโดยสาร</option>
        <option value="ne">ne</option>
        <option value="nl">nl</option>
        <option value="so">so</option>
        <option value="ea">ea</option>
      </select>

      <div class="flex space-x-4 col-span-2 mt-4">
        <select
          bind:value={newTrip.startStation}
          class="border border-gray-300 rounded-md px-4 py-2 text-gray-500 flex-1"
          disabled={!newTrip.route}
        >
          <option value="" disabled selected hidden>สถานีต้นทาง</option>
          {#each filteredStations as station}
            <option value={station.station_name}>{station.station_name}</option>
          {/each}
        </select>

        <select
          bind:value={newTrip.endStation}
          class="border border-gray-300 rounded-md px-4 py-2 text-gray-500 flex-1"
          disabled={!newTrip.route}
        >
          <option value="" disabled selected hidden>สถานีปลายทาง</option>
          {#each filteredStations as station}
            <option value={station.station_name}>{station.station_name}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="mt-6">
      <label class="block">
        <span>วัน/เวลา ออกเดินทาง</span>
        <input
          type="datetime-local"
          bind:value={newTrip.travelTime}
          class="border border-gray-300 rounded-md px-4 py-2 text-gray-500 w-full"
        />
      </label>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mt-6">
      <input
        type="text"
        bind:value={newTrip.trainNo}
        class="border border-gray-300 rounded-md px-4 py-2 text-gray-500"
        placeholder="รหัสขบวน"
      />
      <select
        bind:value={newTrip.seatingClass}
        class="border border-gray-300 rounded-md px-4 py-2 text-gray-500"
      >
        <option value="" disabled selected hidden>ชั้นโดยสาร</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>

      <label class="block">
        <select
          bind:value={newTrip.seatType1}
          class="border border-gray-300 rounded-md px-4 py-6 text-gray-500 w-full"
          disabled={!newTrip.seatingClass}
        >
          <option value="" disabled selected hidden>ประเภทที่นั่ง 1</option>
          {#each seatOptions as option}
            <option value={option}>{option}</option>
          {/each}
        </select>
      </label>

      <input
        type="number"
        bind:value={newTrip.seatCount1}
        class="border border-gray-300 rounded-md px-4 py-2 text-gray-500"
        placeholder="จำนวนที่นั่ง"
        disabled={!newTrip.seatingClass}
      />

      <label class="block">
        <select
          bind:value={newTrip.seatType2}
          class="border border-gray-300 rounded-md px-4 py-6 text-gray-500 w-full"
          disabled={!newTrip.seatingClass}
        >
          <option value="" disabled selected hidden>ประเภทที่นั่ง 2</option>
          {#each seatOptions as option}
            <option value={option}>{option}</option>
          {/each}
        </select>
      </label>

      <input
        type="number"
        bind:value={newTrip.seatCount2}
        class="border border-gray-300 rounded-md px-4 py-2 text-gray-500"
        placeholder="จำนวนที่นั่ง"
        disabled={!newTrip.seatingClass}
      />
    </div>

    <div class="mt-6">
      <label class="block">
        <select
          bind:value={newTrip.emId}
          class="border border-gray-300 rounded-md px-4 py-6 text-gray-500 w-1/4"
        >
          <option value="" disabled selected hidden>รหัสพนักงานตรวจตั๋วโดยสาร</option>
          {#each staffs as staff}
            <option value={staff.staff_id}>{staff.staff_id}</option>
          {/each}
        </select>
      </label>
    </div>

    <div class="flex flex-col items-center">
      <button on:click={addNewTrip} class="text-xl mt-8 bg-[#102C57] px-8 py-2.5 text-white rounded-lg hover:bg-blue-800">
        ยืนยัน
      </button>
    </div>
  </div>
</div>