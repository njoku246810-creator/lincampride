import React, { useState, useEffect } from 'react';

import SplashScreen from './components/Splashscreen';
import LoginScreen from './components/Loginscreen';
import SignupScreen from './components/signup';
import DashboardScreen from './components/Dashboardscreen';
import ProfileScreen from './components/Profilecard';
import { getCurrentUser, logoutUser } from './utils/authStore';

// ============================================================================
// App.js — the ROOT component of the whole app.
//
// KEY CONCEPT: We are NOT using a navigation library (like React Navigation)
// here. Instead, we do "state-based navigation": a single piece of state
// (`screen`) holds the NAME of the screen we want to show, and we use plain
// JavaScript `if` statements below to decide which component to render.
//
// This is conceptually the same idea as a Stack Navigator — only one
// "top" screen is visible at a time, and changing `screen` is like calling
// navigation.navigate('someScreen'). We just do it manually with useState
// instead of pulling in @react-navigation.
// ============================================================================

export default function App() {
  // --------------------------------------------------------------------
  // HOOK #1: useState
  // useState(initialValue) gives us:
  //   - a variable holding the current value (screen, currentUser)
  //   - a function to update that value (setScreen, setCurrentUser)
  // Whenever setScreen/setCurrentUser is called, React re-renders this
  // component (and re-runs the if-checks below) with the new value.
  //
  // `screen` acts like our "current route name" — it starts on the splash
  // screen, then becomes 'login', 'signup', 'dashboard', or 'profile'.
  // --------------------------------------------------------------------
  const [screen, setScreen] = useState('splash');
  const [currentUser, setCurrentUser] = useState(null);

  // --------------------------------------------------------------------
  // HOOK #2: useEffect
  // useEffect(callback, dependencyArray) runs `callback` AFTER the
  // component renders. The empty dependency array [] means "run this
  // effect only ONCE, right after the very first render" (similar to
  // componentDidMount in class components).
  //
  // Why we need it here: checking AsyncStorage for a saved session is
  // an async side-effect (it takes time and talks to storage outside of
  // React). We can't do that directly inside the render/body of the
  // component, so we do it inside useEffect instead.
  //
  // We wrap the async logic in an IIFE (immediately-invoked function
  // expression) `(async () => { ... })()` because the useEffect callback
  // itself is NOT allowed to be declared `async` directly.
  // --------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      const user = await getCurrentUser(); // reads saved session from AsyncStorage
      if (user) setCurrentUser(user); // if a session exists, restore it into state
    })();
  }, []); // <-- empty array = run once on mount only

  // Called by SplashScreen once its 2.5s timer finishes.
  // Decides where to send the user depending on whether a session was found.
  const handleSplashFinish = () => {
    setScreen(currentUser ? 'dashboard' : 'login');
  };

  // Shared success handler for both Login and Signup — once either succeeds
  // we have a `user` object, so we save it to state and move to dashboard.
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setScreen('dashboard');
  };

  const handleLogout = async () => {
    await logoutUser(); // clears the session from AsyncStorage
    setCurrentUser(null); // clears user from state
    setScreen('login'); // send back to login screen
  };

  // ------------------------------------------------------------------
  // CONDITIONAL RENDERING AS "NAVIGATION"
  // Each `if` below checks the current `screen` value and returns a
  // DIFFERENT component tree. Only one of these `if` blocks ever
  // executes and returns something on a given render — this is what
  // makes it feel like "switching screens", even without a navigation
  // library.
  //
  // Props being passed down (e.g. onLoginSuccess, onNavigateToSignup)
  // are functions — this is how CHILD screens can tell the PARENT
  // (App.js) to change the `screen` state. This is a common React
  // pattern called "lifting state up": the state lives in the parent,
  // and children are given callback functions to request changes to it.
  // ------------------------------------------------------------------

  if (screen === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (screen === 'login') {
    return (
      <LoginScreen
        onLoginSuccess={handleAuthSuccess}
        onNavigateToSignup={() => setScreen('signup')}
        onNavigateToForgotPassword={() => setScreen('forgotPassword')}
      />
    );
  }

  if (screen === 'signup') {
    return (
      <SignupScreen
        onSignupSuccess={handleAuthSuccess}
        onNavigateToLogin={() => setScreen('login')}
      />
    );
  }

  if (screen === 'dashboard') {
    return (
      <DashboardScreen
        user={currentUser}
        onGoToProfile={() => setScreen('profile')}
      />
    );
  }

  if (screen === 'profile') {
    return (
      <ProfileScreen
        user={currentUser}
        onBack={() => setScreen('dashboard')}
        onUserUpdate={(updatedUser) => setCurrentUser(updatedUser)}
        onLogout={handleLogout}
      />
    );
  }

  // Fallback — should never actually be hit since every screen value above
  // is accounted for, but React components must always return something.
  return null;
}