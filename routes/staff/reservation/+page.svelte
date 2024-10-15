<script>
    import { redirect } from '@sveltejs/kit';
    import { onMount } from 'svelte';
    import Swal from 'sweetalert2'

    let selectedSeatType = "";
    let selectedQuantity = 1;
    export let data;
    $: ({ loggedOnUserName, tripData, userInfo = {}, availableSeats, travelTimeMinutes } = data || {});

    // User editable variables with default values to prevent undefined errors
    let editedFirstname = userInfo?.firstname || '';
    let editedLastname = userInfo?.lastname || '';
    let editedPhonenumber = userInfo?.phonenumber || '';
    let isSaved = false; // New state to track if user info is saved


    // เพิ่มการคำนวณเวลาถึงปลายทาง
    $: arrivalTime = calculateArrivalTime(tripData?.fromDatetime, travelTimeMinutes);

    function saveUserInfo() {
        if (editedFirstname && editedLastname && editedPhonenumber) {
            isSaved = true; // Set to true when user info is saved
            sessionStorage.setItem('firstname', editedFirstname);
            sessionStorage.setItem('lastname', editedLastname);
            sessionStorage.setItem('phonenumber', editedPhonenumber);
            alert('ข้อมูลถูกบันทึกเรียบร้อย');
        } else {
            alert('โปรดกรอกข้อมูลให้ครบถ้วน');
        } 
    }

    function calculateArrivalTime(fromDatetime, travelTimeMinutes) {
        if (!fromDatetime || !travelTimeMinutes) return '';
        const departureTime = new Date(fromDatetime);
        const arrivalTime = new Date(departureTime.getTime() + travelTimeMinutes * 60000);
        return arrivalTime.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'});
    }

    function translateSeatType(seatType) {
        const translations = {
            'seat1_room': 'ชั้น 1 ห้องส่วนตัว',
            'seat1_1downBed': 'ชั้น 1 เตียงล่าง',
            'seat1_1upBed': 'ชั้น 1 เตียงบน',
            'seat2_1upBed': 'ชั้น 2 เตียงบน (ปรับอากาศ)',
            'seat2_1downBed': 'ชั้น 2 เตียงล่าง (ปรับอากาศ)',
            'seat2_2upBed': 'ชั้น 2 เตียงบน (พัดลม)',
            'seat2_2downBed': 'ชั้น 2 เตียงล่าง (พัดลม)',
            'seat2_1normal': 'ชั้น 2 เบาะนั่ง (ปรับอากาศ)',
            'seat2_2normal': 'ชั้น 2 เบาะนั่ง (พัดลม)',
            'seat3_2normal': 'ชั้น 3'
        };
        return translations[seatType] || seatType;
    }

    // Bind input fields to variables
    let firstname = userInfo?.firstname || "";
    let lastname = userInfo?.lastname || "";
    let phonenumber = userInfo?.phonenumber || "";
    // Calculate total price
    $: totalPrice = selectedSeatType
        ? availableSeats.find(seat => seat.seat_type === selectedSeatType)?.farePerSeat * selectedQuantity || 0
        : 0;

    function incrementQuantity() {
        if (selectedQuantity < 4) selectedQuantity++;
    }

    function decrementQuantity() {
        if (selectedQuantity > 1) selectedQuantity--;
    }

    async function confirmBooking() {
    console.log("เริ่มฟังก์ชัน confirmBooking");
    const bookingData = {
        userId: userInfo.passenger_id,
        tripId: tripData.tripId,
        seatType: selectedSeatType,
        quantity: selectedQuantity,
        totalPrice: totalPrice,
        fromStation: tripData.user_from_station,
        toStation: tripData.user_to_station
    };
    console.log("ข้อมูลการจองที่จะส่ง:", bookingData);

    try {
        const response = await fetch('reservation/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData)
        });
        console.log("สถานะการตอบกลับจากเซิร์ฟเวอร์:", response.status);
        const responseData = await response.json();

        if (response.ok) {
            console.log("การจองเสร็จสมบูรณ์ การตอบกลับจากเซิร์ฟเวอร์:", responseData);

            sessionStorage.setItem('paymentId', responseData.paymentId.toString());
            sessionStorage.setItem('totalPrice', bookingData.totalPrice.toString());

            console.log("บันทึกข้อมูลใน sessionStorage เรียบร้อย");

            // ใช้ SweetAlert เพื่อแสดงผลลัพธ์
            Swal.fire({
                icon: 'success',
                title: 'การจองเสร็จสมบูรณ์!',
                html: `
                    <p>รหัสการชำระเงิน: ${responseData.paymentId}</p>
                    <p>จำนวนเงิน: ${bookingData.totalPrice} บาท</p>
                    <p>สถานะ: รอการชำระเงิน</p>
                `,
                confirmButtonText: 'ไปยังหน้าชำระเงิน'
            }).then(() => {
                window.location.href = 'payment'; // ไปยังหน้าชำระเงินหลังจากผู้ใช้กดปุ่ม
            });
        } else {
            console.error("ข้อผิดพลาดจากเซิร์ฟเวอร์:", responseData);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'เกิดข้อผิดพลาดในการจองตั๋วโปรดตรวจสอบข้อมูลการจองให้ครบถ้วน'
            });
        }
    } catch (error) {
        console.error("เกิดข้อผิดพลาดใน confirmBooking:", error);
        Swal.fire({
            icon: 'error',
            title: 'ข้อผิดพลาดในการเชื่อมต่อ',
            text: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง'
        });
    }
}

