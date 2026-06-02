// Personne 2 - Internship API Module
// Cet module contient les endpoints liés aux stages et candidatures
import { API_BASE_URL, SERVER_BASE_URL } from '../services/api';

// Internship endpoints
export const postInternship = async (internshipData) => {
  const response = await fetch(`${API_BASE_URL}/internships/post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(internshipData),
  });
  const data = await response.json();
  return { success: response.ok, internship: data };
};

export const getAllInternships = async () => {
  const response = await fetch(`${API_BASE_URL}/internships/all`);
  const data = await response.json();
  return { success: response.ok, internships: data };
};

export const getCompanyInternships = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/internships/company/${userId}`);
  const data = await response.json();
  return { success: response.ok, internships: data };
};

// Application endpoints
export const applyToInternship = async (internshipId, userId, message) => {
  const response = await fetch(`${API_BASE_URL}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ internshipId, userId, message }),
  });
  const data = await response.json();
  return { success: response.ok, application: data };
};

export const getApplicants = async (internshipId) => {
  const response = await fetch(`${API_BASE_URL}/applications/internship/${internshipId}`);
  const data = await response.json();
  return { success: response.ok, applicants: data };
};

export const updateApplicationStatus = async (applicationId, status) => {
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const data = await response.json();
  return { success: response.ok, data };
};