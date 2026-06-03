import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { findNearbyJanAushadhi } from '../utils/maps';

// --- THE SAVINGS CARD COMPONENT ---
const SavingsCard = ({ brandedPrice, genericPrice }) => {
  // Prevent division by zero and hide if the generic is somehow more expensive
  const bPrice = Number(brandedPrice);
  const gPrice = Number(genericPrice);
  
  if (!bPrice || isNaN(bPrice) || bPrice <= gPrice) return null;

  const absoluteSavings = bPrice - gPrice;
  const savingsPercentage = Math.round((absoluteSavings / bPrice) * 100);
  
  // Calculate width ratio for the visual bar (Minimum 15% width so it's always visible)
  const genericBarWidth = `${Math.max((gPrice / bPrice) * 100, 15)}%`;

  return (
    <View style={styles.savingsContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.titleText}>Financial Impact</Text>
        <View style={styles.badgeSavings}>
          <Text style={styles.badgeSavingsText}>Save {savingsPercentage}%</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {/* Branded Bar */}
        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Branded</Text>
          <View style={[styles.bar, styles.brandedBar]}>
            <Text style={styles.barPriceText}>₹{bPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* Generic Bar */}
        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Generic</Text>
          <View style={[styles.bar, styles.genericBar, { width: genericBarWidth }]}>
            <Text style={styles.barPriceText}>₹{gPrice.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};


// --- MAIN RESULTS SCREEN ---
export default function ResultsScreen({ route }) {
  const resultsData = route.params?.resultsData;

  // The Safety Net
  if (!resultsData || !resultsData.results) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorHeader}>⚠️ Empty Response</Text>
          <Text style={styles.errorSubtext}>
            The AI Pharmacist couldn't process this data. Check your backend logs.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const itemsList = resultsData.results;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.pageSummary}>
          Analyzed {itemsList.length} medicine{itemsList.length > 1 ? 's' : ''}
        </Text>

        {itemsList.map((item, index) => {
          // Handle backend database errors gracefully
          if (item.error) {
            return (
              <View key={index} style={[styles.card, styles.errorCard]}>
                <Text style={styles.queryText}>💊 {item.original_query}</Text>
                <Text style={styles.errorText}>{item.error}</Text>
              </View>
            );
          }

          const isSafe = item.verification?.is_safe;
          const match = item.best_match;
          const brandedPerUnit = item.market_data?.branded_mrp;

          return (
            <View 
              key={index} 
              style={[
                styles.card, 
                isSafe ? styles.safeCard : styles.unsafeCard
              ]}
            >
              {/* CARD HEADER */}
              <View style={styles.cardHeader}>
                <Text style={styles.queryText}>{item.original_query}</Text>
                <View style={[styles.badge, isSafe ? styles.safeBadge : styles.unsafeBadge]}>
                  <Text style={styles.badgeText}>
                    {isSafe ? '✅ VERIFIED SAFE' : '⚠️ WARNING'}
                  </Text>
                </View>
              </View>

              {/* === SAFE SCENARIO === */}
              {isSafe && match && (
                <View style={styles.matchDetails}>
                  <Text style={styles.sectionTitle}>Cheapest Generic Found:</Text>
                  <Text style={styles.genericName}>{match.generic_name}</Text>
                  
                  {/* The Dynamic Savings Card */}
                  <SavingsCard 
                    brandedPrice={brandedPerUnit} 
                    genericPrice={match.price_per_unit} 
                  />

                  <View style={styles.aiReasonContainer}>
                    <Text style={styles.aiReasonText}>
                      <Text style={{fontWeight: '800'}}>AI Pharmacist: </Text>
                      {item.verification.reason}
                    </Text>
                  </View>
                </View>
              )}

              {/* === UNSAFE SCENARIO === */}
              {!isSafe && (
                <View style={styles.matchDetails}>
                  <View style={styles.criticalWarningBox}>
                    <Text style={styles.criticalWarningTitle}>⚠️ SUBSTITUTION REJECTED</Text>
                    <Text style={styles.warningText}>
                      {item.verification?.reason || item.warning}
                    </Text>
                  </View>
                  
                  <View style={styles.alternativeBox}>
                    <Text style={styles.alternativeTitle}>What you should buy instead:</Text>
                    <Text style={styles.alternativeText}>
                      {item.verification?.suggested_alternative || item.original_query}
                    </Text>
                    
                    {/* Show market price without the savings visualization */}
                    {brandedPerUnit > 0 && (
                      <View style={styles.unsafePriceBox}>
                        <Text style={styles.unsafePriceLabel}>Est. Market Price:</Text>
                        <Text style={styles.unsafePriceValue}>
                          ₹{Number(brandedPerUnit).toFixed(2)} <Text style={styles.unsafePerUnit}>per unit</Text>
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* BOTTOM MAP ACTION BUTTON */}
        <View style={styles.bottomMapSection}>
          <TouchableOpacity 
            style={styles.masterMapButton} 
            onPress={findNearbyJanAushadhi}
          >
            <Text style={styles.masterButtonText}>📍 Locate Nearest Jan Aushadhi</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// --- "APPLE HEALTH" STYLESHEET ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  errorHeader: { fontSize: 22, fontWeight: '800', color: '#FF3B30', marginBottom: 8 },
  errorSubtext: { fontSize: 16, color: '#8E8E93', textAlign: 'center', lineHeight: 22 },
  pageSummary: { fontSize: 13, color: '#8E8E93', marginBottom: 16, textAlign: 'center', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 16, 
    shadowColor: '#000000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 12, 
    elevation: 4,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  safeCard: { borderColor: 'rgba(52, 199, 89, 0.3)' }, 
  unsafeCard: { borderColor: 'rgba(255, 59, 48, 0.3)' }, 
  errorCard: { backgroundColor: '#FAFAFA', borderColor: '#E5E5EA' },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  queryText: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', flex: 1, marginRight: 8, letterSpacing: -0.5 },
  
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, overflow: 'hidden', alignSelf: 'flex-start' },
  safeBadge: { backgroundColor: '#34C759' }, 
  unsafeBadge: { backgroundColor: '#FF3B30' }, 
  badgeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },

  matchDetails: { marginTop: 4 },
  sectionTitle: { fontSize: 12, color: '#8E8E93', textTransform: 'uppercase', fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
  genericName: { fontSize: 18, color: '#1C1C1E', fontWeight: '600', marginBottom: 8 },

  aiReasonContainer: { marginTop: 16 },
  aiReasonText: { fontSize: 15, color: '#3C3C43', backgroundColor: '#F2F2F7', padding: 14, borderRadius: 12, lineHeight: 22 },
  
  errorText: { marginTop: 8, color: '#8E8E93', fontSize: 15, lineHeight: 22 },

  // --- MAP BUTTON STYLES ---
  bottomMapSection: { marginTop: 16, marginBottom: 10 },
  masterMapButton: {
    backgroundColor: '#007AFF', 
    paddingVertical: 16,
    borderRadius: 14, 
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  masterButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },

  // --- SAVINGS CARD STYLES ---
  savingsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: { fontSize: 16, fontWeight: '800', color: '#1C1C1E' },
  badgeSavings: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeSavingsText: { color: '#2E7D32', fontWeight: '800', fontSize: 13 },
  chartContainer: { gap: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center' },
  barLabel: { width: 65, fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  bar: { height: 28, borderRadius: 6, justifyContent: 'center', paddingHorizontal: 8 },
  brandedBar: { width: '80%', backgroundColor: '#FF3B30', opacity: 0.8 },
  genericBar: { backgroundColor: '#34C759' },
  barPriceText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

  // --- UNSAFE SCENARIO STYLES ---
  criticalWarningBox: {
    backgroundColor: '#FFF0F0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  criticalWarningTitle: { fontSize: 14, fontWeight: '800', color: '#FF3B30', marginBottom: 6, letterSpacing: 0.5 },
  warningText: { fontSize: 15, color: '#FF3B30', fontWeight: '600', lineHeight: 22 },
  alternativeBox: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 4, borderWidth: 1, borderColor: '#E5E5EA' },
  alternativeTitle: { fontSize: 12, color: '#8E8E93', textTransform: 'uppercase', fontWeight: '700', marginBottom: 6 },
  alternativeText: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  unsafePriceBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unsafePriceLabel: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  unsafePriceValue: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  unsafePerUnit: { fontSize: 12, fontWeight: '500', color: '#8E8E93' }
});