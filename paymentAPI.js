// Personne 4 - Payment API Module
// Cet module contient les endpoints liés au paiement
import { SERVER_BASE_URL } from '../services/api';

export const initPaymentSheet = async (userId) => {
  const response = await fetch(`${SERVER_BASE_URL}/create-payment-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, amount: 500 }),
  });
  const data = await response.json();
  return { clientSecret: data.clientSecret, customerId: data.customerId };
};

export const markFeatured = async (userId) => {
  const response = await fetch(`${SERVER_BASE_URL}/payments/mark-featured`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  const data = await response.json();
  return { success: response.ok, data };
};