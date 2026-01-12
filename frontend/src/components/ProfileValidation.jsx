import { useState, useEffect } from 'react';

export default function ProfileValidation({ formData, onValidationChange }) {
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.department?.trim()) {
      newErrors.department = 'Department is required';
    }

    // Phone validation
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number (10-15 digits)';
      }
    }

    // Date of birth validation
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (birthDate > today) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future';
      } else if (age < 16 || age > 100) {
        newErrors.date_of_birth = 'Age must be between 16 and 100 years';
      }
    }

    // Emergency contact validation
    if (formData.emergency_contact_name && !formData.emergency_contact_phone) {
      newErrors.emergency_contact_phone = 'Emergency contact phone is required when name is provided';
    }

    if (formData.emergency_contact_phone && formData.emergency_contact_phone.trim()) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
      if (!phoneRegex.test(formData.emergency_contact_phone.replace(/\s/g, ''))) {
        newErrors.emergency_contact_phone = 'Please enter a valid emergency contact phone number';
      }
    }

    setErrors(newErrors);
    const valid = Object.keys(newErrors).length === 0;
    setIsValid(valid);
    
    if (onValidationChange) {
      onValidationChange(valid, newErrors);
    }
  };

  const getFieldError = (fieldName) => {
    return errors[fieldName];
  };

  const hasError = (fieldName) => {
    return !!errors[fieldName];
  };

  const getFieldClassName = (fieldName, baseClassName) => {
    const hasErr = hasError(fieldName);
    return `${baseClassName} ${hasErr ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`;
  };

  return {
    errors,
    isValid,
    getFieldError,
    hasError,
    getFieldClassName
  };
}