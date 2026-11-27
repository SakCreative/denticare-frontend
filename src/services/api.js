const API_BASE_URL = 'http://localhost:8080/api';

export function getToken() {
  return localStorage.getItem('denticare_token');
}

export function getUserSession() {
  const raw = localStorage.getItem('denticare_user');
  return raw ? JSON.parse(raw) : null;
}

export function saveSession(token, userData) {
  localStorage.setItem('denticare_token', token);
  localStorage.setItem('denticare_user', JSON.stringify(userData));
}

export function clearSession() {
  localStorage.removeItem('denticare_token');
  localStorage.removeItem('denticare_user');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearSession();
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      (data && (data.mensaje || data.message || data.error)) ||
      (response.status === 403
        ? 'No cuenta con permisos para realizar esta acción.'
        : 'Error al procesar la solicitud.');
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

export const authService = {
  async login(username, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
};

export const facturaService = {
  async listar(estadoPago = '', page = 0, size = 20) {
    const params = new URLSearchParams({ page, size });
    if (estadoPago) params.append('estadoPago', estadoPago);
    return request(`/facturas?${params.toString()}`);
  },
  async anular(idFactura, motivo) {
    return request(`/facturas/${idFactura}/anular`, {
      method: 'PUT',
      body: JSON.stringify({ motivo }),
    });
  },
};

export const pacienteService = {
  async listarTodos() {
    return request('/pacientes/todos');
  },
  async obtenerPorId(id) {
    // Ajusta la URL si en tu backend la ruta es diferente
    return request(`/pacientes/${id}`); 
  }
};

export const personaService = {
  async listarTodas() {
    return request('/personas/todas');
  },
  async obtenerPorId(idPersona) {
    return request(`/personas/${idPersona}`); 
  }
};

export const historiaClinicaService = {
  async obtenerPorPacienteId(pacienteId) {
    return request(`/historias-clinicas/paciente/${pacienteId}`);
  }
};