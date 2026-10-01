import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ============================================================================
// FindRideScreen.js
//
// This is the "hook showcase" screen of the project — it's the one place
// where FOUR different hooks work together:
//   useState    -> holds all the changing values (search text, ride list...)
//   useEffect   -> fetches the ride list once, when the screen first appears
//   useMemo     -> recalculates derived data ONLY when its inputs change
//   useCallback -> keeps a function's identity stable across re-renders
// ============================================================================

const CAMPUS_LOCATIONS = [
  'Hostel A - Female Wing',
  'Hostel B - Male Wing',
  'Main Gate',
  'Lecture Complex',
  'Library',
  'Cafeteria',
  'Admin Block',
  'ICT Center',
  'Sports Complex',
  'Chapel / Mosque',
];

// ---------------------------------------------------------------------------
// MOCK DATA — stands in for the real GET /rides response from the backend.
// Swap this out inside fetchAvailableRides() once that endpoint is live;
// the shape below is what the UI expects so nothing else needs to change.
// ---------------------------------------------------------------------------
const MOCK_RIDES = [
  {
    id: 'r1',
    driverName: 'Chinedu Okafor',
    rating: 4.8,
    vehicle: 'Toyota Corolla · White',
    pickup: 'Main Gate',
    destination: 'Lecture Complex',
    departureTime: '10:30 AM',
    seatsAvailable: 3,
    price: 150,
    status: 'available',
  },
  {
    id: 'r2',
    driverName: 'Aisha Bello',
    rating: 4.9,
    vehicle: 'Honda Accord · Silver',
    pickup: 'Hostel A - Female Wing',
    destination: 'Library',
    departureTime: '11:15 AM',
    seatsAvailable: 1,
    price: 100,
    status: 'available',
  },
  {
    id: 'r3',
    driverName: 'Tunde Adeyemi',
    rating: 4.6,
    vehicle: 'Keke Napep',
    pickup: 'Main Gate',
    destination: 'Cafeteria',
    departureTime: '11:45 AM',
    seatsAvailable: 2,
    price: 100,
    status: 'available',
  },
  {
    id: 'r4',
    driverName: 'Grace Eze',
    rating: 4.7,
    vehicle: 'Toyota Sienna · Grey',
    pickup: 'Hostel B - Ma  le Wing',
    destination: 'Sports Complex',
    departureTime: '12:00 PM',
    seatsAvailable: 0,
    price: 150,
    status: 'full',
  },
  {
    id: 'r5',
    driverName: 'Lincoln Campus Shuttle',
    rating: 4.5,
    vehicle: 'Shuttle Bus',
    pickup: 'Main Gate',
    destination: 'Admin Block',
    departureTime: '12:15 PM',
    seatsAvailable: 12,
    price: 0,
    status: 'available',
  },
];

function naira(amount) {
  return `₦${amount.toLocaleString()}`;
}

