import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';

// ============================================================================
// SplashScreen.js
// Shows the app logo for 2.5 seconds, then calls onFinish() so App.js can
// decide whether to go to 'login' or 'dashboard'.
// ============================================================================

export default function SplashScreen({ onFinish }) {

  // --------------------------------------------------------------------
  // HOOK: useRef
  // useRef(initialValue) creates a "box" (`onFinishRef`) that holds a
  // mutable value across re-renders WITHOUT causing a re-render when it
  // changes (unlike useState). We access/update the value via `.current`.
  //
  // Why we need it here: our useEffect below only runs ONCE on mount
  // (empty dependency array). But `onFinish` is a prop passed down from
  // App.js, and if App.js ever re-renders and passes a NEW function
  // reference for onFinish, our one-time effect would still be holding
  // onto the OLD version of that function (a "stale closure").
  //
  // By storing the latest `onFinish` inside a ref and updating
  // `onFinishRef.current` on every render, the setTimeout inside
  // useEffect can call `onFinishRef.current()` and always get the most
  // up-to-date function, even though the effect itself only runs once.
  // --------------------------------------------------------------------
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish; // keep the ref updated on every render

  // --------------------------------------------------------------------
  // HOOK: useEffect
  // Empty dependency array [] = run once when the component first mounts.
  //
  // setTimeout(fn, 2500) schedules fn to run once, 2.5 seconds later.
  // We store the timer ID so we can cancel it in the CLEANUP function.
  //
  // The function returned from useEffect (`return () => clearTimeout(timer)`)
  // is the CLEANUP function. React calls it automatically if the component
  // unmounts before the effect's job is done — this prevents calling
  // onFinish() on a screen that's no longer on the page (which would
  // otherwise cause a "state update on unmounted component" warning/bug).
  // --------------------------------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinishRef.current();
    }, 2500);

    return () => clearTimeout(timer); // cleanup: cancel timer if unmounted early
  }, []); // run once, on mount only

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b3d2e" />
      <Image
        source={require('../assets/lincamp-logo-transparent.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b3d2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 260,
    height: 260,
  },
});