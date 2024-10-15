<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms/client';

	import { UserLoginZodSchema } from '$validations/UserLoginZodSchema';
	import InputField from '$components/form/InputField.svelte';
	import SubmitButton from '$components/form/SubmitButton.svelte';
	import type { PageData } from './$types';
  import { goto } from '$app/navigation';
	export let data: PageData;

  
  function redirectToRegister() {
    goto('register');
  }

	const { enhance, form, errors, message } = superForm(data.userLoginFormData, {
		resetForm: true,
		taintedMessage: null,
		validators: UserLoginZodSchema,

		onUpdated: () => {
			if (!$message) return;

			const { alertType, alertText } = $message;

			if (alertType === 'error') {
				toast.error(alertText);
			}
		}
	});

	$: if (form?.result && !form.result.success) {
		Swal.fire({
			icon: 'error',
			title: 'Oops...',
			text: form.result.message,
		});
	}

</script>

<div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8 p-10 rounded-xl shadow-xl">
    <div class="flex justify-center items-center">
      <p class="font-bold text-3xl sm:text-4xl md:text-5xl text-[#102C57] underline decoration-2 underline-offset-8">เข้าสู่ระบบ</p>
    </div>
    <form method="post" use:enhance class="space-y-6 mt-8">
      <InputField
        type="text"
        name="email"
        label="อีเมล / ชื่อผู้ใช้งาน"
        bind:value={$form.email}
        errorMessage={$errors.email}
        class="border-2 border-[#9F9F9F] rounded-lg w-full py-3 sm:py-4 md:py-5 p-4 sm:p-5 md:p-6 text-gray-700 text-left focus:outline-none focus:ring-2 focus:ring-[#102C57] focus:border-transparent transition duration-300"
      />
      <InputField
        type="password"
        name="password"
        label="รหัสผ่าน"
        bind:value={$form.password}
        errorMessage={$errors.password}
        class="border-2 border-[#9F9F9F] rounded-lg w-full py-3 sm:py-4 md:py-5 p-4 sm:p-5 md:p-6 text-gray-700 text-left focus:outline-none focus:ring-2 focus:ring-[#102C57] focus:border-transparent transition duration-300"
      />
      <SubmitButton
        class="w-full bg-[#102C57] text-white rounded-xl py-3 px-4 hover:bg-[#1e3a6d]"
      />
    </form>
    <div class="text-center mt-6">
      <p class="text-sm text-gray-600">
        ยังไม่มีบัญชี? 
        <a
          on:click|preventDefault={redirectToRegister}
          class="text-[#102C57] hover:text-[#1e3a6d] hover:underline font-medium transition duration-300"
        >
          สมัครสมาชิก
        </a>
      </p>
    </div>
  </div>
</div>