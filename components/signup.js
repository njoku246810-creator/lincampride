import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { registerUser } from '../utils/authStore';

// ============================================================================
// SignupScreen.js
//
// Same core ideas as LoginScreen.js, but with MORE fields and a validation
// rule that depends on TWO fields at once (confirmPassword must equal
// password) — a good example to bring up when explaining validate().
// ============================================================================

export default function SignupScreen({ onSignupSuccess, onNavigateToLogin }) {
  // Four separate controlled-input states, plus two "show password" toggles,
  // a submitting flag, and an errors object with one key per field —
  // structurally identical to what the lecture calls the "errors state object".
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // ----------------------------------------------------------------
  // validate() — checks every field and builds ONE fresh errors object,
  // just like the lecture's multi-field validate(). The final check,
  // `!Object.values(newErrors).some((err) => err !== '')`, is the same
  // "is the errors object empty?" idea the lecture teaches with
  // Object.keys(newErrors).length === 0 — just written using .some()
  // over the VALUES instead of counting the KEYS. Both answer the same
  // question: "did any field fail?"
  // ----------------------------------------------------------------
  const validate = () => {
    const newErrors = {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    };
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailPattern.test(email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Cross-field validation: this rule needs to compare TWO different
    // pieces of state (confirmPassword and password) against each other.
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((err) => err !== '');
  };

  // Guard clause pattern again: stop immediately if validate() fails.
  const handleSignup = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const user = await registerUser({ fullName, email, password });
      // user now contains the real account: fullName, email, phone, matricNumber, hostelRoom
      onSignupSuccess(user);
    } catch (err) {
      // Most likely cause: email already registered.
      // We reuse the existing errors object with the spread operator (...prev)
      // so we don't wipe out any other error messages that might be showing.
      setErrors((prev) => ({ ...prev, email: err.message || 'Could not create account' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = () => {
    onNavigateToLogin();
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <Image
          source={require('../assets/lincamp.jpg')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="John Doe"
        placeholderTextColor="#999"
        value={fullName}
        onChangeText={(text) => {
          setFullName(text);
          if (errors.fullName) setErrors({ ...errors, fullName: '' }); // clear-on-type
        }}
      />
      {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor="#999"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (errors.email) setErrors({ ...errors, email: '' });
        }}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordRow}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Enter your password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (errors.password) setErrors({ ...errors, password: '' });
          }}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.toggleText}>
            {showPassword ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>
      {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

      <Text style={styles.label}>Confirm Password</Text>
      <View style={styles.passwordRow}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm your password"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
          }}
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Text style={styles.toggleText}>
            {showConfirmPassword ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>
      {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>{isSubmitting ? 'Creating account...' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleLogin}>
        <Text style={styles.secondaryButtonText}>Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoImage: {
    width: 180,
    height: 180,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    marginBottom: 32,
  },
  label: {
    fontSize: 13,
    color: '#333',
    marginBottom: 6,
    marginTop: 4,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 4,
    color: '#1a1a1a',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a1a',
  },
  toggleText: {
    color: '#0e9d5a',
    fontWeight: '600',
    fontSize: 13,
  },
  errorText: {
    color: '#e0453c',
    fontSize: 12,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#0e9d5a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0e9d5a',
  },
  secondaryButtonText: {
    color: '#0e9d5a',
    fontSize: 16,
    fontWeight: '500',
  },
});