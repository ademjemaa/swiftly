import { createRef } from 'react';

// Create a navigation reference that can be used outside of React components
export const navigationRef = createRef();

// Navigate function that can be used outside of React components
export function navigate(name, params) {
  if (navigationRef.current && navigationRef.current.isReady()) {
    navigationRef.current.navigate(name, params);
  } else {
    // Log error if navigation is not possible
    console.error('Cannot navigate, navigation reference is not ready');
  }
}

// Reset navigation stack
export function resetRoot(name, params) {
  if (navigationRef.current && navigationRef.current.isReady()) {
    navigationRef.current.reset({
      index: 0,
      routes: [{ name, params }],
    });
  } else {
    console.error('Cannot reset navigation, navigation reference is not ready');
  }
} 