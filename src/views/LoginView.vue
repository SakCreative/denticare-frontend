<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authService, saveSession } from '../services/api';

const router = useRouter();
const username = ref('');
const password = ref('');
const errorMsg = ref('');
const loading = ref(false);

function decodePayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

async function handleLogin() {
  errorMsg.value = '';
  loading.value = true;
  try {
    const res = await authService.login(username.value.trim(), password.value);
    const token = res.token || res.jwt || res.accessToken;
    const payload = decodePayload(token);
    saveSession(token, {
      username: res.username || payload.sub || username.value.trim(),
      rol: res.rol || payload.rol || 'USUARIO',
    });
    router.push('/');
  } catch (err) {
    errorMsg.value =
      err.status === 401
        ? 'Credenciales inválidas. Verifique su usuario y contraseña.'
        : err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="glass-card w-full max-w-4xl rounded-2xl overflow-hidden grid md:grid-cols-2">
      <div class="p-8 bg-gradient-to-br from-[#08152e] to-[#040a18] border-b md:border-b-0 md:border-r border-[#0280b8]/25 flex flex-col justify-between">
        <div>
          <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-[#0280b8]/20 text-[#38bdf8] border border-[#0280b8]/40">
            Gestión Clínica Odontológica
          </span>
          <h1 class="text-3xl font-bold text-white mt-4">DentiCare System</h1>
          <p class="text-slate-300 text-sm mt-3 leading-relaxed">
            Plataforma integral para atención odontológica, historia clínica digital y trazabilidad de facturación.
          </p>
        </div>

        <ul class="space-y-2 text-xs text-slate-400 mt-8">
          <li>• Control de acceso basado en el perfil asignado a su cuenta.</li>
          <li>• Protección de datos personales y reserva clínica vigente.</li>
        </ul>
      </div>

      <form @submit.prevent="handleLogin" class="p-8 flex flex-col justify-center space-y-5">
        <div>
          <h2 class="text-2xl font-bold text-white">Iniciar Sesión</h2>
          <p class="text-slate-400 text-sm mt-1">Ingrese sus credenciales institucionales.</p>
        </div>

        <div
          v-if="errorMsg"
          class="p-3.5 rounded-xl bg-red-500/15 border border-red-400/40 text-red-200 text-sm"
        >
          {{ errorMsg }}
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1.5">Usuario</label>
          <input
            v-model="username"
            type="text"
            required
            autocomplete="username"
            placeholder="Ingrese su usuario"
            class="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-[#0280b8]"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1.5">Contraseña</label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-[#0280b8]"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="btn-primary w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-60"
        >
          {{ loading ? 'Verificando acceso...' : 'Ingresar al Sistema' }}
        </button>
      </form>
    </div>
  </div>
</template>