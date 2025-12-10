import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiMail, HiLockClosed, HiUser, HiCheckCircle, HiXCircle, HiExclamationCircle } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../common';

const PasswordStrengthIndicator = ({ password }) => {
  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    return score;
  }, [password]);

  const getStrengthLabel = () => {
    if (strength <= 2) return { text: 'Weak', color: 'bg-red-500' };
    if (strength <= 4) return { text: 'Medium', color: 'bg-yellow-500' };
    return { text: 'Strong', color: 'bg-green-500' };
  };

  const { text, color } = getStrengthLabel();

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= strength ? color : 'bg-gray-200 dark:bg-dark-600'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${strength <= 2 ? 'text-red-500' : strength <= 4 ? 'text-yellow-600' : 'text-green-500'}`}>
        Password strength: {text}
      </p>
    </div>
  );
};

const PasswordRequirements = ({ password }) => {
  const requirements = [
    { label: 'At least 6 characters', met: password.length >= 6 },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains a number', met: /\d/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      {requirements.map((req, idx) => (
        <div key={idx} className="flex items-center gap-2 text-xs">
          {req.met ? (
            <HiCheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <HiXCircle className="h-4 w-4 text-gray-300 dark:text-gray-600" />
          )}
          <span className={req.met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
            {req.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export const RegisterForm = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    // Clear API error when user starts typing
    if (apiError) {
      setApiError('');
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const newErrors = { ...errors };

    if (name === 'firstName') {
      if (!value.trim()) {
        newErrors.firstName = 'First name is required';
      } else if (value.trim().length < 2) {
        newErrors.firstName = 'First name must be at least 2 characters';
      } else if (!/^[a-zA-Z\s]+$/.test(value)) {
        newErrors.firstName = 'First name can only contain letters';
      } else {
        delete newErrors.firstName;
      }
    }

    if (name === 'lastName') {
      if (!value.trim()) {
        newErrors.lastName = 'Last name is required';
      } else if (value.trim().length < 2) {
        newErrors.lastName = 'Last name must be at least 2 characters';
      } else if (!/^[a-zA-Z\s]+$/.test(value)) {
        newErrors.lastName = 'Last name can only contain letters';
      } else {
        delete newErrors.lastName;
      }
    }

    if (name === 'email') {
      if (!value) {
        newErrors.email = 'Email address is required';
      } else if (!value.includes('@')) {
        newErrors.email = 'Please include "@" in the email address';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors.email = 'Please enter a valid email address (e.g., user@example.com)';
      } else {
        delete newErrors.email;
      }
    }

    if (name === 'password') {
      if (!value) {
        newErrors.password = 'Password is required';
      } else if (value.length < 6) {
        newErrors.password = 'Password must be at least 6 characters long';
      } else if (!/(?=.*[a-z])/.test(value)) {
        newErrors.password = 'Password must contain at least one lowercase letter';
      } else if (!/(?=.*[A-Z])/.test(value)) {
        newErrors.password = 'Password must contain at least one uppercase letter';
      } else if (!/(?=.*\d)/.test(value)) {
        newErrors.password = 'Password must contain at least one number';
      } else {
        delete newErrors.password;
      }
    }

    if (name === 'confirmPassword') {
      if (!value) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== value) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setErrors(newErrors);
  };

  const validate = () => {
    const newErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName)) {
      newErrors.firstName = 'First name can only contain letters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName)) {
      newErrors.lastName = 'Last name can only contain letters';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Please include "@" in the email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address (e.g., user@example.com)';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');
    const result = await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
    });
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      // Show API error message
      setApiError(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 py-12 px-4 transition-colors">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <svg className="w-10 h-10 text-white" viewBox="0 0 100 100">
              <rect x="25" y="30" width="50" height="10" rx="2" fill="currentColor"/>
              <rect x="25" y="45" width="35" height="10" rx="2" fill="currentColor"/>
              <rect x="25" y="60" width="45" height="10" rx="2" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create account</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Get started with ProjectFlow today</p>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8">
          {/* API Error Message */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <HiExclamationCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-400">{apiError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="John"
                icon={HiUser}
                error={errors.firstName}
              />
              <Input
                label="Last name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Doe"
                error={errors.lastName}
              />
            </div>

            <Input
              label="Email address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="you@example.com"
              icon={HiMail}
              error={errors.email}
            />

            <div>
              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Create a password"
                icon={HiLockClosed}
                error={errors.password}
              />
              <PasswordStrengthIndicator password={formData.password} />
              <PasswordRequirements password={formData.password} />
            </div>

            <Input
              label="Confirm password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Confirm your password"
              icon={HiLockClosed}
              error={errors.confirmPassword}
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full py-3"
            >
              Create account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