</script>

<div class="p-8">
    <main class="">
        <h2 class="text-3xl font-bold mb-4 text-[#102C57]">จองตั๋วโดยสาร</h2>
        <p class="mb-6 text-sm text-gray-600">
            ท่านจำเป็นต้องกรอกข้อมูลต่อไปนี้ให้ครบถ้วน
            และดำเนินการชำระค่าธรรมเนียมตั๋วโดยสารภายใน 5
            นาทีหลังจากกดยืนยันการจองตั๋วโดยสาร การจองตั๋วโดยสารจึงสมบูรณ์
        </p>

        <div class="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 class="font-semibold mb-2 text-blue-800">
                เที่ยวโดยสาร {tripData.tripName}
            </h3>
            <div class="flex space-x-36">
                <p class="text-[#102C57]">
                    <span class="font-semibold">ต้นทาง</span> {tripData.user_from_station}
                </p>
                <p class="text-[#102C57]">
                    <span class="font-semibold">ปลายทาง</span> {tripData.user_to_station}
                </p>
                <p class="text-[#102C57]">
                    <span class="font-semibold">วันที่</span>
                    {new Date(tripData.fromDatetime).toLocaleDateString('th-TH')}
                </p>
                <p class="text-[#102C57]">
                    <span class="font-semibold">เวลา</span>
                    {new Date(tripData.fromDatetime).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} - 
                    {new Date(tripData.toDatetime).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}
                </p>
            </div>
        </div>
        <div class="border-t border-gray-300 my-10"></div>
        <div class="grid grid-cols-2 items-center">
            <!-- Seat type selection -->
            <h3 class="font-semibold text-gray-800 mb-4">
                ชั้นโดยสาร-ประเภทที่นั่ง
            </h3>

            <!-- Number of seats -->
            <h3 class="font-semibold text-gray-800 mb-4">จำนวนที่นั่ง</h3>

            <!-- Dropdown for seat type selection -->
            <div class="relative w-3/4">
                <select
                    bind:value={selectedSeatType}
                    class="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                >
                    <option value="" disabled selected>เลือกประเภทที่นั่ง</option>
                    {#each availableSeats as seat}
                        <option value={seat.seat_type}>{translateSeatType(seat.seat_type)} (ว่าง: {seat.available_seats})</option>
                    {/each}
                </select>
                <div
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
                >
                    <svg
                        class="fill-current h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                    ><path
                        d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                    /></svg>
                </div>
            </div>
    
            <!-- Buttons to increase/decrease number of seats -->
            <div class="flex items-center">
                <button
                    on:click={decrementQuantity}
                    class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"
                >
                    -
                </button>
                <span class="bg-gray-100 py-2 px-4">{selectedQuantity}</span>
                <button
                    on:click={incrementQuantity}
                    class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r"
                >
                    +
                </button>
            </div>
        </div>
        <div class="border-t border-gray-300 my-12"></div>

        <div class="mt-8">
            <div class="mt-8">
                <h3 class="font-semibold mb-4 text-[#102C57] text-lg">โปรดตรวจสอบข้อมูลต่อไปนี้</h3>
                <div class="grid grid-cols-2 gap-8">
                    <!-- Left Column: User Input Fields -->
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 items-center gap-4">
                            <label for="firstname" class="font-semibold text-gray-800">ชื่อ:</label>
                            <input
                                type="text"
                                id="firstname"
                                bind:value={editedFirstname}
                                class="w-full border border-gray-300 rounded px-2 py-1"
                            />
                        </div>

                        <div class="grid grid-cols-2 items-center gap-4">
                            <label for="firstname" class="font-semibold text-gray-800">นามสกุล:</label>
                            <input
                                type="text"
                                id="firstname"
                                bind:value={editedLastname}
                                class="w-full border border-gray-300 rounded px-2 py-1"
                            />
                        </div>

                        <div class="grid grid-cols-2 items-center gap-4">
                            <label for="phonenumber" class="font-semibold text-gray-800">เบอร์โทรศัพท์:</label>
                            <input
                                type="text"
                                id="phonenumber"
                                bind:value={editedPhonenumber}
                                class="w-full border border-gray-300 rounded px-2 py-1"
                            />
                        </div>
            
                        <button
                            on:click={saveUserInfo}
                            style="background-color: #102C57;"
                            class="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:-translate-y-1"
                            >
                            บันทึกข้อมูล
                        </button>
                    </div>
            
                    <!-- Right Column: Booking Details -->
                    <div class="space-y-4">
                        <p><span class="font-semibold text-gray-800">เที่ยวโดยสาร:</span> {tripData.tripName}</p>
                        <p><span class="font-semibold text-gray-800">จาก:</span> {tripData.user_from_station} ถึง {tripData.user_to_station}</p>
                        <p>
                            <span class="font-semibold text-gray-800">วันที่เดินทาง:</span> 
                            {new Date(tripData.fromDatetime).toLocaleDateString('th-TH')}
                        </p>
                        <p>
                            <span class="font-semibold text-gray-800">เวลา:</span> 
                            {new Date(tripData.fromDatetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(tripData.toDatetime).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}
                        </p>
                        <p><span class="font-semibold text-gray-800">ชั้นโดยสาร:</span> {selectedSeatType ? translateSeatType(selectedSeatType) : '-'}</p>
                        <p><span class="font-semibold text-gray-800">จำนวน:</span> {selectedQuantity}</p>
                        <p>
                            <span class="font-semibold text-gray-800">ราคาต่อที่นั่ง:</span> 
                            {selectedSeatType 
                                ? availableSeats.find(seat => seat.seat_type === selectedSeatType)?.farePerSeat.toFixed(2) 
                                : '-'} บาท
                        </p>
                        <p><span class="font-semibold text-gray-800">ราคารวม:</span> {totalPrice.toFixed(2)} บาท</p>
                    </div>
                </div>
            </div>
            

            {#if isSaved}
            <button
                style="background-color: #102C57;"
                class="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:-translate-y-1"
                on:click={confirmBooking}
            >
                ยืนยันการจองตั๋วโดยสาร
            </button>
        {/if}
    </main>
</div>