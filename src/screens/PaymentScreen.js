import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStripe, StripeProvider } from '@stripe/stripe-react-native';
import { SERVER_BASE_URL } from '../services/api';

const PaymentScreenContent = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  const [error, setError] = useState(null);

  const userId = route.params?.userId;

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  const initializePaymentSheet = async () => {
    try {
      setPaymentLoading(true);
      
      const response = await fetch(`${SERVER_BASE_URL}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: 500 }),
      });

      const text = await response.text();
      if (!text || !response.ok) {
        throw new Error(text || 'Impossible d\'initialiser le paiement');
      }

      const data = JSON.parse(text);

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: data.clientSecret,
        merchantCountryCode: 'US',
        returnURL: 'carreertrack://payment-success',
      });

      if (initError) {
        setError(initError.message);
      } else {
        setPaymentReady(true);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'initialisation du paiement');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code === 'canceled') {
          setError('Paiement annulé');
        } else {
          setError(error.message || 'Échec du paiement');
        }
        return;
      }

      const response = await fetch(`${SERVER_BASE_URL}/payments/mark-featured`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const text = await response.text();
      if (!text || !response.ok) {
        throw new Error(text || 'Échec de l\'activation du profil premium.');
      }

      const data = JSON.parse(text);
      Alert.alert('Succès', 'Vous êtes maintenant en suggestion premium pour 30 jours.');
      navigation.goBack();
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (paymentLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#0056FF" />
          <Text style={styles.loadingText}>Initialisation du paiement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Booster votre profil</Text>
        <Text style={styles.subtitle}>
          Apparaissez en suggestion premium sur CareerTrack pendant 30 jours.
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.payButton, (loading || !paymentReady) && styles.payButtonDisabled]}
          onPress={handleConfirm}
          disabled={loading || !paymentReady}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.payButtonText}>Payer 5 $</Text>
          )}
        </TouchableOpacity>

        {!paymentReady && !error && (
          <Text style={{ color: '#FF3B30', textAlign: 'center', marginTop: 8 }}>
            Initialisation du paiement en cours...
          </Text>
        )}

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const PaymentScreen = () => {
  return (
    <StripeProvider
      publishableKey="pk_test_51RpHM4DiUKZ9Y4tDydvbpT2xT8XMX7sNTBdZ60tWuOkf1a8HhX0F2iV5Ge9RRMGKgfo3zx080OpUPjPCdQW9se2500AkhtiYCF"
      merchantIdentifier="merchant.com.carreertrack"
      androidPayMode="test"
    >
      <PaymentScreenContent />
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  errorText: { color: '#FF3B30', textAlign: 'center', marginBottom: 16 },
  payButton: { backgroundColor: '#0056FF', paddingVertical: 16, borderRadius: 30, alignItems: 'center', width: '100%', marginBottom: 14, shadowColor: '#0056FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  payButtonDisabled: { opacity: 0.7 },
  payButtonText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  cancelButton: { paddingVertical: 12 },
  cancelButtonText: { color: '#666', fontSize: 15, fontWeight: '600' }
});

export default PaymentScreen;
