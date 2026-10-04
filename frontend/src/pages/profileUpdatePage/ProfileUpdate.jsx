import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import styles from './ProfileUpdate.module.css';
import { apiClient } from '../../services/core/api.client.js';

const ProfileUpdate = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.put('/api/auth/password', {
        currentPassword,
        newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Password changed successfully.');
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
        err.response?.data?.msg ||
        'Unable to change your password. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>ACCOUNT SECURITY</p>
        <h1 className={styles.headerTitle}>Change password</h1>
        <p className={styles.headerSubtitle}>
          Verify your current password before choosing a new one.
        </p>
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
          <label className={styles.label} htmlFor="current-password">
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={styles.input}
            placeholder="Enter current password"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={styles.input}
            placeholder="At least 6 characters and 1 number"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="confirm-password">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.input}
            placeholder="Enter new password again"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitBtn}
        >
          <KeyRound size={16} />
          {loading ? 'Updating password...' : 'Update password'}
        </button>
      </form>

      <Link to="/profile" className={styles.backLink}>
        Back to account profile
      </Link>
    </div>
  );
};

export default ProfileUpdate;