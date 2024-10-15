<script lang="ts">
  import { onMount } from 'svelte';
  import { redirect } from '@sveltejs/kit';

  let paymentId: string | null = '';
  let totalPrice: string | null;

  onMount(() => {
    paymentId = sessionStorage.getItem('paymentId') || '';
    totalPrice = sessionStorage.getItem('totalPrice');
  });

  let email = '';
  let firstName = '';
  let lastName = '';
  let cardNumber = '';
  let expiryDate = '';
  let cvc = '';
  let selectedPaymentMethod = ''; 
  let countdown = 300;
  let countdownInterval: NodeJS.Timeout;

  $: if (selectedPaymentMethod === 'PromptPay' && !countdownInterval) {
    startCountdown();
  }

  function startCountdown() {
    countdownInterval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        // Handle timeout case
      }
    }, 1000);
  }

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')} | ${remainingSeconds.toString().padStart(2, '0')}`;
  }

  async function submitPayment(event: Event) {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const response = await fetch(
        form.action, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Use goto for client-side navigation
        throw redirect(
			route('/ticket')
		  );      
      } else {
        console.error(result.message);
        // Handle the failure case (e.g., show an error message)
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      // Handle network errors or other exceptions
    }
  }
</script>
<!-- HTML Section -->
<!-- <div class="mb-2">
  {#if paymentId}
    <p>รหัสการชำระเงิน: {paymentId}</p>
  {:else}
    <p>ไม่พบรหัสการชำระเงิน</p>
  {/if}
</div> -->
<div class="min-h-screen bg-gradient-to-br from-blue-100 flex items-center justify-center p-8">
  <div class="w-full max-w-7xl bg-white rounded-xl shadow-2xl overflow-hidden">
    {#if paymentId}
      <div class="flex flex-col lg:flex-row">
        <!-- Payment Form Section -->
        <div class="w-full lg:w-1/2 p-8">
          <form method="POST" action="?/simulatePayment" class="space-y-6">
            <input type="hidden" name="reserved_seat_id" value={paymentId} />
            <input type="hidden" name="payment_id" value={paymentId} />
            
            <div class="mb-6">
              <label for="payment-method" class="block mb-2 text-[#102C57] font-extrabold text-2xl">เลือกวิธีการชำระเงิน</label>
              <div class="relative">
                <select id="payment-method" name="payment_method" class="w-full p-4 bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none" bind:value={selectedPaymentMethod}>
                  <option value="">-- กรุณาเลือกวิธีการชำระเงิน --</option>
                  <option value="PromptPay">QR พร้อมเพย์</option>
                  <option value="MasterCard">บัตรเครดิต/เดบิต</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg class="fill-current h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
            
            {#if selectedPaymentMethod}
              <div class="border-t border-gray-300 my-8"></div>
      
              {#if selectedPaymentMethod === 'PromptPay'}
                <!-- PromptPay section -->
                <div class="mb-8">
                  <p class="block mb-6 text-[#102C57] font-extrabold text-3xl">ช่องทางชำระเงินด้วย PromptPay</p>
                  <div class="flex flex-col items-center space-y-6 bg-blue-50 p-8 rounded-xl">
                    <img src="https://www.theodoostore.com/web/image/app/10392/app_icon" alt="PromptPay QR" class="w-64 h-64 object-contain shadow-lg rounded-lg" />    
                    <p class="text-3xl font-bold text-[#590606] bg-red-100 px-6 py-3 rounded-full shadow-md">ชำระภายใน: {formatTime(countdown)}</p>
                  </div>
                </div>
              {:else if selectedPaymentMethod === 'MasterCard'}
                <!-- Credit/Debit section -->
                <div class="mb-8">
                  <p class="block mb-6 text-[#102C57] font-extrabold text-3xl">ข้อมูลส่วนบุคคล</p>
                  <div class="border-2 border-dashed border-[#9747FF] rounded-xl p-8 space-y-6 bg-purple-50">
                    <!-- Email -->
                    <div>
                      <input
                        type="email"
                        name="email"
                        placeholder="อีเมล"
                        class="w-full p-4 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-lg"
                        bind:value={email}
                        required
                      />
                    </div>
        
                    <!-- Name -->
                    <div class="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="firstName"
                        placeholder="ชื่อจริง"
                        class="p-4 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-lg"
                        bind:value={firstName}
                        required
                      />
                      <input
                        type="text"
                        name="lastName"
                        placeholder="นามสกุล"
                        class="p-4 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-lg"
                        bind:value={lastName}
                        required
                      />
                    </div>
        
                    <!-- Card Number -->
                    <div>
                      <input
                        type="text"
                        name="cardNumber"
                        placeholder="หมายเลขบัตร"
                        class="w-full p-4 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-lg"
                        bind:value={cardNumber}
                        required
                      />
                    </div>
        
                    <!-- Expiry Date and CVC -->
                    <div class="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="expiryDate"
                        placeholder="วันหมดอายุ"
                        class="p-4 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-lg"
                        bind:value={expiryDate}
                        required
                      />
                      <input
                        type="text"
                        name="cvc"
                        placeholder="CVC / หมายเลขหลังบัตร"
                        class="p-4 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-lg"
                        bind:value={cvc}
                        required
                      />
                    </div>
                  </div>
                </div>
              {/if}
      
              <!-- Payment Button -->
              <div class="text-right">
                <button type="submit" class="bg-[#102C57] text-white text-xl py-4 px-8 rounded-lg hover:bg-[#1a3d7c] transition duration-300 ease-in-out transform hover:scale-105 shadow-lg">
                  ชำระเงิน
                </button>
              </div>
            {/if}
          </form>
        </div>
      
        <!-- Image and Text Section -->
        <div class="w-full lg:w-1/2 bg-gradient-to-br from-blue-400 to-purple-500 p-12 flex items-center justify-center">
          <div class="text-center">
            <h2 class="text-white text-4xl lg:text-2xl font-black mb-8 leading-tight">
              <span class="block mb-2">คุณเตรียมตัวเดินทาง</span>
              <span class="block underline decoration-wavy decoration-yellow-300">
                เราจะพาคุณไปถึงจุดหมาย
              </span>
            </h2>
            <div class="bg-white p-8 rounded-full shadow-xl inline-block">
              <img
                src="https://cdn-icons-png.flaticon.com/512/235/235861.png"
                alt="Map Icon"
                class="w-48 h-48 lg:w-64 lg:h-64 object-contain animate-pulse"
              />
            </div>
          </div>
        </div>
      </div>
    {:else}
      <p class="text-red-600 font-bold text-2xl text-center p-8">ไม่พบ Payment ID</p>
    {/if}
  </div>
</div>