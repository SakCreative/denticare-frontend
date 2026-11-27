<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { facturaService, getUserSession, clearSession } from '../services/api';

const router = useRouter();
const user = ref(getUserSession());
const facturas = ref([]);
const loading = ref(false);
const feedback = ref({ type: '', text: '' });

const modalAnular = ref(false);
const facturaSeleccionada = ref(null);
const motivoAnulacion = ref('');
const procesandoAnulacion = ref(false);

async function cargarFacturas() {
  loading.value = true;
  try {
    const data = await facturaService.listar();
    facturas.value = Array.isArray(data) ? data : data.content || [];
  } catch (err) {
    feedback.value = { type: 'error', text: err.message };
    if (err.status === 401) router.push('/login');
  } finally {
    loading.value = false;
  }
}

function abrirModalAnular(factura) {
  facturaSeleccionada.value = factura;
  motivoAnulacion.value = '';
  modalAnular.value = true;
}

async function confirmarAnulacion() {
  if (!motivoAnulacion.value.trim()) {
    feedback.value = { type: 'error', text: 'Debe ingresar el motivo de la anulación.' };
    return;
  }
  procesandoAnulacion.value = true;
  feedback.value = { type: '', text: '' };
  try {
    await facturaService.anular(facturaSeleccionada.value.idFactura, motivoAnulacion.value.trim());
    modalAnular.value = false;
    feedback.value = {
      type: 'success',
      text: `Factura #${facturaSeleccionada.value.idFactura} anulada correctamente con trazabilidad contable.`,
    };
    await cargarFacturas();
  } catch (err) {
    modalAnular.value = false;
    feedback.value = { type: 'error', text: err.message };
  } finally {
    procesandoAnulacion.value = false;
  }
}

function cerrarSesion() {
  clearSession();
  router.push('/login');
}

function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor || 0);
}

onMounted(cargarFacturas);
</script>

<template>
  <div class="min-h-screen p-6 max-w-6xl mx-auto space-y-6">
    <header class="glass-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-white">DentiCare — Facturación y Liquidación</h1>
        <p class="text-xs text-slate-400 mt-0.5">
          Sesión activa: <span class="text-[#38bdf8] font-semibold">{{ user?.username }}</span>
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="cargarFacturas"
          class="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
        >
          Actualizar
        </button>
        <button
          @click="cerrarSesion"
          class="px-4 py-2 rounded-xl text-xs font-medium bg-red-500/15 hover:bg-red-500/25 text-red-200 border border-red-400/30"
        >
          Cerrar sesión
        </button>
      </div>
    </header>

    <div
      v-if="feedback.text"
      :class="[
        'p-4 rounded-xl border text-sm',
        feedback.type === 'success'
          ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
          : 'bg-red-500/15 border-red-400/40 text-red-200',
      ]"
    >
      {{ feedback.text }}
    </div>

    <section class="glass-card rounded-2xl overflow-hidden">
      <div class="p-5 border-b border-slate-800 flex items-center justify-between">
        <h2 class="text-base font-semibold text-white">Comprobantes Emitidos</h2>
        <span class="text-xs text-slate-400">{{ facturas.length }} registros</span>
      </div>

      <div v-if="loading" class="p-8 text-center text-slate-400 text-sm">
        Cargando facturas...
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-900/70 text-xs uppercase text-slate-400">
            <tr>
              <th class="px-5 py-3.5">#</th>
              <th class="px-5 py-3.5">Concepto</th>
              <th class="px-5 py-3.5">Subtotal</th>
              <th class="px-5 py-3.5">Impuestos</th>
              <th class="px-5 py-3.5">Total Neto</th>
              <th class="px-5 py-3.5">Estado</th>
              <th class="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/80">
            <tr v-for="f in facturas" :key="f.idFactura" class="hover:bg-slate-800/30">
              <td class="px-5 py-4 font-semibold text-white">#{{ f.idFactura }}</td>
              <td class="px-5 py-4 text-slate-300">{{ f.concepto || 'Servicios odontológicos' }}</td>
              <td class="px-5 py-4 text-slate-300">{{ formatoMoneda(f.subtotal) }}</td>
              <td class="px-5 py-4 text-slate-300">{{ formatoMoneda(f.impuestos) }}</td>
              <td class="px-5 py-4 font-medium text-white">{{ formatoMoneda(f.total) }}</td>
              <td class="px-5 py-4">
                <span
                  :class="[
                    'px-2.5 py-1 rounded-full text-xs font-semibold',
                    f.estadoPago === 'ANULADA'
                      ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                      : f.estadoPago === 'PAGADA'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-amber-500/20 text-amber-200 border border-amber-400/30',
                  ]"
                >
                  {{ f.estadoPago }}
                </span>
              </td>
              <td class="px-5 py-4 text-right">
                <button
                  v-if="f.estadoPago !== 'ANULADA'"
                  @click="abrirModalAnular(f)"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/15 hover:bg-red-500/30 text-red-200 border border-red-400/35"
                >
                  Anular factura
                </button>
                <span v-else class="text-xs text-slate-500">Sin acciones</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div
      v-if="modalAnular"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <div class="glass-card w-full max-w-md rounded-2xl p-6 space-y-4">
        <h3 class="text-lg font-bold text-white">
          Anular Factura #{{ facturaSeleccionada?.idFactura }}
        </h3>
        <p class="text-xs text-slate-300">
          Esta operación conserva el registro en auditoría contable (sin borrado físico) y requiere perfil Administrador.
        </p>
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1.5">Justificación de anulación</label>
          <textarea
            v-model="motivoAnulacion"
            rows="3"
            placeholder="Ej. Error en los datos del procedimiento facturado"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#0280b8]"
          ></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button
            @click="modalAnular = false"
            class="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            @click="confirmarAnulacion"
            :disabled="procesandoAnulacion"
            class="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white disabled:opacity-60"
          >
            {{ procesandoAnulacion ? 'Anulando...' : 'Confirmar Anulación' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>