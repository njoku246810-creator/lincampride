import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateUser } from '../utils/authStore';

// Small helper function — not a hook, just a plain JS utility that turns a
// full name like "Chinedu Okafor" into initials "CO" for the avatar circle.
function getInitials(name) {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  const initials = parts.slice(0, 2).map((p) => p[0].toUpperCase());
  return initials.join('');
}

const EMPTY_USER = {
  fullName: '',
  email: '',
  phone: '',
  matricNumber: '',
  hostelRoom: '',
};

// ============================================================================
// ProfileScreen.js (file name Profilecard.js)
//
// THIS is the screen that most closely matches the lecture's "single form
// state object" pattern: instead of five separate useState calls (one per
// field), the whole editable profile is ONE object (`draft`), and a single
// `updateField(field, value)` function updates any field by name using
// computed property syntax — exactly the handleChange() pattern taught in
// the Controlled Inputs lecture.
// ============================================================================

export default function ProfileScreen({ user, onBack, onUserUpdate, onLogout }) {
  // Falls back to blank fields if somehow no user is passed in (shouldn't
  // normally happen once signup/login are wired through App.js).
  const savedProfile = user || EMPTY_USER;

  // --------------------------------------------------------------------
  // HOOK: useState
  // `draft` = a WORKING COPY of the profile the user is currently editing.
  // We keep `savedProfile` (the real saved data) separate from `draft` (the
  // in-progress edits) so that pressing "Cancel" can just throw the draft
  // away and revert to what's actually saved, without losing the original.
  // --------------------------------------------------------------------
  const [draft, setDraft] = useState(savedProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // validate() checks the draft object's fields, same pattern as the other
  // screens: build a fresh `newErrors` object, never mutate the old one.
  const validate = () => {
    const newErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[+\d][\d\s]{6,}$/;

    if (!draft.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!draft.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailPattern.test(draft.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }
    if (draft.phone.trim() && !phonePattern.test(draft.phone.trim())) {
      newErrors.phone = 'Enter a valid phone number';
    }

    setErrors(newErrors);
    // Object.keys(newErrors).length === 0 -- this is EXACTLY the check
    // taught in the lecture: "an empty errors object means the form is valid".
    return Object.keys(newErrors).length === 0;
  };

  // One button does double duty: "Edit" when viewing, "Save" when editing.
  const handleEditToggle = async () => {
    if (!isEditing) {
      // Entering edit mode: reset the draft to match what's actually saved,
      // and clear any leftover error messages from a previous attempt.
      setDraft(savedProfile);
      setErrors({});
      setIsEditing(true);
      return;
    }

    // We were already editing and the button now means "Save" —
    // guard clause: don't attempt to save if validation fails.
    if (!validate()) return;

    setIsSaving(true);
    try {
      const updated = await updateUser(savedProfile.email, draft);
      if (onUserUpdate) onUserUpdate(updated); // tell App.js about the new profile
      setIsEditing(false);
      Alert.alert('Profile updated', 'Your changes have been saved.');
    } catch (err) {
      Alert.alert('Could not save', err.message || 'Something went wrong.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(savedProfile); // throw away unsaved edits
    setErrors({});
    setIsEditing(false);
  };

  // ----------------------------------------------------------------
  // updateField(field, value) — THE key pattern from the lecture.
  // Instead of five separate setters (setFullName, setEmail, setPhone...),
  // ONE function updates any field of the `draft` object by NAME, using
  // ES6 "computed property name" syntax: { ...prev, [field]: value }.
  //
  // The spread (...prev) is critical — without it, updating one field
  // would wipe out all the OTHER fields in the object. This is called out
  // in the lecture as the #1 most common bug students introduce.
  // ----------------------------------------------------------------
  const updateField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    // clear-error-on-typing, same idea as Login/Signup but generalized to
    // work for ANY field name instead of being hardcoded per field.
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          if (onLogout) onLogout();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <TouchableOpacity onPress={onBack} hitSlop={10} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#0e9d5a" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleEditToggle} hitSlop={10} disabled={isSaving}>
            <Text style={styles.editText}>
              {isSaving ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(savedProfile.fullName)}</Text>
          </View>
          <Text style={styles.title}>
            {isEditing ? 'Edit Profile' : savedProfile.fullName || 'Your Profile'}
          </Text>
          {!isEditing && !!savedProfile.matricNumber && (
            <Text style={styles.subtitle}>{savedProfile.matricNumber}</Text>
          )}
        </View>

        {/*
          Each ProfileField below is a controlled input whose value comes
          from `draft` (while editing) or `savedProfile` (while just
          viewing), and whose onChangeText calls updateField('fieldName', ...)
          — the SAME updateField function is reused for every single field.
        */}
        <ProfileField
          label="Full Name"
          value={isEditing ? draft.fullName : savedProfile.fullName}
          editable={isEditing}
          onChangeText={(text) => updateField('fullName', text)}
          error={errors.fullName}
          placeholder="John Doe"
        />

        <ProfileField
          label="Email"
          value={isEditing ? draft.email : savedProfile.email}
          editable={isEditing}
          onChangeText={(text) => updateField('email', text)}
          error={errors.email}
          placeholder="you@lincoln.edu.ng"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <ProfileField
          label="Phone Number"
          value={isEditing ? draft.phone : savedProfile.phone}
          editable={isEditing}
          onChangeText={(text) => updateField('phone', text)}
          error={errors.phone}
          placeholder="+234 800 000 0000"
          keyboardType="phone-pad"
        />

        <ProfileField
          label="Matric Number"
          value={isEditing ? draft.matricNumber : savedProfile.matricNumber}
          editable={isEditing}
          onChangeText={(text) => updateField('matricNumber', text)}
          placeholder="LCSMT/2023/0000"
          autoCapitalize="characters"
        />

        <ProfileField
          label="Hostel / Room"
          value={isEditing ? draft.hostelRoom : savedProfile.hostelRoom}
          editable={isEditing}
          onChangeText={(text) => updateField('hostelRoom', text)}
          placeholder="Hostel A - Room 101"
          isLast
        />

        {isEditing ? (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={isSaving}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={18} color="#e0453c" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// A small reusable presentational component: shows either a read-only
// <Text> (view mode) or an editable <TextInput> (edit mode), depending on
// the `editable` prop passed down from the parent. This is plain prop-driven
// UI, no hooks of its own.
function ProfileField({ label, value, editable, onChangeText, error, placeholder, isLast, ...rest }) {
  return (
    <View style={[styles.field, isLast && { borderBottomWidth: 0, marginBottom: 28 }]}>
      <Text style={styles.label}>{label}</Text>
      {editable ? (
        <>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#bbb"
            {...rest}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </>
      ) : (
        <Text style={styles.value}>{value || '—'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 48,
    backgroundColor: '#fff',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#0e9d5a',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 4,
  },
  editText: {
    color: '#0e9d5a',
    fontSize: 15,
    fontWeight: '700',
  },

  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 12,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#0e9d5a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },

  field: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  input: {
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 4,
  },
  inputError: {
    color: '#e0453c',
  },
  errorText: {
    color: '#e0453c',
    fontSize: 12,
    marginTop: 4,
  },

  cancelButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#777',
    fontSize: 15,
    fontWeight: '600',
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e0453c',
    marginTop: 8,
  },
  logoutText: {
    color: '#e0453c',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});