import { createRouter, createWebHistory } from 'vue-router';
import { getToken } from '../services/api';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import PacientesView from '../views/PacientesView.vue';
import CitasView from '../views/CitasView.vue';
import FacturasView from '../views/FacturasView.vue';
import HistoriaView from '../views/HistoriaView.vue'

const routes = [
  { path: '/login', name: 'Login', component: LoginView, meta: { public: true } },
  { path: '/', name: 'Dashboard', component: DashboardView },
  { path: '/pacientes', name: 'Pacientes', component: PacientesView },
  { path: '/citas', name: 'Citas', component: CitasView },
  { path: '/facturas', name: 'Facturas', component: FacturasView },
  {
  path: '/pacientes/historia/:id',
  name: 'HistoriaPaciente',
  component: HistoriaView
},
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = getToken();
  if (!to.meta.public && !token) {
    next('/login');
  } else if (to.path === '/login' && token) {
    next('/');
  } else {
    next();
  }
});

export default router;