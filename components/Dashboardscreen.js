import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import FindRideScreen from './Findridescreen';

/* ---------------------------------- DATA --------------------------------- */
// Plain constant arrays used to render lists (food menu, study rooms, etc.)
// None of this is state — it never changes while the app runs, so it lives
// outside the component instead of inside a useState call.

const FOOD_ITEMS = [
  { id: 'jollof', name: 'Jollof Rice & Chicken', price: 800 },
  { id: 'friedrice', name: 'Fried Rice & Fish', price: 900 },
  { id: 'noodles', name: 'Noodles & Egg', price: 500 },
  { id: 'shawarma', name: 'Chicken Shawarma', price: 1200 },
  { id: 'zobo', name: 'Zobo Drink', price: 300 },
  { id: 'water', name: 'Bottled Water', price: 200 },
];

const STUDY_ROOMS = ['Library Study Room 1', 'Library Study Room 2', 'ICT Lab Booth', 'Group Discussion Room'];
const STUDY_SLOTS = ['8:00 - 9:00 AM', '9:00 - 10:00 AM', '10:00 - 11:00 AM', '2:00 - 3:00 PM', '3:00 - 4:00 PM'];
const LAUNDRY_SLOTS = ['Today Evening (5–7PM)', 'Tomorrow Morning (8–10AM)', 'Tomorrow Evening (5–7PM)'];

const QUICK_ACTIONS = [
  { id: 'ride', label: 'Book a Ride', icon: 'car-outline' },
  { id: 'food', label: 'Order Food', icon: 'fast-food-outline' },
  { id: 'study', label: 'Study Room', icon: 'book-outline' },
  { id: 'print', label: 'Print & Copy', icon: 'print-outline' },
  { id: 'laundry', label: 'Laundry', icon: 'shirt-outline' },
  { id: 'emergency', label: 'Campus Security', icon: 'call-outline' },
];

function naira(amount) {
  return `₦${amount.toLocaleString()}`;
}

/* --------------------------------- SCREEN --------------------------------- */
// ============================================================================
// DashboardScreen.js
//
// This screen is the "Bottom Tab Navigator" of the lecture — EXCEPT, again,
// implemented manually with useState + conditional rendering instead of
// @react-navigation/bottom-tabs. `activeTab` plays the same role as which
// Tab.Screen is currently focused in the lecture's slides.
//
// It's also the best example in the whole project of "LIFTING STATE UP":
// `activityLog` (the list shown in the Activity tab) is declared HERE, in
// the parent, and a function to update it (`logActivity`) is passed DOWN as
// a prop to child components (HomeTab, FindRideScreen, the service panels).
// Those children can then add entries to a list that doesn't even live in
// their own component — they just call the function they were given.
// ============================================================================

