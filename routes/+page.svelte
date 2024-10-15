<script>
let currentIndex = 0;
    const images = ['/train4.1.png', '/train4.1.png', '/train4.1.png', '/train4.1.png'];

    // ฟังก์ชันเลื่อนภาพอัตโนมัติ
    const slideInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % images.length; // สลับภาพทุกๆ 10 วินาที
    }, 5000); // 5 วินาที

    // ฟังก์ชันคลิกที่ dot เพื่อเปลี่ยนสไลด์
    function goToSlide(index) {
        currentIndex = index;
    }
</script>

<section class="relative overflow-hidden w-full h-96">
        <div class="absolute inset-0">
            <div
                class="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
                style="background-image: url({images[currentIndex]});"
            ></div>
            <div class="absolute inset-0 "></div>
        </div>

        <div class="relative z-10 flex items-center justify-center h-full">
            <div
                class="w-full mx-auto flex-shrink-0 h-auto my-4 bg-cover bg-center transition-transform duration-1000 ease-in-out"
            >
                <img
                    src={images[currentIndex]}
                    alt="Cover home page"
                    class="object-cover rounded-md  w-full h-[22rem] transition-transform duration-1000 ease-in-out"
                />
            </div>
        </div>

        <div class="absolute bottom-4 left-0 right-0 flex justify-center z-20">
            {#each images as _, index}
                <button
                    class="w-2 h-2 mx-1 rounded-full"
                    class:bg-white={currentIndex === index}
                    class:bg-gray-400={currentIndex !== index}
                    on:click={() => goToSlide(index)}
                >
                </button>
            {/each}
        </div>
    </section>

<body class="font-sans">
    <main class="home">
        <section class="mb-20">
          <h2 class="text-3xl font-bold text-[#102C57] text-center mt-10">ENJOY YOUR DESTINATIONS WITH OURTRAINS</h2>
        </section>
        <section class="flex justify-around">
          <div class="flex flex-col content-center text-center">
            <img class="object-cover overflow-hide w-[200px] mb-5" src="/iconblack-search.png" alt="icon1">
            <button class="border border-solid border-2 border-[#102C57] text-[#102C57] font-bold py-2 px-4 rounded-lg w-full min-w-[3px]">ค้นหาเที่ยวโดยสาร</button>
          </div>

          <div class="flex flex-col content-center text-center">
            <img class="object-cover overflow-hide w-[200px] mb-5" src="/iconblack-booking.png" alt="icon2">
            <button class="border border-[#102C57]  border-2 border-solid text-[#102C57] font-bold py-2 px-4 rounded-lg w-full min-w-[3px]">รายการเที่ยวโดยสาร</button>
          </div>

          <div class="flex flex-col content-center text-center">
            <img class="object-cover overflow-hide w-[200px] mb-5" src="/iconblack-list.png" alt="icon3">
            <button class="border border-[#102C57] border-2border-solid text-[#102C57] font-bold py-2 px-4 rounded-lg w-full min-w-[3px]">จองเที่ยวโดยสาร</button>
          </div>

          <div class="flex flex-col content-center text-center">
            <img class="object-cover overflow-hide w-[200px] mb-5" src="/iconblack-change.png" alt="icon4">
            <button class="border border-[#102C57] border-2 border-solid text-[#102C57] font-bold py-2 px-4 rounded-lg w-full min-w-[3px]">เปลี่ยนแปลงเที่ยวโดยสาร</button>
          </div>
        </section>
    </main>
</body>