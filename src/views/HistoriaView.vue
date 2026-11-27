<template>
  <div class="p-6 max-w-7xl mx-auto">
    
    <!-- Miga de pan / Botón de Regreso (Con efecto neón/glow sutil en hover) -->
    <button 
      @click="volverAlDirectorio" 
      class="text-blue-600 font-semibold mb-6 flex items-center gap-2 transition-all duration-300 hover:text-blue-500 hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
    >
      <span>&larr;</span> Volver al Directorio
    </button>

    <!-- Tarjeta Principal: Encabezado -->
    <div class="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">
          <!-- Si hay datos pinta el nombre, si no dice Cargando -->
          {{ paciente ? 'Expediente: ' + paciente.nombres + ' ' + paciente.apellidos : 'Cargando Expediente...' }}
        </h1>
        <p class="text-sm text-gray-500 mt-1">ID Sistema: {{ pacienteId }}</p>
      </div>
      <button class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
        + Registrar Evolución
      </button>
    </div>

    <!-- Estructura de 2 Columnas -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Panel Izquierdo: Resumen de Datos Personales -->
      <div class="col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 class="font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4">Información del Paciente</h3>
        
        <div class="space-y-4">
          <div>
            <p class="text-xs text-gray-400 font-semibold uppercase">Estado</p>
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
              Activo
            </span>
          </div>

          <!-- Animación de carga (Se muestra MIENTRAS paciente sea null) -->
          <div v-if="!paciente" class="animate-pulse flex space-x-4 mt-6">
            <div class="flex-1 space-y-4 py-1">
              <div class="h-2 bg-gray-200 rounded w-3/4"></div>
              <div class="space-y-2">
                <div class="h-2 bg-gray-200 rounded"></div>
                <div class="h-2 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>

          <!-- Datos Reales (Se muestran CUANDO el backend responde) -->
          <div v-else class="mt-6 space-y-4">
            <div>
              <p class="text-xs text-gray-400 font-semibold uppercase">Documento</p>
              <p class="text-gray-800 font-medium">{{ paciente.documento }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 font-semibold uppercase">Teléfono</p>
              <p class="text-gray-800 font-medium">{{ paciente.telefono }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 font-semibold uppercase">Correo Electrónico</p>
              <p class="text-gray-800 font-medium">{{ paciente.email }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 font-semibold uppercase">Fecha de Nacimiento</p>
              <p class="text-gray-800 font-medium">{{ paciente.fechaNacimiento }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel Derecho: Historial Médico y Evolución -->
      <div class="col-span-1 lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 class="font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4">Historial Médico y Evolución</h3>
        
        <!-- ESTA ES LA CLAVE: Ahora evalúa "historiaMedica" en lugar de paciente.historiaClinica -->
        <div v-if="historiaMedica" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          
          <div class="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
            <p class="text-xs text-blue-500 font-bold uppercase tracking-wider mb-1">Tipo de Sangre</p>
            <p class="text-gray-800 font-semibold text-lg">{{ historiaMedica.tipoSangre || 'No especificado' }}</p>
          </div>

          <div class="bg-rose-50/50 p-4 rounded-lg border border-rose-100">
            <p class="text-xs text-rose-500 font-bold uppercase tracking-wider mb-1">Alergias</p>
            <p class="text-gray-800 font-medium">{{ historiaMedica.alergias || 'Ninguna registrada' }}</p>
          </div>

          <div class="md:col-span-2 bg-amber-50/50 p-4 rounded-lg border border-amber-100">
            <p class="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">Enfermedades Previas</p>
            <p class="text-gray-800 font-medium">{{ historiaMedica.enfermedadesPrevias || 'Ninguna registrada' }}</p>
          </div>

        </div>

        <!-- Pantalla alternativa por si realmente no hay historia en la base de datos -->
        <div v-else class="py-12 flex flex-col items-center justify-center text-center">
          <div class="text-5xl mb-4 opacity-50">📋</div>
          <h4 class="text-lg font-semibold text-gray-700">Sin historial médico</h4>
          <p class="text-gray-500 max-w-sm mt-2">
            Este paciente aún no tiene una historia clínica registrada en el sistema.
          </p>
          <button class="mt-4 text-blue-600 text-sm font-semibold hover:underline">
            Crear Historia Clínica
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// Importamos los 3 servicios
import { pacienteService, personaService, historiaClinicaService } from '../services/api'; 

const route = useRoute();
const router = useRouter();
const pacienteId = ref(route.params.id);

const paciente = ref(null); 
// 👇 ESTA ES LA LÍNEA QUE FALTA O ESTÁ MAL UBICADA
const historiaMedica = ref(null);

function volverAlDirectorio() {
  router.push('/pacientes');
}

onMounted(async () => {
  try {
    // 1. Paciente
    const datosPaciente = await pacienteService.obtenerPorId(pacienteId.value);
    
    // 2. Persona (Optimizada)
    const datosPersona = await personaService.obtenerPorId(datosPaciente.idPersona);
    
    // 3. Armar sobre
    paciente.value = {
      ...datosPaciente,
      documento: datosPersona.documento || 'N/A',
      nombres: datosPersona.nombres || 'Desconocido',
      apellidos: datosPersona.apellidos || '',
      telefono: datosPersona.telefono || 'No registrado',
      email: datosPersona.correo || 'No registrado' 
    };

    // 4. Historia Clínica
    try {
      historiaMedica.value = await historiaClinicaService.obtenerPorPacienteId(pacienteId.value);
      console.log("🏥 Datos de la historia:", historiaMedica.value);
    } catch (error) {
      console.warn("El paciente aún no tiene historia clínica registrada.");
      historiaMedica.value = null;
    }

  } catch (error) {
    console.error("🚨 Error cargando el expediente:", error);
  }
});
</script>