// Props:
//   logActivity(title, subtitle, icon) — optional. Passed down from
//   DashboardScreen so a completed ride request shows up in the Activity
//   tab. Safe to omit if this screen is ever used standalone.
export default function FindRideScreen({ logActivity }) {
  // --------------------------------------------------------------------
  // HOOK: useState (x8) — every piece of data that can change over time
  // and should cause a re-render when it does.
  //   destination       -> what the user typed into the search bar
  //   isSearching       -> whether to show the location-suggestion dropdown
  //   selectedRideId    -> which ride card the user tapped (or null)
  //   isBooking         -> true while the fake "Requesting..." delay runs
  //   rides             -> the full list of rides once "fetched"
  //   loading           -> true only during the very first fetch
  //   refreshing        -> true only while pull-to-refresh is spinning
  //   error             -> an error message string, or null if none
  // --------------------------------------------------------------------
  const [destination, setDestination] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState(null);
  const [isBooking, setIsBooking] = useState(false);

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // --------------------------------------------------------------------
  // HOOK: useMemo
  // useMemo(calculateValue, dependencyArray) re-runs `calculateValue` ONLY
  // when something inside `dependencyArray` has changed since the last
  // render. If the dependencies are the same, React just hands back the
  // PREVIOUSLY calculated result instead of recalculating — this avoids
  // wasted work on every re-render for a value that's expensive (or just
  // unnecessary) to recompute.
  //
  // Here: `suggestions` only needs to be recalculated when `destination`
  // changes — there's no reason to re-filter CAMPUS_LOCATIONS on renders
  // caused by, say, `isBooking` changing.
  // --------------------------------------------------------------------
  const suggestions = useMemo(() => {
    if (!destination.trim()) return CAMPUS_LOCATIONS.slice(0, 5);
    const q = destination.trim().toLowerCase();
    return CAMPUS_LOCATIONS.filter((p) => p.toLowerCase().includes(q)).slice(0, 5);
  }, [destination]); // <-- recompute only when `destination` changes

  // --------------------------------------------------------------------
  // HOOK: useCallback
  // useCallback(fn, dependencyArray) returns the SAME function reference
  // across re-renders, as long as the dependencies haven't changed. This
  // matters here because fetchAvailableRides is used INSIDE a useEffect's
  // dependency array below — without useCallback, a plain function
  // declaration would be a brand-new reference on every render, which
  // would make that useEffect think its dependency changed and re-run
  // every single render (an infinite loop risk).
  //
  // Since fetchAvailableRides doesn't depend on any state or props here,
  // its dependency array is empty [] — it's created once and reused.
  //
  // Replace the setTimeout block with the real API call once the backend
  // ride-matching endpoint is live, e.g.:
  //   const res = await fetch(`${API_URL}/rides`, {
  //     headers: { Authorization: `Bearer ${user.token}` },
  //   });
  //   setRides(await res.json());
  // --------------------------------------------------------------------
  const fetchAvailableRides = useCallback(async () => {
    try {
      setError(null);
      await new Promise((resolve) => setTimeout(resolve, 700)); // fake network delay
      setRides(MOCK_RIDES);
    } catch (err) {
      setError('Could not load rides. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // --------------------------------------------------------------------
  // HOOK: useEffect
  // Runs fetchAvailableRides() once when the screen mounts, and again any
  // time fetchAvailableRides itself changes (which — thanks to useCallback
  // above — it never does, so in practice this behaves like "run once").
  // This is how the screen loads its ride list automatically without the
  // user having to tap a "Load" button first.
  // --------------------------------------------------------------------
  useEffect(() => {
    fetchAvailableRides();
  }, [fetchAvailableRides]);

  // Called when the user pulls down on the list (pull-to-refresh gesture).
  const onRefresh = () => {
    setRefreshing(true);
    setSelectedRideId(null); // clear any previous selection on refresh
    fetchAvailableRides();
  };

  // --------------------------------------------------------------------
  // Another useMemo: filters the fetched `rides` down to only the ones
  // matching the current search text. Recomputes only when `rides` OR
  // `destination` changes — not on every keystroke-unrelated re-render.
  // --------------------------------------------------------------------
  const filteredRides = useMemo(() => {
    const q = destination.trim().toLowerCase();
    if (!q) return rides;
    return rides.filter(
      (r) => r.destination.toLowerCase().includes(q) || r.pickup.toLowerCase().includes(q)
    );
  }, [rides, destination]);

  // Plain derived values — cheap enough to not need useMemo, calculated
  // fresh on every render directly from state.
  const selectedRide = filteredRides.find((r) => r.id === selectedRideId);
  const canBook = !!selectedRide;

  const handlePickSuggestion = (place) => {
    setDestination(place);
    setIsSearching(false);
    Keyboard.dismiss();
  };

  const handleRequestRide = () => {
    if (!canBook || isBooking) return; // guard clause
    setIsBooking(true);
    setTimeout(() => {
      setIsBooking(false);
      const priceLabel = selectedRide.price === 0 ? 'Free' : naira(selectedRide.price);
      if (logActivity) {
        // logActivity is a callback prop passed down from DashboardScreen —
        // calling it here lets a CHILD screen (FindRideScreen) add an entry
        // to state that actually lives in the PARENT (DashboardScreen).
        logActivity(
          `Ride with ${selectedRide.driverName} to ${selectedRide.destination}`,
          `Just now · ${priceLabel}`,
          'car-outline'
        );
      }
      Alert.alert(
        'Ride requested 🎉',
        `${selectedRide.driverName} · ${selectedRide.pickup} → ${selectedRide.destination}\n${priceLabel} · Departs ${selectedRide.departureTime}`,
        [{ text: 'OK', onPress: () => { setDestination(''); setSelectedRideId(null); } }]
      );
    }, 800);
  };

  // Renders a single ride card for the FlatList below.
  const renderRideCard = ({ item }) => {
    const isFull = item.status === 'full';
    const isSelected = item.id === selectedRideId;
    return (
      <TouchableOpacity
        style={[styles.rideCard, isSelected && styles.rideCardSelected, isFull && styles.rideCardDisabled]}
        activeOpacity={isFull ? 1 : 0.85}
        disabled={isFull}
        onPress={() => setSelectedRideId((prev) => (prev === item.id ? null : item.id))}
      >
        <View style={[styles.rideIconWrap, isSelected && styles.rideIconWrapSelected]}>
          <Text style={[styles.driverInitial, isSelected && styles.driverInitialSelected]}>
            {item.driverName.charAt(0)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rideLabel}>{item.driverName}</Text>
          <Text style={styles.rideEta} numberOfLines={1}>
            {item.pickup} → {item.destination}
          </Text>
          <View style={styles.rideMetaRow}>
            <Ionicons name="star" size={12} color="#f5a623" />
            <Text style={styles.rideMetaText}>{item.rating} · {item.vehicle}</Text>
          </View>
          <View style={styles.rideMetaRow}>
            <Ionicons name="time-outline" size={12} color="#999" />
            <Text style={styles.rideMetaText}>{item.departureTime}</Text>
            <Ionicons name="people-outline" size={12} color="#999" style={{ marginLeft: 10 }} />
            <Text style={styles.rideMetaText}>
              {isFull ? 'Full' : `${item.seatsAvailable} seats left`}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.ridePrice}>{item.price === 0 ? 'Free' : naira(item.price)}</Text>
          {isSelected && <Ionicons name="checkmark-circle" size={20} color="#0e9d5a" style={{ marginTop: 6 }} />}
        </View>
      </TouchableOpacity>
    );
  };

  // The search bar + suggestion dropdown, rendered as the FlatList's header.
  const renderListHeader = () => (
    <View>
      <Text style={styles.screenTitle}>Book a Ride</Text>

      <View style={styles.searchBar}>
        <View style={styles.searchDot} />
        {/* CONTROLLED INPUT: value comes from `destination` state, and every
            keystroke updates it via onChangeText -- same pattern as the
            login/signup forms, just used for search instead of a form. */}
        <TextInput
          style={styles.searchInput}
          placeholder="Where on campus?"
          placeholderTextColor="#999"
          value={destination}
          onChangeText={(text) => { setDestination(text); setIsSearching(true); }}
          onFocus={() => setIsSearching(true)}
          returnKeyType="search"
          onSubmitEditing={() => setIsSearching(false)}
        />
        {destination.length > 0 && (
          <TouchableOpacity onPress={() => setDestination('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      {isSearching && (
        <View style={styles.suggestionBox}>
          {suggestions.map((place, idx) => (
            <TouchableOpacity
              key={place}
              style={[styles.suggestionRow, idx === suggestions.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => handlePickSuggestion(place)}
              activeOpacity={0.6}
            >
              <Ionicons name="location-outline" size={16} color="#0e9d5a" />
              <Text style={styles.suggestionText}>{place}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>
        {destination.trim() ? `Rides near "${destination.trim()}"` : 'Available rides'}
      </Text>
    </View>
  );

  // Handles the three "nothing to show yet" states: loading, error, empty.
  const renderListEmpty = () => {
    if (loading) {
      return (
        <View style={styles.rideStateWrap}>
          <ActivityIndicator size="large" color="#0e9d5a" />
          <Text style={styles.rideStateText}>Finding rides near you…</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.rideStateWrap}>
          <Ionicons name="alert-circle-outline" size={36} color="#e0453c" />
          <Text style={styles.rideStateText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAvailableRides}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.rideStateWrap}>
        <Ionicons name="car-outline" size={36} color="#ccc" />
        <Text style={styles.rideStateText}>
          {destination.trim()
            ? `No rides heading to "${destination.trim()}" right now.`
            : 'No rides are available right now. Check back soon.'}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={loading || error ? [] : filteredRides}
        keyExtractor={(item) => item.id}
        renderItem={renderRideCard}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderListEmpty}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0e9d5a']} tintColor="#0e9d5a" />}
        ListFooterComponent={canBook ? <View style={{ height: 70 }} /> : null}
      />

      {canBook && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.primaryButton, isBooking && styles.primaryButtonDisabled]}
            activeOpacity={0.85}
            onPress={handleRequestRide}
            disabled={isBooking}
          >
            <Text style={styles.primaryButtonText}>
              {isBooking ? 'Requesting...' : `Request Ride · ${selectedRide.price === 0 ? 'Free' : naira(selectedRide.price)}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },
  screenTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 14, marginTop: 4 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  searchDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0e9d5a', marginRight: 12 },
  searchInput: { flex: 1, fontSize: 15, color: '#1a1a1a', fontWeight: '500', paddingVertical: 0 },

  suggestionBox: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  suggestionText: { fontSize: 14, color: '#1a1a1a', marginLeft: 10 },

  rideCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14, marginBottom: 10,
    borderWidth: 1.5, borderColor: 'transparent',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  rideCardSelected: { borderColor: '#0e9d5a', backgroundColor: '#f3fbf6' },
  rideCardDisabled: { opacity: 0.5 },
  rideIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#e9f8ef', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rideIconWrapSelected: { backgroundColor: '#0e9d5a' },
  rideLabel: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  rideEta: { fontSize: 12, color: '#999', marginBottom: 4 },
  ridePrice: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  driverInitial: { fontSize: 16, fontWeight: '700', color: '#0e9d5a' },
  driverInitialSelected: { color: '#fff' },
  rideMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  rideMetaText: { fontSize: 11.5, color: '#999', marginLeft: 4 },

  rideStateWrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  rideStateText: { fontSize: 13, color: '#999', textAlign: 'center', marginTop: 10, lineHeight: 18 },
  retryButton: { marginTop: 14, backgroundColor: '#0e9d5a', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#eee',
  },
  primaryButton: { backgroundColor: '#0e9d5a', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});