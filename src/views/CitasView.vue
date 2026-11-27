<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getToken } from '../services/api';

const router = useRouter();
const API_BASE = 'http://localhost:8080/api';

const mesesNombres = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const aniosDisponibles = [2026, 2027, 2028, 2029];

// Jornada de 10 horas desde las 07:00 hasta las 17:00 -> 20 bloques de 30 min
const HORA_INICIO_JORNADA = 7;
const HORAS_JORNADA = 10;
const INTERVALO_MINUTOS = 30;
const TOTAL_BLOQUES_DIA = (HORAS_JORNADA * 60) / INTERVALO_MINUTOS;

const citas = ref([]);
const personas = ref([]);
const pacientes = ref([]);
const odontologos = ref([]);
const consultorios = ref([]);

const loading = ref(true);
const guardando = ref(false);
const cancelandoId = ref(null);
const mensajeOk = ref('');
const mensajeError = ref('');
const errorModal = ref('');

const estadosFiltro = ['TODAS', 'PROGRAMADA', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA'];
const filtroEstado = ref('TODAS');

const vistaCalendario = ref('MES'); // 'MES' | 'SEMANA'
const fechaReferencia = ref(new Date(2026, 10, 25));
const diaSeleccionadoKey = ref(toDateKey(new Date(2026, 10, 26)));

// Modal glassmorfismo + selección de 1 o varios bloques de 30 min
const modalAbierto = ref(false);
const diaModal = ref(null);
const rangoSlotsSeleccionado = ref({ inicioIdx: 14, finIdx: 14 }); // 14:00 - 14:30 por defecto

const form = ref({
  // Datos mínimos del paciente (se resuelven/crean automáticamente en BD)
  documento: '',
  nombres: '',
  apellidos: '',
  telefono: '',
  correo: '',
  fechaNacimiento: '1995-01-01',
  // Datos de la cita
  idOdontologo: '',
  idConsultorio: '',
  fechaHoraInicio: '',
  fechaHoraFin: '',
  motivo: '',
});

const mesActualSelect = computed({
  get: () => new Date(fechaReferencia.value).getMonth(),
  set: (nuevoMes) => {
    const d = new Date(fechaReferencia.value);
    d.setDate(1);
    d.setMonth(Number(nuevoMes));
    fechaReferencia.value = d;
  },
});

const anioActualSelect = computed({
  get: () => new Date(fechaReferencia.value).getFullYear(),
  set: (nuevoAnio) => {
    const d = new Date(fechaReferencia.value);
    d.setDate(1);
    d.setFullYear(Number(nuevoAnio));
    fechaReferencia.value = d;
  },
});

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toDateKey(dateObj) {
  const d = new Date(dateObj);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toInputLocal(dateObj) {
  const d = new Date(dateObj);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function normalizarLocalDateTime(valor) {
  if (!valor) return '';
  return valor.length === 16 ? `${valor}:00` : valor;
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function extraerLista(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

async function fetchConFallback(endpoints) {
  for (const ep of endpoints) {
    try {
      const res = await fetch(`${API_BASE}${ep}`, { headers: authHeaders() });
      if (res.ok) {
        const lista = extraerLista(await res.json());
        if (lista.length > 0 || ep === endpoints[endpoints.length - 1]) {
          return lista;
        }
      }
    } catch {
      // Intenta siguiente endpoint
    }
  }
  return [];
}

function obtenerIdPersona(obj) {
  return obj?.idPersona ?? obj?.id_persona ?? obj?.persona?.idPersona ?? obj?.persona?.id_persona ?? null;
}

function obtenerIdPaciente(p) {
  return p?.idPaciente ?? p?.id_paciente ?? p?.id ?? null;
}

function obtenerIdOdontologo(o) {
  return o?.idOdontologo ?? o?.id_odontologo ?? o?.id ?? '';
}

function obtenerIdConsultorio(c) {
  return c?.idConsultorio ?? c?.id_consultorio ?? c?.id ?? '';
}

function buscarPersonaEnCachePorDocumento(doc) {
  const limpio = String(doc || '').trim().toLowerCase();
  if (!limpio) return null;
  return personas.value.find(
    (per) => String(per.documento || '').trim().toLowerCase() === limpio
  ) || null;
}

function nombrePacienteDesdeCita(c) {
  const pac = c?.paciente;
  const idPac = obtenerIdPaciente(pac);
  const encontradoPac = pacientes.value.find((p) => obtenerIdPaciente(p) === idPac) || pac;
  const idPer = obtenerIdPersona(encontradoPac) || obtenerIdPersona(pac);
  const encontradaPer = personas.value.find((per) => obtenerIdPersona(per) === idPer) || encontradoPac?.persona || pac?.persona;

  const full = [encontradaPer?.nombres, encontradaPer?.apellidos].filter(Boolean).join(' ').trim();
  if (full) return full;
  return idPac ? `Paciente #${idPac}` : 'Paciente';
}

function nombreOdontologo(o) {
  if (!o) return 'Odontólogo';
  const idPer = obtenerIdPersona(o);
  const per = personas.value.find((x) => obtenerIdPersona(x) === idPer) || o.persona || {};
  const full = [per.nombres, per.apellidos].filter(Boolean).join(' ').trim();
  const esp = o.especialidad ? ` · ${o.especialidad}` : '';
  if (full) return `Dr(a). ${full}${esp}`;
  const id = obtenerIdOdontologo(o);
  return id ? `Odontólogo #${id}${esp}` : 'Odontólogo';
}

function nombreConsultorio(c) {
  if (!c) return 'Consultorio';
  const sala = c.nombre || c.nombreConsultorio || c.sala || c.codigo || c.numero;
  if (sala) return String(sala);
  const id = obtenerIdConsultorio(c);
  return id ? `Consultorio #${id}` : 'Consultorio';
}

function obtenerFechaInicioCita(c) {
  return c.fechaHoraInicio || c.fechaHora || c.fechaInicio || c.fecha;
}

function obtenerFechaFinCita(c) {
  return c.fechaHoraFin || c.fechaFin || null;
}

function estadoNormalizado(estado) {
  return String(estado || 'PROGRAMADA').trim().toUpperCase();
}

function badgeEstado(estado) {
  const est = estadoNormalizado(estado);
  if (est === 'CONFIRMADA' || est === 'ATENDIDA' || est === 'COMPLETADA') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (est === 'CANCELADA' || est === 'ANULADA') {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  return 'bg-sky-50 text-[#0280b8] border-sky-200';
}

function formatoRangoHora(inicioVal, finVal) {
  if (!inicioVal) return { fecha: 'Sin fecha', hora: '--:--' };
  const dIni = new Date(inicioVal);
  if (Number.isNaN(dIni.getTime())) return { fecha: inicioVal, hora: '' };

  const fecha = dIni.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const hIni = dIni.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  if (!finVal) return { fecha, hora: hIni };
  const dFin = new Date(finVal);
  if (Number.isNaN(dFin.getTime())) return { fecha, hora: hIni };
  const hFin = dFin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  return { fecha, hora: `${hIni} - ${hFin}` };
}

function construirSlotsDia(dateObj, citasDelDia = []) {
  const base = new Date(dateObj);
  const slots = [];

  for (let i = 0; i < TOTAL_BLOQUES_DIA; i++) {
    const minsIni = HORA_INICIO_JORNADA * 60 + i * INTERVALO_MINUTOS;
    const hIni = Math.floor(minsIni / 60);
    const mIni = minsIni % 60;

    const minsFin = minsIni + INTERVALO_MINUTOS;
    const hFin = Math.floor(minsFin / 60);
    const mFin = minsFin % 60;

    const dIni = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hIni, mIni, 0);
    const dFin = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hFin, mFin, 0);

    const ocupada = citasDelDia.some((c) => {
      if (estadoNormalizado(c.estado) === 'CANCELADA') return false;
      const cIni = new Date(obtenerFechaInicioCita(c));
      if (Number.isNaN(cIni.getTime())) return false;
      const cFinRaw = obtenerFechaFinCita(c);
      const cFin = cFinRaw ? new Date(cFinRaw) : new Date(cIni.getTime() + 30 * 60000);
      return dIni < cFin && dFin > cIni;
    });

    slots.push({
      index: i,
      label: `${pad2(hIni)}:${pad2(mIni)} - ${pad2(hFin)}:${pad2(mFin)}`,
      inicioDate: dIni,
      finDate: dFin,
      ocupada,
    });
  }

  return slots;
}

const citasPorDia = computed(() => {
  const mapa = {};
  for (const c of citas.value) {
    const raw = obtenerFechaInicioCita(c);
    if (!raw) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    const key = toDateKey(d);
    if (!mapa[key]) mapa[key] = [];
    mapa[key].push(c);
  }
  return mapa;
});

const slotsDelModal = computed(() => {
  if (!diaModal.value) return [];
  return construirSlotsDia(diaModal.value.date, citasPorDia.value[diaModal.value.key] || []);
});

function estaEnRangoSeleccionado(idx) {
  const minIdx = Math.min(rangoSlotsSeleccionado.value.inicioIdx, rangoSlotsSeleccionado.value.finIdx);
  const maxIdx = Math.max(rangoSlotsSeleccionado.value.inicioIdx, rangoSlotsSeleccionado.value.finIdx);
  return idx >= minIdx && idx <= maxIdx;
}

function sincronizarFechasDesdeRango(dateObj, iniIdx, finIdx) {
  const slots = construirSlotsDia(dateObj, citasPorDia.value[toDateKey(dateObj)] || []);
  const minIdx = Math.max(0, Math.min(iniIdx, finIdx));
  const maxIdx = Math.min(slots.length - 1, Math.max(iniIdx, finIdx));

  for (let k = minIdx; k <= maxIdx; k++) {
    if (slots[k]?.ocupada) {
      errorModal.value = 'Hay un bloque ocupado dentro del rango elegido. Escoge solo bloques libres continuos.';
      return false;
    }
  }

  errorModal.value = '';
  rangoSlotsSeleccionado.value = { inicioIdx: minIdx, finIdx: maxIdx };
  form.value.fechaHoraInicio = toInputLocal(slots[minIdx].inicioDate);
  form.value.fechaHoraFin = toInputLocal(slots[maxIdx].finDate);
  return true;
}

function clickEnSlot(slot) {
  if (slot.ocupada || !diaModal.value) return;
  const { inicioIdx, finIdx } = rangoSlotsSeleccionado.value;
  if (inicioIdx !== finIdx) {
    sincronizarFechasDesdeRango(diaModal.value.date, slot.index, slot.index);
    return;
  }
  sincronizarFechasDesdeRango(diaModal.value.date, inicioIdx, slot.index);
}

const duracionSeleccionadaTexto = computed(() => {
  const cantBloques =
    Math.abs(rangoSlotsSeleccionado.value.finIdx - rangoSlotsSeleccionado.value.inicioIdx) + 1;
  const minutos = cantBloques * INTERVALO_MINUTOS;
  const horas = (minutos / 60).toFixed(minutos % 60 === 0 ? 0 : 1);
  return `${cantBloques} bloque(s) · ${minutos} min (${horas} h)`;
});

function abrirModalDia(dayObj) {
  errorModal.value = '';
  diaSeleccionadoKey.value = dayObj.key;
  diaModal.value = {
    date: dayObj.date,
    key: dayObj.key,
    label: dayObj.date.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
  };

  const slots = construirSlotsDia(dayObj.date, citasPorDia.value[dayObj.key] || []);
  const preferido = slots[14] && !slots[14].ocupada ? 14 : slots.find((s) => !s.ocupada)?.index ?? 14;
  sincronizarFechasDesdeRango(dayObj.date, preferido, preferido);
  modalAbierto.value = true;
}

function cerrarModal() {
  modalAbierto.value = false;
  errorModal.value = '';
}

function moverPeriodo(delta) {
  const base = new Date(fechaReferencia.value);
  if (vistaCalendario.value === 'MES') {
    base.setDate(1);
    base.setMonth(base.getMonth() + delta);
  } else {
    base.setDate(base.getDate() + delta * 7);
  }
  fechaReferencia.value = base;
}

async function cargarTodo() {
  loading.value = true;
  mensajeError.value = '';

  const [listaCitas, listaPersonas, listaPacientes, listaOdontologos, listaConsultorios] = await Promise.all([
    fetchConFallback(['/citas/todas', '/citas']),
    fetchConFallback(['/personas']),
    fetchConFallback(['/pacientes']),
    fetchConFallback(['/odontologos']),
    fetchConFallback(['/consultorios']),
  ]);

  citas.value = listaCitas;
  personas.value = listaPersonas;
  pacientes.value = listaPacientes;
  odontologos.value = listaOdontologos;
  consultorios.value = listaConsultorios;

  if (!form.value.idOdontologo && listaOdontologos.length > 0) {
    form.value.idOdontologo = String(obtenerIdOdontologo(listaOdontologos[0]));
  }
  if (!form.value.idConsultorio && listaConsultorios.length > 0) {
    form.value.idConsultorio = String(obtenerIdConsultorio(listaConsultorios[0]));
  }

  loading.value = false;
}

async function agendarCita() {
  mensajeOk.value = '';
  mensajeError.value = '';
  errorModal.value = '';
  guardando.value = true;

  try {
    // Armamos un solo paquete de datos que coincide con tu AgendarCitaDTO de Java
    const payload = {
      documento: form.value.documento.trim(),
      nombres: form.value.nombres.trim(),
      apellidos: form.value.apellidos.trim(),
      telefono: form.value.telefono.trim() || null,
      correo: form.value.correo.trim() || null,
      fechaNacimiento: form.value.fechaNacimiento || '1995-01-01',
      idOdontologo: Number(form.value.idOdontologo),
      idConsultorio: Number(form.value.idConsultorio),
      fechaHoraInicio: normalizarLocalDateTime(form.value.fechaHoraInicio),
      fechaHoraFin: normalizarLocalDateTime(form.value.fechaHoraFin),
      motivo: form.value.motivo.trim(),
    };

    // Llamamos al nuevo endpoint mágico del backend
    const res = await fetch(`${API_BASE}/citas/completa`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const textoError = await res.text();
      let mensaje = textoError || 'No se pudo agendar la cita.';
      try {
        const jsonError = JSON.parse(textoError);
        mensaje = jsonError.message || jsonError.error || mensaje;
      } catch {}
      throw new Error(mensaje);
    }

    // Mostramos el Toast verde y lo ocultamos a los 4 segundos
    mensajeOk.value = '¡Paciente verificado y cita agendada exitosamente!';
    setTimeout(() => {
      mensajeOk.value = '';
    }, 4500);
    
    // Limpiamos el formulario
    form.value.documento = '';
    form.value.nombres = '';
    form.value.apellidos = '';
    form.value.telefono = '';
    form.value.correo = '';
    form.value.motivo = '';
    
    cerrarModal();
    await cargarTodo();
  } catch (err) {
    errorModal.value = err.message;
    mensajeError.value = err.message;
  } finally {
    guardando.value = false;
  }
}

async function cancelarCita(idCita) {
  if (!idCita) return;
  mensajeOk.value = '';
  mensajeError.value = '';
  cancelandoId.value = idCita;

  try {
    const res = await fetch(`${API_BASE}/citas/${idCita}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    if (!res.ok) {
      const textoError = await res.text();
      throw new Error(textoError || 'No se pudo cancelar la cita.');
    }

    const textoOk = await res.text();
    mensajeOk.value = textoOk || 'Cita cancelada y horario liberado exitosamente.';
    await cargarTodo();
  } catch (err) {
    mensajeError.value = err.message;
  } finally {
    cancelandoId.value = null;
  }
}

function colorCeldaDia(dayObj) {
  if (dayObj.key === diaSeleccionadoKey.value) {
    return 'bg-sky-100 border-[#0280b8] ring-2 ring-[#0280b8]/30';
  }
  const act = (citasPorDia.value[dayObj.key] || []).filter(
    (c) => estadoNormalizado(c.estado) !== 'CANCELADA'
  ).length;

  if (act >= 10) return 'bg-rose-50/90 border-rose-200 hover:border-rose-300';
  if (act >= 4) return 'bg-amber-50/85 border-amber-200 hover:border-amber-300';
  if (act >= 1) return 'bg-emerald-50/80 border-emerald-200 hover:border-emerald-300';
  return dayObj.inCurrentMonth
    ? 'bg-white border-slate-200 hover:border-sky-300'
    : 'bg-slate-50/70 border-slate-200/60 text-slate-400';
}

const tituloPeriodo = computed(() => {
  const d = new Date(fechaReferencia.value);
  return `${mesesNombres[d.getMonth()]} ${d.getFullYear()}`;
});

const celdasCalendario = computed(() => {
  const base = new Date(fechaReferencia.value);
  const dias = [];

  if (vistaCalendario.value === 'MES') {
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - startOffset);

    for (let i = 0; i < 42; i++) {
      const current = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      dias.push({
        date: current,
        key: toDateKey(current),
        dayNumber: current.getDate(),
        inCurrentMonth: current.getMonth() === month,
      });
    }
  } else {
    const dayOfWeek = (base.getDay() + 6) % 7;
    const weekStart = new Date(base.getFullYear(), base.getMonth(), base.getDate() - dayOfWeek);
    for (let i = 0; i < 7; i++) {
      const current = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
      dias.push({
        date: current,
        key: toDateKey(current),
        dayNumber: current.getDate(),
        inCurrentMonth: true,
      });
    }
  }
  return dias;
});

const citasFiltradas = computed(() => {
  return citas.value.filter((c) => {
    const est = estadoNormalizado(c.estado);
    if (filtroEstado.value !== 'TODAS' && est !== filtroEstado.value) return false;
    return true;
  });
});

const resumen = computed(() => {
  const total = citas.value.length;
  const activas = citas.value.filter((c) =>
    ['PROGRAMADA', 'CONFIRMADA', 'PENDIENTE'].includes(estadoNormalizado(c.estado))
  ).length;
  const atendidas = citas.value.filter((c) =>
    ['ATENDIDA', 'COMPLETADA'].includes(estadoNormalizado(c.estado))
  ).length;
  return { total, activas, atendidas };
});

onMounted(cargarTodo);
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-teal-50/30 text-slate-800 p-4 sm:p-6">
    <div class="max-w-7xl mx-auto space-y-4">
      <!-- Encabezado -->
      <header class="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-2xs">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0280b8] to-teal-500 text-white flex items-center justify-center font-bold text-base">
            DC
          </div>
          <div>
            <span class="text-[11px] font-semibold uppercase tracking-wider text-[#0280b8]">
              Jornada 07:00 - 17:00 (10h · Bloques 30 min)
            </span>
            <h1 class="text-xl font-bold text-slate-900 leading-tight">Agendamiento de Citas</h1>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="cargarTodo"
            class="px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0280b8] text-xs font-semibold transition cursor-pointer"
          >
            Actualizar
          </button>
          <button
            @click="router.push('/')"
            class="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Volver al Panel
          </button>
        </div>
      </header>

      <!-- KPIs -->
      <section class="grid grid-cols-3 gap-3">
        <div class="bg-white border-l-4 border-l-[#0280b8] border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
          <p class="text-[11px] font-semibold uppercase text-slate-500">Total Citas</p>
          <p class="text-2xl font-bold text-slate-900 mt-0.5">{{ resumen.total }}</p>
        </div>
        <div class="bg-white border-l-4 border-l-amber-400 border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
          <p class="text-[11px] font-semibold uppercase text-slate-500">Programadas / Activas</p>
          <p class="text-2xl font-bold text-amber-600 mt-0.5">{{ resumen.activas }}</p>
        </div>
        <div class="bg-white border-l-4 border-l-emerald-500 border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
          <p class="text-[11px] font-semibold uppercase text-slate-500">Atendidas</p>
          <p class="text-2xl font-bold text-emerald-600 mt-0.5">{{ resumen.atendidas }}</p>
        </div>
      </section>

      <!-- Alertas -->
      <div v-if="mensajeOk" class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium">
        {{ mensajeOk }}
      </div>
      <div v-if="mensajeError" class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium">
        {{ mensajeError }}
      </div>

      <!-- Calendario compacto -->
      <section class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-base sm:text-lg font-bold text-slate-900">{{ tituloPeriodo }}</h2>
            <select
              v-model="mesActualSelect"
              class="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#0280b8]"
            >
              <option v-for="(nombre, idx) in mesesNombres" :key="nombre" :value="idx">
                {{ nombre }}
              </option>
            </select>
            <select
              v-model="anioActualSelect"
              class="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#0280b8]"
            >
              <option v-for="anio in aniosDisponibles" :key="anio" :value="anio">
                {{ anio }}
              </option>
            </select>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <div class="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              <button
                type="button"
                @click="vistaCalendario = 'MES'"
                :class="[
                  'px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer',
                  vistaCalendario === 'MES' ? 'bg-white text-[#0280b8] shadow-2xs' : 'text-slate-600'
                ]"
              >
                Mes
              </button>
              <button
                type="button"
                @click="vistaCalendario = 'SEMANA'"
                :class="[
                  'px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer',
                  vistaCalendario === 'SEMANA' ? 'bg-white text-[#0280b8] shadow-2xs' : 'text-slate-600'
                ]"
              >
                Semana
              </button>
            </div>
            <button
              type="button"
              @click="moverPeriodo(-1)"
              class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              ←
            </button>
            <button
              type="button"
              @click="fechaReferencia = new Date(2026, 10, 25)"
              class="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0280b8] border border-sky-200 text-xs font-semibold cursor-pointer"
            >
              Hoy
            </button>
            <button
              type="button"
              @click="moverPeriodo(1)"
              class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              →
            </button>
          </div>
        </div>

        <p class="text-[11px] text-slate-500">
          Haz clic en un día para elegir franja horaria (07:00 - 17:00) y llenar los datos mínimos del paciente.
        </p>

        <div class="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-slate-500">
          <div>Lun</div>
          <div>Mar</div>
          <div>Mié</div>
          <div>Jue</div>
          <div>Vie</div>
          <div>Sáb</div>
          <div>Dom</div>
        </div>

        <div class="grid grid-cols-7 gap-1.5">
          <button
            v-for="day in celdasCalendario"
            :key="day.key"
            type="button"
            @click="abrirModalDia(day)"
            :class="[
              'min-h-[58px] px-2 py-1.5 rounded-lg border text-left flex flex-col justify-between transition cursor-pointer',
              colorCeldaDia(day)
            ]"
          >
            <div class="flex items-center justify-between w-full">
              <span class="text-xs font-bold leading-none">{{ day.dayNumber }}</span>
              <span class="text-[10px] text-slate-500 font-medium">
                {{ TOTAL_BLOQUES_DIA - (citasPorDia[day.key] || []).filter(c => estadoNormalizado(c.estado) !== 'CANCELADA').length }}/{{ TOTAL_BLOQUES_DIA }} libres
              </span>
            </div>
            <span
              v-if="(citasPorDia[day.key] || []).length > 0"
              class="inline-block self-start px-1.5 py-0.5 rounded bg-white/95 border border-slate-200 text-[10px] font-semibold text-slate-700 leading-none"
            >
              {{ (citasPorDia[day.key] || []).length }} cita(s)
            </span>
          </button>
        </div>
      </section>

      <!-- Agenda Programada con pestañas funcionando -->
      <section class="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div class="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-3.5 mb-4">
          <div>
            <h2 class="text-base font-bold text-slate-900">Agenda Programada</h2>
            <p class="text-xs text-slate-500">{{ citasFiltradas.length }} cita(s) en {{ filtroEstado }}</p>
          </div>

          <div class="flex flex-wrap gap-1">
            <button
              v-for="est in estadosFiltro"
              :key="est"
              type="button"
              @click="filtroEstado = est"
              :class="[
                'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer',
                filtroEstado === est
                  ? 'bg-[#0280b8] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              {{ est }}
            </button>
          </div>
        </div>

        <div v-if="loading" class="py-10 text-center text-slate-500 text-sm">
          Cargando agenda odontológica...
        </div>

        <div v-else-if="citasFiltradas.length === 0" class="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <p class="text-slate-700 font-medium text-sm">No hay citas con estado {{ filtroEstado }}.</p>
          <p class="text-xs text-slate-500 mt-1">Haz clic en un día del calendario para agendar una nueva cita.</p>
        </div>

        <div v-else class="space-y-2.5">
          <article
            v-for="c in citasFiltradas"
            :key="c.idCita ?? c.id"
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 bg-slate-50/60 transition"
          >
            <div class="flex items-start gap-3.5">
              <div class="min-w-[116px] text-center px-2.5 py-1.5 rounded-xl bg-white border border-sky-200">
                <p class="text-xs font-bold text-[#0280b8]">
                  {{ formatoRangoHora(obtenerFechaInicioCita(c), obtenerFechaFinCita(c)).hora }}
                </p>
                <p class="text-[11px] text-slate-500 mt-0.5 capitalize">
                  {{ formatoRangoHora(obtenerFechaInicioCita(c), obtenerFechaFinCita(c)).fecha }}
                </p>
              </div>

              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-bold text-slate-900 text-sm">
                    {{ nombrePacienteDesdeCita(c) }}
                  </h3>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                      badgeEstado(c.estado)
                    ]"
                  >
                    {{ estadoNormalizado(c.estado) }}
                  </span>
                </div>
                <p class="text-xs sm:text-sm text-slate-700 mt-0.5">
                  {{ c.motivo || 'Consulta odontológica' }}
                </p>
                <p class="text-xs text-slate-500 mt-0.5">
                  {{ nombreOdontologo(c.odontologo) }} · {{ nombreConsultorio(c.consultorio) }}
                </p>
              </div>
            </div>

            <button
              v-if="estadoNormalizado(c.estado) !== 'CANCELADA'"
              type="button"
              @click="cancelarCita(c.idCita ?? c.id)"
              :disabled="cancelandoId === (c.idCita ?? c.id)"
              class="self-start sm:self-center px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {{ cancelandoId === (c.idCita ?? c.id) ? 'Cancelando...' : 'Cancelar cita' }}
            </button>
          </article>
        </div>
      </section>
    </div>

    <!-- VENTANA GLASSMORFISMO: FRANJA + DATOS MÍNIMOS DEL PACIENTE -->
    <div
      v-if="modalAbierto && diaModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-sm"
      @click.self="cerrarModal"
    >
      <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white/88 backdrop-blur-xl border border-white/80 shadow-2xl p-6 space-y-5 text-slate-800">
        <div class="flex items-start justify-between gap-4 border-b border-slate-200/70 pb-4">
          <div>
            <span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100/80 text-[#0280b8] border border-sky-200">
              Jornada 07:00 - 17:00 · Duración personalizada
            </span>
            <h3 class="text-lg font-bold text-slate-900 capitalize mt-1.5">
              {{ diaModal.label }}
            </h3>
          </div>

          <button
            type="button"
            @click="cerrarModal"
            class="px-3 py-1 rounded-xl bg-white/80 hover:bg-white border border-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
          >
            Cerrar ✕
          </button>
        </div>

        <div v-if="errorModal" class="p-3 rounded-xl bg-rose-50/90 border border-rose-200 text-rose-700 text-xs font-medium">
          {{ errorModal }}
        </div>

        <!-- 1. Franjas de 30 min (1 o varias continuas) -->
        <div class="space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <label class="text-xs font-bold text-slate-700">
              1. Escoge franja (clic en 1 o varios bloques libres continuos):
            </label>
            <span class="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[11px] font-bold text-[#0280b8]">
              {{ duracionSeleccionadaTexto }}
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              v-for="slot in slotsDelModal"
              :key="slot.index"
              type="button"
              :disabled="slot.ocupada"
              @click="clickEnSlot(slot)"
              :class="[
                'px-2.5 py-2 rounded-xl text-xs font-semibold border text-center transition',
                slot.ocupada
                  ? 'bg-rose-100/70 border-rose-200 text-rose-400 line-through cursor-not-allowed'
                  : estaEnRangoSeleccionado(slot.index)
                    ? 'bg-[#0280b8] border-[#0280b8] text-white shadow-xs cursor-pointer'
                    : 'bg-white/85 hover:bg-sky-50 border-slate-200 text-slate-700 cursor-pointer'
              ]"
            >
              {{ slot.label }}
            </button>
          </div>
        </div>

        <!-- 2. Datos mínimos del paciente + cita -->
        <form @submit.prevent="agendarCita" class="space-y-3.5 pt-2 border-t border-slate-200/70">
          <p class="text-xs font-bold text-slate-700">
            2. Datos mínimos del paciente (si el documento ya existe, se asocia automáticamente):
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Documento *</label>
              <input
                v-model="form.documento"
                type="text"
                required
                placeholder="Ej. 1052340010"
                class="w-full px-3 py-2 rounded-xl bg-white/95 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-[#0280b8]"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Nombres *</label>
              <input
                v-model="form.nombres"
                type="text"
                required
                placeholder="Nombres"
                class="w-full px-3 py-2 rounded-xl bg-white/95 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-[#0280b8]"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Apellidos *</label>
              <input
                v-model="form.apellidos"
                type="text"
                required
                placeholder="Apellidos"
                class="w-full px-3 py-2 rounded-xl bg-white/95 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-[#0280b8]"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
              <input
                v-model="form.telefono"
                type="text"
                placeholder="3001234567"
                class="w-full px-3 py-2 rounded-xl bg-white/95 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-[#0280b8]"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Correo</label>
              <input
                v-model="form.correo"
                type="email"
                placeholder="paciente@correo.com"
                class="w-full px-3 py-2 rounded-xl bg-white/95 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-[#0280b8]"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Fecha Nacimiento *</label>
              <input
                v-model="form.fechaNacimiento"
                type="date"
                required
                class="w-full px-3 py-2 rounded-xl bg-white/95 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#0280b8]"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Odontólogo *</label>
              <select
                v-model="form.idOdontologo"
                required
                class="w-full px-3 py-2 rounded-xl bg-white/95 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-[#0280b8]"
              >
                <option value="" disabled>Seleccione especialista...</option>
                <option
                  v-for="o in odontologos"
                  :key="obtenerIdOdontologo(o)"
                  :value="obtenerIdOdontologo(o)"
                >
                  {{ nombreOdontologo(o) }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Consultorio *</label>
              <select
                v-model="form.idConsultorio"
                required
                class="w-full px-3 py-2 rounded-xl bg-white/95 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-[#0280b8]"
              >
                <option value="" disabled>Seleccione consultorio...</option>
                <option
                  v-for="c in consultorios"
                  :key="obtenerIdConsultorio(c)"
                  :value="obtenerIdConsultorio(c)"
                >
                  {{ nombreConsultorio(c) }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Hora Inicio *</label>
              <input
                v-model="form.fechaHoraInicio"
                type="datetime-local"
                required
                class="w-full px-3 py-2 rounded-xl bg-white/95 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#0280b8]"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Hora Fin *</label>
              <input
                v-model="form.fechaHoraFin"
                type="datetime-local"
                required
                class="w-full px-3 py-2 rounded-xl bg-white/95 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#0280b8]"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Motivo</label>
              <input
                v-model="form.motivo"
                type="text"
                placeholder="Valoración, profilaxis..."
                class="w-full px-3 py-2 rounded-xl bg-white/95 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-[#0280b8]"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              @click="cerrarModal"
              class="px-4 py-2 rounded-xl bg-white/80 hover:bg-white border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="guardando"
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0280b8] to-teal-600 hover:from-[#026d9c] hover:to-teal-700 text-white text-xs sm:text-sm font-semibold shadow-xs cursor-pointer disabled:opacity-60"
            >
              {{ guardando ? 'Guardando...' : 'Agendar Cita' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>