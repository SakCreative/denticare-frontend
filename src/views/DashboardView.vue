<script setup>
import { useRouter } from 'vue-router';
import { clearSession, getUserSession } from '../services/api';

const router = useRouter();
const session = getUserSession();
const usuarioNombre = session?.username || session?.usuario || 'Usuario activo';

function cerrarSesion() {
  clearSession();
  router.push('/login');
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 p-6">
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Encabezado clínico -->
      <header class="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-[#0280b8] border border-sky-200">
            Clínica Odontológica · DentiCare
          </span>
          <h1 class="text-2xl font-bold text-slate-900 mt-1.5">
            Panel Principal
          </h1>
          <p class="text-sm text-slate-500 mt-0.5">
            Sesión activa: <span class="text-slate-800 font-medium">{{ usuarioNombre }}</span>
          </p>
        </div>

        <button
          @click="cerrarSesion"
          class="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 text-sm font-medium transition cursor-pointer"
        >
          Cerrar sesión
        </button>
      </header>

      <!-- Módulos principales -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-xs">
          <div>
            <p class="text-xs uppercase tracking-wider text-[#0280b8] font-semibold">Historia y Registro</p>
            <h2 class="text-lg font-semibold text-slate-900 mt-1">Pacientes</h2>
            <p class="text-sm text-slate-600 mt-2">
              Registra nuevos pacientes y consulta el directorio clínico de la clínica.
            </p>
          </div>
          <button
            @click="router.push('/pacientes')"
            class="w-full py-2.5 px-4 rounded-xl bg-[#0280b8] hover:bg-[#026d9c] text-white text-sm font-semibold transition cursor-pointer"
          >
            Gestionar pacientes
          </button>
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-xs">
          <div>
            <p class="text-xs uppercase tracking-wider text-[#0280b8] font-semibold">Atención en Consultorio</p>
            <h2 class="text-lg font-semibold text-slate-900 mt-1">Citas Odontológicas</h2>
            <p class="text-sm text-slate-600 mt-2">
              Agenda nuevas citas y revisa la programación diaria de atención.
            </p>
          </div>
          <button
            @click="router.push('/citas')"
            class="w-full py-2.5 px-4 rounded-xl bg-[#0280b8] hover:bg-[#026d9c] text-white text-sm font-semibold transition cursor-pointer"
          >
            Agendar y ver citas
          </button>
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-xs">
          <div>
            <p class="text-xs uppercase tracking-wider text-[#0280b8] font-semibold">Administración</p>
            <h2 class="text-lg font-semibold text-slate-900 mt-1">Facturación y Liquidación</h2>
            <p class="text-sm text-slate-600 mt-2">
              Consulta comprobantes emitidos, desglose de impuestos y gestión de anulaciones.
            </p>
          </div>
          <button
            @click="router.push('/facturas')"
            class="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-sm font-semibold transition cursor-pointer"
          >
            Ir a facturación
          </button>
        </div>
      </section>
    </div>
  </div>
</template>