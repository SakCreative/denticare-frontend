<template>
  <!-- Contenedor principal forzando fondo blanco/claro -->
  <div class="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8 font-sans">
    <div class="max-w-7xl mx-auto space-y-6">

        <!-- Botón para regresar al Dashboard (Efecto Celeste Neón) -->
<button @click="volverAlDashboard" class="flex items-center gap-2 text-slate-500 hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all duration-300 font-semibold text-sm">
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
  Volver al Inicio
</button>

      <!-- Encabezado y Herramientas de Gestión -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <svg class="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            Directorio de Pacientes
          </h1>
          <p class="text-sm text-slate-500 font-medium mt-1 ml-10">
            Gestión clínica, historiales y contacto
          </p>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <!-- Buscador -->
          <div class="relative w-full sm:w-72">
            <input 
              v-model="busqueda" 
              type="text" 
              placeholder="Buscar documento o nombre..." 
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-slate-700 placeholder-slate-400"
            />
            <svg class="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <!-- Botón de acceso rápido -->
          <button class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-200 transition-all flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            Nuevo Paciente
          </button>
        </div>
      </div>

      <!-- Tabla de Datos -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total registrados: {{ pacientesFiltrados.length }}</span>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-white border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400 font-bold">
                <th class="p-4 pl-6">Documento</th>
                <th class="p-4">Paciente</th>
                <th class="p-4">Contacto</th>
                <th class="p-4">Edad</th>
                <th class="p-4 text-right pr-6">Gestión</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="cargando" class="animate-pulse">
                <td colspan="5" class="p-8 text-center text-slate-400 font-medium">Cargando base de datos de pacientes...</td>
              </tr>
              <tr v-else-if="pacientesFiltrados.length === 0">
                <td colspan="5" class="p-12 text-center">
                  <div class="flex flex-col items-center justify-center text-slate-400">
                    <svg class="w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <span class="font-medium text-lg">No hay pacientes que coincidan</span>
                    <span class="text-sm mt-1">Intenta con otro término de búsqueda o verifica la conexión.</span>
                  </div>
                </td>
              </tr>
              <tr 
                v-else 
                v-for="pac in pacientesFiltrados" 
                :key="pac.idPaciente"
                class="hover:bg-blue-50/40 transition-colors group"
              >
                <!-- Documento -->
                <td class="p-4 pl-6">
                  <div class="font-mono text-sm font-semibold text-slate-600 bg-slate-100 inline-block px-2 py-1 rounded-md">
                    {{ pac.documento }}
                  </div>
                </td>
                
                <!-- Nombre y Avatar -->
                <td class="p-4">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                      {{ pac.nombres.charAt(0) }}{{ pac.apellidos.charAt(0) }}
                    </div>
                    <div>
                      <div class="font-bold text-slate-800 capitalize">{{ pac.nombres.toLowerCase() }} {{ pac.apellidos.toLowerCase() }}</div>
                      <div class="text-xs text-slate-400 mt-0.5 font-medium">ID Interno: {{ pac.idPaciente }}</div>
                    </div>
                  </div>
                </td>

                <!-- Contacto -->
                <td class="p-4">
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                      <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                      {{ pac.telefono || 'No registrado' }}
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-slate-500">
                      <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                      {{ pac.correo || 'No registrado' }}
                    </div>
                  </div>
                </td>

                <!-- Edad -->
                <td class="p-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                    {{ calcularEdad(pac.fechaNacimiento) }} años
                  </span>
                </td>

                <!-- Acciones / Gestión -->
                <td class="p-4 pr-6">
                  <div class="flex items-center justify-end gap-2 opacity-100 sm:opacity-40 group-hover:opacity-100 transition-opacity">
                    <!-- Agendar -->
                    <button class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Agendar Cita">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </button>
                    <!-- Editar -->
                    <button class="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar Datos">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <!-- Historia Clínica -->
                    <button @click="verHistoria(pac.idPaciente)" class="px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      Historia
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { pacienteService, personaService } from '../services/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const API_BASE = 'http://localhost:8080/api';
const pacientes = ref([]);
const personas = ref([]);
const cargando = ref(true);
const busqueda = ref('');

// Configuración de cabeceras con el Token JWT
function authHeaders() {
  const token = localStorage.getItem('denticare_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

// 1. Cargar datos del backend
async function cargarDatos() {
  cargando.value = true;
  try {
    // Las peticiones viajan con el token inyectado automáticamente desde api.js
    pacientes.value = await pacienteService.listarTodos();
    personas.value = await personaService.listarTodas();
    
    console.log("✅ Datos cargados de forma segura");
  } catch (error) {
    console.error("🚨 Error cargando directorio:", error.message);
  } finally {
    cargando.value = false;
  }
}

// 2. Unir (Merge) Pacientes con Personas
const pacientesCompletos = computed(() => {
  return pacientes.value.map(paciente => {
    const personaObj = personas.value.find(p => p.idPersona === paciente.idPersona) || {};
    return {
      ...paciente,
      documento: personaObj.documento || 'N/A',
      nombres: personaObj.nombres || 'Desconocido',
      apellidos: personaObj.apellidos || '',
      telefono: personaObj.telefono || '',
      correo: personaObj.correo || ''
    };
  });
});

// 3. Filtrar por el buscador
const pacientesFiltrados = computed(() => {
  if (!busqueda.value) return pacientesCompletos.value;
  
  const termino = busqueda.value.toLowerCase();
  return pacientesCompletos.value.filter(p => 
    p.documento.toLowerCase().includes(termino) ||
    p.nombres.toLowerCase().includes(termino) ||
    p.apellidos.toLowerCase().includes(termino)
  );
});

// Utilidad para calcular la edad
function calcularEdad(fechaString) {
  if (!fechaString) return '--';
  const hoy = new Date();
  const cumpleanos = new Date(fechaString);
  let edad = hoy.getFullYear() - cumpleanos.getFullYear();
  const m = hoy.getMonth() - cumpleanos.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
    edad--;
  }
  return edad;
}

function verHistoria(id) {
  console.log("Hiciste clic en el paciente con ID:", id); // <-- Esto nos dirá si funciona
  
  if (id) {
    router.push(`/pacientes/historia/${id}`);
  } else {
    console.error("El ID del paciente está indefinido. Revisa el nombre de la variable.");
  }
}

function volverAlDashboard() {
  router.push('/'); 
}

onMounted(() => {
  cargarDatos();
});
</script>