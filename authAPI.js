// Personne 1 - Auth API Module
import { Platform } from 'react-native';

export const API_HOST = '192.168.1.168';
export const API_PORT = '8081';
export const SERVER_PORT = '8080';

const getApiUrl = () => `http://${API_HOST}:${API_PORT}/api`;
const getServerUrl = () => `http://${API_HOST}:${SERVER_PORT}`;

// Auth endpoints
export const login = async (email, password) => {
  try {
    const response = await fetch(`${getApiUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, user: { id: data.id, email: data.email, role: data.role, firstName: data.firstName, lastName: data.lastName, companyId: data.companyId } };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Erreur réseau: ' + error.message };
  }
};

export const register = async (userData) => {
  try {
    const response = await fetch(`${getApiUrl()}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, user: { id: data.id, email: data.email, role: data.role, firstName: data.firstName, lastName: data.lastName } };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Erreur réseau: ' + error.message };
  }
};

export const getProfile = async (email) => {
  try {
    const response = await fetch(`${getApiUrl()}/auth/me?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    if (response.ok) return { success: true, profile: data };
    return { success: false, error: data.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
};