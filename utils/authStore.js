import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = '@campus_users';
const SESSION_KEY = '@campus_session_email';

async function getAllUsers() {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveAllUsers(users) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/**
 * Registers a new account. Throws if the email is already taken.
 * NOTE: password is stored in plain text — this is a local demo store only.
 * Swap this whole file for real API calls to your Laravel backend when ready.
 */
export async function registerUser({ fullName, email, password }) {
  const users = await getAllUsers();
  const exists = users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (exists) {
    throw new Error('An account with this email already exists');
  }

  const newUser = {
    fullName: fullName.trim(),
    email: email.trim(),
    password,
    phone: '',
    matricNumber: '',
    hostelRoom: '',
  };

  users.push(newUser);
  await saveAllUsers(users);
  await AsyncStorage.setItem(SESSION_KEY, newUser.email);
  return newUser;
}

/**
 * Validates credentials against stored users. Returns the user object on
 * success, or null if the email/password combination doesn't match.
 */
export async function loginUser(email, password) {
  const users = await getAllUsers();
  const match = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
  );
  if (!match) return null;

  await AsyncStorage.setItem(SESSION_KEY, match.email);
  return match;
}

/** Returns the currently logged-in user (if any), for auto-login on app start. */
export async function getCurrentUser() {
  const email = await AsyncStorage.getItem(SESSION_KEY);
  if (!email) return null;
  const users = await getAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/** Saves profile edits (name, phone, matric number, hostel/room, etc.) */
export async function updateUser(email, updates) {
  const users = await getAllUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) throw new Error('User not found');

  users[idx] = { ...users[idx], ...updates };
  await saveAllUsers(users);
  return users[idx];
}

export async function logoutUser() {
  await AsyncStorage.removeItem(SESSION_KEY);
}