export default function DashboardScreen({ user, onGoToProfile }) {
  // --------------------------------------------------------------------
  // HOOK: useState
  // activeTab      -> which bottom tab is currently selected: 'home',
  //                   'rides', 'services', 'activity', or 'profile'.
  //                   This is our hand-rolled equivalent of a Tab Navigator.
  // activeService  -> when on the "services" tab, which specific service
  //                   panel is open (food / study / print / laundry), or
  //                   null to show the services MENU instead of a panel.
  //                   This is a NESTED level of "navigation" state, similar
  //                   to nesting a Stack Navigator inside one Tab.
  // activityLog    -> an array of past actions, newest first. Starts with
  //                   two seed entries so the Activity tab isn't empty on
  //                   first load.
  // --------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState('home');
  const [activeService, setActiveService] = useState(null); // 'food' | 'study' | 'print' | 'laundry'
  const [activityLog, setActivityLog] = useState([
    { id: 'seed-1', title: 'Shuttle to Lecture Complex', subtitle: 'Yesterday · Free', icon: 'car-outline' },
    { id: 'seed-2', title: 'Jollof Rice & Chicken', subtitle: 'Mon · ₦800', icon: 'fast-food-outline' },
  ]);

  // ----------------------------------------------------------------
  // logActivity — the function we pass DOWN to every child screen so
  // THEY can add a new entry to OUR activityLog state (lifting state up
  // in action). It builds a brand-new array with the new entry at the
  // front (`[newEntry, ...prev]`) rather than mutating the old array —
  // same "never mutate state directly" rule the lecture stresses for
  // objects also applies to arrays.
  // ----------------------------------------------------------------
  const logActivity = (title, subtitle, icon) => {
    setActivityLog((prev) => [{ id: String(Date.now()), title, subtitle, icon }, ...prev]);
  };

  // Handles taps on the Quick Actions grid on the Home tab. Some actions
  // jump straight to a tab (ride), some show a native confirmation dialog
  // (emergency), and the rest open the Services tab with a specific panel
  // pre-selected.
  const goToService = (serviceId) => {
    if (serviceId === 'ride') {
      setActiveTab('rides');
      return;
    }
    if (serviceId === 'emergency') {
      Alert.alert(
        'Campus Security',
        'Call the Lincoln College Abuja security desk now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => logActivity('Called Campus Security', 'Just now', 'call-outline') },
        ]
      );
      return;
    }
    setActiveTab('services');
    setActiveService(serviceId);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.body}>
        {/*
          CONDITIONAL RENDERING AS TAB SWITCHING:
          Exactly one of these five expressions renders something, based on
          `activeTab`. `condition && <Component />` is JSX shorthand: if
          `condition` is false, React renders nothing at all for that line;
          if true, it renders the component. This is the exact pattern
          flagged as a prerequisite in the Controlled Inputs lecture notes.
        */}
        {activeTab === 'home' && <HomeTab user={user} onQuickAction={goToService} activityLog={activityLog} />}
        {activeTab === 'rides' && <FindRideScreen logActivity={logActivity} />}
        {activeTab === 'services' && (
          <ServicesTab
            activeService={activeService}
            setActiveService={setActiveService}
            logActivity={logActivity}
          />
        )}
        {activeTab === 'activity' && <ActivityTab activityLog={activityLog} />}
        {activeTab === 'profile' && <ProfileTab onGoToProfile={onGoToProfile} />}
      </View>

      {/* Bottom tab bar — five buttons, each just calls setActiveTab(name) */}
      <View style={styles.tabBar}>
        <TabButton icon="home" label="Home" active={activeTab === 'home'} onPress={() => setActiveTab('home')} />
        <TabButton icon="car" label="Rides" active={activeTab === 'rides'} onPress={() => setActiveTab('rides')} />
        <TabButton
          icon="grid"
          label="Services"
          active={activeTab === 'services'}
          onPress={() => {
            setActiveTab('services');
          }}
        />
        <TabButton icon="receipt" label="Activity" active={activeTab === 'activity'} onPress={() => setActiveTab('activity')} />
        <TabButton icon="person" label="Profile" active={activeTab === 'profile'} onPress={() => setActiveTab('profile')} />
      </View>
    </View>
  );
}

