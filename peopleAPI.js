// Personne 3 - People/Profile API Module
// Cet module contient les endpoints liés aux profils utilisateurs et recherche
import { API_BASE_URL, SERVER_BASE_URL } from '../services/api';

export const searchPeople = async ({ keyword = '', type = '', degree = '', filiere = '', featured = false } = {}) => {
  const params = new URLSearchParams();
  if (keyword) params.set('keyword', keyword);
  if (type) params.set('type', type);
  if (degree) params.set('degree', degree);
  if (filiere) params.set('filiere', filiere);
  if (featured) params.set('featured', 'true');
  
  const response = await fetch(`${API_BASE_URL}/people/search${params.toString() ? `?${params.toString()}` : ''}`);
  const data = await response.json();
  return { success: response.ok, results: data };
};

export const updateStudentProfile = async (studentId, { degree, diplomaImage }) => {
  const response = await fetch(`${API_BASE_URL}/people/students/${studentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ degree, diplomaImage }),
  });
  const data = await response.json();
  return { success: response.ok, student: data };
};

export const updateTeacherProfile = async (teacherId, { filiere }) => {
  const response = await fetch(`${API_BASE_URL}/people/teachers/${teacherId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filiere }),
  });
  const data = await response.json();
  return { success: response.ok, teacher: data };
};