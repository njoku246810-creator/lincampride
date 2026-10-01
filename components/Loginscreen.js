import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { loginUser } from '../utils/authStore';

// ============================================================================
// LoginScreen.js
//
// This screen demonstrates two of the lecture's core topics:
//   1. CONTROLLED INPUTS — every TextInput's value is driven by state
//      (value={email}) and updated via onChangeText, NOT by reading
//      event.target.value like on the web (React Native has no DOM event).
//   2. VALIDATE-ON-SUBMIT — like the lecture's guard-clause pattern,
//      validation only runs when the user presses "Log In", not on every
//      keystroke, so nothing flickers red while the user is still typing.
//
// NOTE: Unlike the lecture's example (one single `form` state object with
// computed property names), this screen uses a SEPARATE useState for each
// field. That works fine for a small 2-field form like this; the lecture's
// single-object approach becomes more useful once you have many fields
// (see Profilecard.js and signup.js, which are closer to that shape).
// ============================================================================

export default function LoginScreen({ onLoginSuccess, onNavigateToSignup, onNavigateToForgotPassword }) {
  // --------------------------------------------------------------------
  // HOOK: useState — one call per piece of state we need to track.
  // email/password: the CONTROLLED VALUES of the two text inputs.
  // showPassword: toggles whether the password is masked or plain text.
  // isSubmitting: disables the button + shows a loading label mid-request.
  // errors: an object holding a message per field, e.g. { email: '', password: '' }.
  // --------------------------------------------------------------------
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  // ----------------------------------------------------------------
  // validate() — pure-ish function: reads current state (email,
  // password) and returns a fresh errors object, exactly like the
  // lecture's pattern. It NEVER mutates the existing `errors` state
  // directly — it always builds a brand-new object and calls
  // setErrors(newErrors). Mutating state directly is one of the
  // lecture's "common mistakes to watch for".
  //
  // Object.keys(newErrors).length check isn't used here; instead we
  // directly check the two fields, but the idea is identical to the
  // lecture: "no error strings set" = valid form.
  // ----------------------------------------------------------------
  const validate = () => {
    const newErrors = { email: '', password: '' };
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // same shape of regex taught in lecture

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

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password; // true only if BOTH are empty strings
  };

  // ----------------------------------------------------------------
  // handleLogin — the GUARD CLAUSE pattern from the lecture:
  // "if (!validate()) return;" stops immediately if validation fails,
  // so nothing below it (the actual login attempt) ever runs.
  // ----------------------------------------------------------------
  const handleLogin = async () => {
    if (!validate()) return; // guard clause — stop here if invalid

    setIsSubmitting(true);
    try {
      const user = await loginUser(email, password); // async call to our auth store
      if (!user) {
        setErrors({ email: '', password: 'Incorrect email or password' });
        return;
      }
      // user contains the real account: fullName, email, phone, matricNumber, hostelRoom
      onLoginSuccess(user); // tells App.js "login worked, here's the user" (lifting state up)
    } finally {
      // finally always runs, whether login succeeded, failed, or returned early above —
      // guarantees the button never gets stuck saying "Logging in..." forever.
      setIsSubmitting(false);
    }
  };

  const handleSignUp = () => {
    onNavigateToSignup(); // calls back up to App.js to change `screen` to 'signup'
  };

  const handleForgotPassword = () => {
    onNavigateToForgotPassword();
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

      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Log in to continue</Text>

      <Text style={styles.label}>Email</Text>
      {/*
        CONTROLLED INPUT:
        value={email}         -> the input always SHOWS what's in state
        onChangeText={...}    -> every keystroke updates state via setEmail
        This is the two-way binding pattern taught in the Controlled Inputs
        lecture. Note: onChangeText gives the raw string directly — there is
        no event.target.value in React Native.
      */}
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor="#999"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          // clear-error-on-typing pattern from the lecture: as soon as the
          // user edits this field again, remove its old error message.
          if (errors.email) setErrors({ ...errors, email: '' });
        }}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {/* Conditional rendering: only show the error <Text> if errors.email is truthy */}
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
          secureTextEntry={!showPassword} // masks the password unless "Show" is tapped
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.toggleText}>
            {showPassword ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>
      {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

      <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotWrapper}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>{isSubmitting ? 'Logging in...' : 'Log In'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleSignUp}>
        <Text style={styles.secondaryButtonText}>Sign Up</Text>
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
  errorText: {
    color: '#e0453c',
    fontSize: 12,
    marginBottom: 8,
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
  forgotWrapper: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#0e9d5a',
    fontSize: 13,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#0e9d5a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
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