// A single tab bar button. No hooks of its own — just receives `active`
// (a boolean) as a prop and swaps the icon/color/label style based on it.
function TabButton({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity style={styles.tabButton} activeOpacity={0.7} onPress={onPress}>
      <Ionicons name={active ? icon : `${icon}-outline`} size={22} color={active ? '#0052cc' : '#999'} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ----------------------------------- HOME ---------------------------------- */

// The Home tab's content. `activityLog` and `onQuickAction` are just props
// handed down from DashboardScreen — HomeTab itself holds no state.
function HomeTab({ user, onQuickAction, activityLog }) {
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'there';
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.greeting}>Good afternoon, {firstName} 👋</Text>
      <Text style={styles.name}>Lincoln College, Abuja</Text>

      <View style={styles.promoBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.promoTitle}>Everything on campus, one tap away</Text>
          <Text style={styles.promoSubtitle}>Rides, food, study rooms, printing & more</Text>
        </View>
        <MaterialCommunityIcons name="school-outline" size={32} color="#fff" />
      </View>

      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.quickGrid}>
        {/* .map() renders one card per entry in the QUICK_ACTIONS constant array */}
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickCard}
            activeOpacity={0.85}
            onPress={() => onQuickAction(action.id)}
          >
            <View style={styles.quickIconWrap}>
              <Ionicons name={action.icon} size={22} color="#0052cc" />
            </View>
            <Text style={styles.quickLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Recent activity</Text>
      <View style={styles.tripList}>
        {/* Only show the 3 most recent activityLog entries on the home screen */}
        {activityLog.slice(0, 3).map((entry) => (
          <View key={entry.id} style={styles.tripRow}>
            <View style={styles.tripIconWrap}>
              <Ionicons name={entry.icon || 'time-outline'} size={18} color="#0052cc" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tripTitle}>{entry.title}</Text>
              <Text style={styles.tripSubtitle}>{entry.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/* --------------------------------- SERVICES --------------------------------- */

// ServicesTab has NO state of its own — `activeService` and
// `setActiveService` are passed down from DashboardScreen and used here to
// decide which "sub-screen" to show. This is another small nested-navigation
// layer, similar to a Stack Navigator living inside one Tab.
function ServicesTab({ activeService, setActiveService, logActivity }) {
  if (activeService === 'food') return <FoodOrderPanel onBack={() => setActiveService(null)} logActivity={logActivity} />;
  if (activeService === 'study') return <StudyRoomPanel onBack={() => setActiveService(null)} logActivity={logActivity} />;
  if (activeService === 'print') return <PrintPanel onBack={() => setActiveService(null)} logActivity={logActivity} />;
  if (activeService === 'laundry') return <LaundryPanel onBack={() => setActiveService(null)} logActivity={logActivity} />;

  // If no service is selected yet, show the menu of service cards instead.
  const CARDS = [
    { id: 'food', label: 'Food & Drinks', desc: 'Order from the campus cafeteria', icon: 'fast-food-outline' },
    { id: 'study', label: 'Study Room Booking', desc: 'Reserve a quiet room or booth', icon: 'book-outline' },
    { id: 'print', label: 'Print & Copy', desc: 'Send documents to the ICT center', icon: 'print-outline' },
    { id: 'laundry', label: 'Laundry Pickup', desc: 'Schedule a pickup from your hostel', icon: 'shirt-outline' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.screenTitle}>Campus Services</Text>
      {CARDS.map((card) => (
        <TouchableOpacity
          key={card.id}
          style={styles.serviceCard}
          activeOpacity={0.85}
          onPress={() => setActiveService(card.id)}
        >
          <View style={styles.rideIconWrap}>
            <Ionicons name={card.icon} size={22} color="#0052cc" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rideLabel}>{card.label}</Text>
            <Text style={styles.rideEta}>{card.desc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// A tiny reusable header (back arrow + title) shared by all four service panels.
function PanelHeader({ title, onBack }) {
  return (
    <View style={styles.panelHeader}>
      <TouchableOpacity onPress={onBack} hitSlop={10}>
        <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
      </TouchableOpacity>
      <Text style={styles.panelHeaderTitle}>{title}</Text>
      <View style={{ width: 22 }} />
    </View>
  );
}

// ----------------------------------------------------------------------
// FoodOrderPanel — its own useState for a shopping cart, e.g.
//   { jollof: 2, water: 1 }
// keyed by food item id -> quantity. A good talking point: this is a
// SINGLE state object, keyed dynamically by item id, similar in spirit to
// the lecture's "one object instead of many useStates" idea, just applied
// to a cart instead of a form.
// ----------------------------------------------------------------------
function FoodOrderPanel({ onBack, logActivity }) {
  const [cart, setCart] = useState({});

  // Derived values, recalculated on every render directly from `cart` —
  // small and cheap enough that useMemo isn't needed here.
  const total = FOOD_ITEMS.reduce((sum, item) => sum + (cart[item.id] || 0) * item.price, 0);
  const itemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  // Increases/decreases one item's quantity by `delta` (+1 or -1), using
  // computed property syntax [id]: ... just like the lecture's handleChange,
  // and removes the key entirely once its quantity hits 0.
  const changeQty = (id, delta) => {
    setCart((prev) => {
      const next = { ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) };
      if (next[id] === 0) delete next[id];
      return next;
    });
  };

  const handleCheckout = () => {
    if (itemCount === 0) return; // guard clause
    logActivity(`Cafeteria order (${itemCount} item${itemCount > 1 ? 's' : ''})`, `Just now · ${naira(total)}`, 'fast-food-outline');
    Alert.alert('Order placed 🎉', `${itemCount} item(s) for ${naira(total)}. Pickup at the cafeteria counter.`);
    setCart({}); // reset cart back to empty after checkout
  };

  return (
    <View style={{ flex: 1 }}>
      <PanelHeader title="Order Food" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {FOOD_ITEMS.map((item) => {
          const qty = cart[item.id] || 0;
          return (
            <View key={item.id} style={styles.foodRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rideLabel}>{item.name}</Text>
                <Text style={styles.rideEta}>{naira(item.price)}</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => changeQty(item.id, -1)} disabled={qty === 0}>
                  <Ionicons name="remove" size={16} color={qty === 0 ? '#ccc' : '#0052cc'} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{qty}</Text>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => changeQty(item.id, 1)}>
                  <Ionicons name="add" size={16} color="#0052cc" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        {itemCount > 0 && <View style={{ height: 70 }} />}
      </ScrollView>

      {itemCount > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleCheckout}>
            <Text style={styles.primaryButtonText}>Checkout · {naira(total)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// StudyRoomPanel — two independent useState values (room, slot). The confirm
// button only appears once BOTH are chosen (canConfirm = !!room && !!slot).
function StudyRoomPanel({ onBack, logActivity }) {
  const [room, setRoom] = useState(null);
  const [slot, setSlot] = useState(null);

  const canConfirm = !!room && !!slot;

  const handleConfirm = () => {
    if (!canConfirm) return;
    logActivity(`${room} booked`, `Just now · ${slot}`, 'book-outline');
    Alert.alert('Room booked 🎉', `${room}\n${slot}`);
    setRoom(null);
    setSlot(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <PanelHeader title="Study Room Booking" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Choose a room</Text>
        <View style={styles.chipWrap}>
          {STUDY_ROOMS.map((r) => (
            <TouchableOpacity key={r} style={[styles.chip, room === r && styles.chipSelected]} onPress={() => setRoom(r)}>
              <Text style={[styles.chipText, room === r && styles.chipTextSelected]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Choose a time slot</Text>
        <View style={styles.chipWrap}>
          {STUDY_SLOTS.map((s) => (
            <TouchableOpacity key={s} style={[styles.chip, slot === s && styles.chipSelected]} onPress={() => setSlot(s)}>
              <Text style={[styles.chipText, slot === s && styles.chipTextSelected]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {canConfirm && <View style={{ height: 70 }} />}
      </ScrollView>

      {canConfirm && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleConfirm}>
            <Text style={styles.primaryButtonText}>Confirm Booking</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// PrintPanel — a numeric useState (`pages`) incremented/decremented with a
// stepper, plus a boolean useState (`color`) toggled between two chip
// buttons. `total` is a derived value recalculated on every render.
function PrintPanel({ onBack, logActivity }) {
  const [pages, setPages] = useState(1);
  const [color, setColor] = useState(false);

  const pricePerPage = color ? 100 : 20;
  const total = pages * pricePerPage;

  const handleSubmit = () => {
    logActivity(`Print job (${pages} page${pages > 1 ? 's' : ''}, ${color ? 'color' : 'B&W'})`, `Just now · ${naira(total)}`, 'print-outline');
    Alert.alert('Print job sent 🎉', `${pages} page(s) · ${color ? 'Color' : 'Black & White'} · ${naira(total)}\nCollect at the ICT center.`);
    setPages(1);
    setColor(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <PanelHeader title="Print & Copy" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Number of pages</Text>
        <View style={styles.stepperLarge}>
          {/* Using the FUNCTIONAL updater form setPages(p => ...) here instead
              of setPages(pages - 1) — this guarantees we're always working
              off the LATEST value of pages, which matters if multiple state
              updates could ever get batched together. */}
          <TouchableOpacity style={styles.stepperBtn} onPress={() => setPages((p) => Math.max(1, p - 1))}>
            <Ionicons name="remove" size={18} color="#0052cc" />
          </TouchableOpacity>
          <Text style={styles.stepperValueLarge}>{pages}</Text>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => setPages((p) => p + 1)}>
            <Ionicons name="add" size={18} color="#0052cc" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Print type</Text>
        <View style={styles.chipWrap}>
          <TouchableOpacity style={[styles.chip, !color && styles.chipSelected]} onPress={() => setColor(false)}>
            <Text style={[styles.chipText, !color && styles.chipTextSelected]}>Black & White · ₦20/pg</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, color && styles.chipSelected]} onPress={() => setColor(true)}>
            <Text style={[styles.chipText, color && styles.chipTextSelected]}>Color · ₦100/pg</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 70 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleSubmit}>
          <Text style={styles.primaryButtonText}>Send to Print · {naira(total)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// LaundryPanel — the simplest panel: one useState (`slot`) tracking which
// pickup time chip is selected.
function LaundryPanel({ onBack, logActivity }) {
  const [slot, setSlot] = useState(null);
  const FLAT_FEE = 500;

  const handleConfirm = () => {
    if (!slot) return;
    logActivity('Laundry pickup scheduled', `Just now · ${slot} · ${naira(FLAT_FEE)}`, 'shirt-outline');
    Alert.alert('Pickup scheduled 🎉', `${slot}\n${naira(FLAT_FEE)} flat fee`);
    setSlot(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <PanelHeader title="Laundry Pickup" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Choose a pickup slot</Text>
        <View style={styles.chipWrap}>
          {LAUNDRY_SLOTS.map((s) => (
            <TouchableOpacity key={s} style={[styles.chip, slot === s && styles.chipSelected]} onPress={() => setSlot(s)}>
              <Text style={[styles.chipText, slot === s && styles.chipTextSelected]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {slot && <View style={{ height: 70 }} />}
      </ScrollView>

      {slot && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleConfirm}>
            <Text style={styles.primaryButtonText}>Confirm Pickup · {naira(FLAT_FEE)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* --------------------------------- ACTIVITY --------------------------------- */

// ActivityTab has no state — it just reads the `activityLog` prop passed
// down from DashboardScreen (the SAME array HomeTab and the service panels
// all write into via logActivity) and renders every entry, newest first.
function ActivityTab({ activityLog }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.screenTitle}>Activity</Text>
      {activityLog.length === 0 ? (
        <Text style={styles.rideEta}>Nothing here yet — book a ride or order something to see it here.</Text>
      ) : (
        <View style={styles.tripList}>
          {activityLog.map((entry) => (
            <View key={entry.id} style={styles.tripRow}>
              <View style={styles.tripIconWrap}>
                <Ionicons name={entry.icon || 'time-outline'} size={18} color="#0052cc" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tripTitle}>{entry.title}</Text>
                <Text style={styles.tripSubtitle}>{entry.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/* --------------------------------- PROFILE --------------------------------- */

// ProfileTab is just a single card that, when tapped, calls onGoToProfile()
// — a callback prop that was originally created in App.js and passed all
// the way down through DashboardScreen to here. Tapping it changes App.js's
// `screen` state to 'profile', which is our top-level "navigation" again.
function ProfileTab({ onGoToProfile }) {
  return (
    <View style={styles.scrollContent}>
      <Text style={styles.screenTitle}>Profile</Text>
      <TouchableOpacity style={styles.serviceCard} activeOpacity={0.85} onPress={onGoToProfile}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rideLabel}>My Profile</Text>
          <Text style={styles.rideEta}>View and edit your details</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#ccc" />
      </TouchableOpacity>
    </View>
  );
}

/* ---------------------------------- STYLES ---------------------------------- */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fafafa' },
  body: { flex: 1, paddingTop: 56 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },

  screenTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 18 },
  greeting: { fontSize: 13, color: '#999', marginBottom: 4 },
  name: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 20 },

  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0052cc', alignItems: 'center', justifyContent: 'center', marginRight: 14 },

  promoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#003580', borderRadius: 16, padding: 18, marginBottom: 28 },
  promoTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  promoSubtitle: { color: '#b8bfc6', fontSize: 12 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 14, marginTop: 4 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
  quickCard: {
    width: '31%', backgroundColor: '#fff', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  quickIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#e8f0ff', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickLabel: { fontSize: 11.5, fontWeight: '600', color: '#1a1a1a', textAlign: 'center', paddingHorizontal: 4 },

  rideIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#e8f0ff', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rideLabel: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  rideEta: { fontSize: 12, color: '#999' },

  serviceCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 14, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },

  panelHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  panelHeaderTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },

  foodRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 10, paddingHorizontal: 4 },
  stepperBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', width: 20, textAlign: 'center' },

  stepperLarge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, alignSelf: 'flex-start',
    paddingHorizontal: 8, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  stepperValueLarge: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', width: 36, textAlign: 'center' },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
  chip: {
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginRight: 8, marginBottom: 8, backgroundColor: '#fff',
  },
  chipSelected: { borderColor: '#0052cc', backgroundColor: '#eff6ff' },
  chipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  chipTextSelected: { color: '#0052cc', fontWeight: '700' },

  tripList: { marginTop: 4 },
  tripRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tripIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#e8f0ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tripTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  tripSubtitle: { fontSize: 12, color: '#999' },

  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#eee',
  },
  primaryButton: { backgroundColor: '#0052cc', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee',
    paddingTop: 10, paddingBottom: 26,
  },
  tabButton: { flex: 1, alignItems: 'center' },
  tabLabel: { fontSize: 10.5, color: '#999', marginTop: 3, fontWeight: '500' },
  tabLabelActive: { color: '#0052cc', fontWeight: '700' },
});