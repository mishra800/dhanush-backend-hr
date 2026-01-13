import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from '../components/notifications/Toast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children, position = 'top-right', maxToasts = 5 }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast,
    };

    setToasts((prev) => {
      const updated = [newToast, ...prev];
      // Limit the number of toasts
      return updated.slice(0, maxToasts);
    });

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((message, options = {}) => {
    return addToast({
      type: 'success',
      message,
      ...options,
    });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({
      type: 'error',
      message,
      duration: 7000, // Longer duration for errors
      ...options,
    });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({
      type: 'warning',
      message,
      ...options,
    });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({
      type: 'info',
      message,
      ...options,
    });
  }, [addToast]);

  const promise = useCallback(async (promiseOrFunction, options = {}) => {
    const {
      loading = 'Loading...',
      success: successMessage = 'Success!',
      error: errorMessage = 'Something went wrong',
    } = options;

    // Show loading toast
    const loadingToastId = addToast({
      type: 'info',
      message: loading,
      persistent: true,
    });

    try {
      const result = typeof promiseOrFunction === 'function' 
        ? await promiseOrFunction() 
        : await promiseOrFunction;

      // Remove loading toast
      removeToast(loadingToastId);

      // Show success toast
      success(typeof successMessage === 'function' ? successMessage(result) : successMessage);

      return result;
    } catch (err) {
      // Remove loading toast
      removeToast(loadingToastId);

      // Show error toast
      error(typeof errorMessage === 'function' ? errorMessage(err) : errorMessage);

      throw err;
    }
  }, [addToast, removeToast, success, error]);

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
    promise,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer 
        toasts={toasts} 
        onClose={removeToast} 
        position={position} 
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;