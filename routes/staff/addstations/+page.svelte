<script>
  export let data;
  let stations = data.stations;

  let newStation = {
    station_id: '',
    station_name: '',
    station_address: '',
    time_use: '',
    station_status: ''
  };

  async function addNewStation() {
    const formData = new FormData();
    formData.append('station_id', newStation.station_id);
    formData.append('station_name', newStation.station_name);
    formData.append('station_address', newStation.station_address);
    formData.append('time_use', newStation.time_use);
    formData.append('station_status', newStation.station_status);

    try {
      const response = await fetch('/staff/addstations/?/addStation', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.type == 'success') {
        stations = [...stations, newStation];  // Add the new trip to the list
        alert('Station added successfully!');
      } else {
        alert('Error adding station.');
      }
    } catch (error) {
      console.error('Error adding station:', error);
      alert('An error occurred while adding the station.');
    }
  }
  </script>
 
  <div class="flex px-8 lg:px-12 justify-center bg-white min-h-screen">
    <div class="container mx-auto p-4">
        <h1 class="text-3xl font-bold mb-8 text-center text-[#102C57] underline">เพิ่มสถานี</h1>
        <div class="grid grid-cols-5 gap-4">
          <input
            type="text"
            bind:value={newStation.station_id}
            class="border border-gray-300 rounded-md px-4 py-6 text-gray-500"
            placeholder="รหัสสถานี"
          />
          <input
            type="text"
            bind:value={newStation.station_name}
            class="border border-gray-300 rounded-md px-4 py-6 text-gray-500"
            placeholder="ชื่อสถานี"
          />
          <input
            type="text"
            bind:value={newStation.station_address}
            class="border border-gray-300 rounded-md px-4 py-6 text-gray-500"
            placeholder="ที่อยู่สถานี"
          />
          <input
            type="text"
            bind:value={newStation.time_use}
            class="border border-gray-300 rounded-md px-4 py-6 text-gray-500"
            placeholder="ระยะเวลา"
          />
          <input
            type="number"
            bind:value={newStation.station_status}
            class="border border-gray-300 rounded-md px-4 py-6 text-gray-500"
            placeholder="สถานะการใช้งาน"
          />
        </div>
        <div class="flex justify-center items-center">
        <button on:click={addNewStation} class=" text-xl mt-8 bg-[#102C57] px-8 py-2.5 text-white rounded-lg hover:bg-blue-800">ยืนยัน</button>
      </div>
      </div>
  </div>