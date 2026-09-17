import React, { useState } from 'react';
import styles from './ProfileUpdate.module.css';
import { apiClient } from '../../services/core/api.client.js'; 
import { useAuth } from '../../contexts/AuthContext.jsx'; 

const ProfileUpdate = () => {
  const { currentUser, updateUserProfile } = useAuth();

  const [firstName, setFirstName] = useState(currentUser?.first_name || '');
  const [lastName, setLastName] = useState(currentUser?.last_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
     await  apiClient .put('/api/users/profile', {
        first_name: firstName,
        last_name: lastName,
        email: email
      });

      updateUserProfile({ 
        first_name: firstName, 
        last_name: lastName,
        email: email 
      });

      setSuccessMessage('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMessage(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>Account Settings</h2>
        <p className={styles.headerSubtitle}>Update your personal information below.</p>
      </div>

      {successMessage && (
        <div className={styles.successBox}>
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className={styles.errorBox}>
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={styles.input}
            placeholder="Enter your first name"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={styles.input}
            placeholder="Enter your last name"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder="Enter your email"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitBtn}
        >
          {loading ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default ProfileUpdate;