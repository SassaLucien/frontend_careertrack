const BASE_URL = 'http://192.168.1.118:8080';

export const API_BASE_URL = BASE_URL;
export const SERVER_BASE_URL = BASE_URL;

export async function login(email, password) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur de connexion' };
    }
    return { success: true, user: data };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function register(userData) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Erreur d'inscription" };
    }
    return { success: true, user: data };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function getFeaturedProfiles() {
  try {
    const response = await fetch(`${BASE_URL}/api/people/search?featured=true&type=STUDENT`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur lors du chargement des profils' };
    }
    const students = (data || []).filter(p => p.type === 'STUDENT');
    const teachers = await fetch(`${BASE_URL}/api/people/search?featured=true&type=TEACHER`);
    const teachersData = await teachers.json();
    if (teachers.ok) {
      return { success: true, profiles: [...students, ...teachersData] };
    }
    return { success: true, profiles: students };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function searchPeople({ keyword, type, degree, filiere }) {
  try {
    const params = new URLSearchParams({ keyword: keyword || '', type: type || '', degree: degree || '', filiere: filiere || '' }).toString();
    const response = await fetch(`${BASE_URL}/api/people/search?${params}`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur de recherche' };
    }
    return { success: true, results: data || [] };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function markFeatured(userId) {
  try {
    const response = await fetch(`${BASE_URL}/api/mark-featured/${userId}`, {
      method: 'POST',
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function getAllInternships() {
  try {
    const response = await fetch(`${BASE_URL}/api/internships/all`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur' };
    }
    return { success: true, internships: data || [] };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function getCompanyInternships(userId) {
  try {
    const response = await fetch(`${BASE_URL}/api/internships/company/${userId}`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur' };
    }
    return { success: true, internships: data || [] };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function postInternship(internshipData) {
  try {
    console.log('Posting internship to /api/internships/post:', JSON.stringify(internshipData));
    const response = await fetch(`${BASE_URL}/api/internships/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(internshipData),
    });
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response text:', text);
    try {
      const data = JSON.parse(text);
      if (!response.ok) {
        return { success: false, error: data.error || `Erreur serveur (${response.status})` };
      }
      return { success: true, internship: data };
    } catch (parseError) {
      return { success: false, error: `Réponse non JSON: ${text.substring(0, 100)}` };
    }
  } catch (error) {
    console.log('Post internship error:', error);
    return { success: false, error: 'Erreur connexion: ' + error.message };
  }
}

export async function updateInternship(internshipId, data) {
  try {
    const response = await fetch(`${BASE_URL}/api/internships/${internshipId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error || 'Erreur' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function deleteInternship(internshipId) {
  try {
    const response = await fetch(`${BASE_URL}/api/internships/${internshipId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function getApplicants(internshipId) {
  try {
    const response = await fetch(`${BASE_URL}/api/applications/internship/${internshipId}`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur' };
    }
    return { success: true, applicants: data || [] };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function applyToInternship(internshipId, userId, message) {
  try {
    const response = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ internshipId, userId, message }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function getAcceptedCandidates(internshipId) {
  try {
    const response = await fetch(`${BASE_URL}/api/applications/accepted/internship/${internshipId}`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur' };
    }
    return { success: true, candidates: data || [] };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function getApplicationCounts(internshipId) {
  try {
    const response = await fetch(`${BASE_URL}/api/applications/count/${internshipId}`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur' };
    }
    return { success: true, counts: data };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function getCompanyApplications(companyId) {
  try {
    const response = await fetch(`${BASE_URL}/api/applications/company/${companyId}`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur' };
    }
    return { success: true, applications: data || [] };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function updateApplicationStatus(applicationId, status, companyId) {
  try {
    const response = await fetch(`${BASE_URL}/api/applications/${applicationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, companyId }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function deleteApplication(applicationId) {
  try {
    const response = await fetch(`${BASE_URL}/api/applications/${applicationId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function getEvaluationsByInternship(internshipId) {
  try {
    const response = await fetch(`${BASE_URL}/api/evaluations/internship/${internshipId}`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur' };
    }
    return { success: true, evaluations: data || [] };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function getEvaluationsByUser(userId) {
  try {
    const response = await fetch(`${BASE_URL}/api/evaluations/user/${userId}`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur' };
    }
    return { success: true, evaluations: data || [] };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function createEvaluation({ internshipId, applicantId, companyId, behaviorRating, skillsRating, comment }) {
  try {
    const response = await fetch(`${BASE_URL}/api/evaluations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ internshipId, applicantId, companyId, behaviorRating, skillsRating, comment }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function getCompanyById(companyId) {
  try {
    const response = await fetch(`${BASE_URL}/api/companies/${companyId}`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur' };
    }
    return { success: true, company: data };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function getCompaniesWithEvaluations(userId) {
  try {
    const response = await fetch(`${BASE_URL}/api/companies/evaluations/${userId}`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur' };
    }
    return { success: true, companies: data.companies || [] };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}

export async function getProfile(email) {
  try {
    const response = await fetch(`${BASE_URL}/api/profile/${encodeURIComponent(email)}`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur' };
    }
    return { success: true, profile: data };
  } catch (error) {
    return { success: false, error: error.message || 'Erreur réseau' };
  }
}