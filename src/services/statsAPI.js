// Personne 5 - Stats/Evaluation API Module
// Cet module contient les endpoints liés aux statistiques et évaluations
import { API_BASE_URL, SERVER_BASE_URL } from '../services/api';

// Statistics endpoints
export const getCompanyStatistics = async (companyId) => {
  const response = await fetch(`${SERVER_BASE_URL}/api/applications/company/${companyId}/statistics`);
  const data = await response.json();
  return { success: response.ok, statistics: data };
};

// Evaluation endpoints
export const createEvaluation = async (evaluationData) => {
  const response = await fetch(`${API_BASE_URL}/evaluations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evaluationData),
  });
  const data = await response.json();
  return { success: response.ok && data.success, data };
};

export const getEvaluationsByInternship = async (internshipId) => {
  const response = await fetch(`${API_BASE_URL}/evaluations/internship/${internshipId}`);
  const data = await response.json();
  return { success: response.ok, evaluations: data };
};

export const getEvaluationsByUser = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/evaluations/user/${userId}`);
  const data = await response.json();
  return { success: response.ok, evaluations: data };
};

export const getCompaniesWithEvaluations = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/companies/evaluations/${userId}`);
  const data = await response.json();
  return { success: response.ok, companies: data.companies || [] };
};

// Featured profiles
export const getFeaturedProfiles = async () => {
  const response = await fetch(`${SERVER_BASE_URL}/api/people/search?featured=true`);
  const data = await response.json();
  return { success: response.ok, profiles: data };
};