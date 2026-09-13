import { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Code, ArrowRight, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Auth.module.css';

const COMMUNITY_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
];

const validateAuthInput = ({ isSignInMode, email, password, firstName, lastName }) => {
    const cleanEmail = email.trim().toLowerCase();
    const validEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail || !validEmailRegex.test(cleanEmail)) {
        return 'Please enter a valid email address.';
    }

    if (!password.trim()) {
        return 'Password cannot be empty.';
    }

    if (!isSignInMode) {
        const isInvalidName = name => !name.trim() || name.trim().length < 2;

        if (isInvalidName(firstName)) {
            return 'First name must be at least 2 characters long.';
        }
        if (isInvalidName(lastName)) {
            return 'Last name must be at least 2 characters long.';
        }
        if (password.length < 6 || !/\d/.test(password)) {
            return 'Password must be 6+ characters and include a number.';
        }
    }

    return null;
};

export default function Auth() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signup, signin, authError, clearAuthError } = useAuth();

    const [isSignInMode, setIsSignInMode] = useState(true);
    const [fnameInput, setFnameInput] = useState('');
    const [lnameInput, setLnameInput] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [passInput, setPassInput] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isPassVisible, setIsPassVisible] = useState(false);

    const [localError, setLocalError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authSuccessNotice, setAuthSuccessNotice] = useState(null);

    useEffect(() => {
        const savedEmail = localStorage.getItem('remembered_email');
        if (savedEmail) {
            setEmailInput(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const toggleAuthMode = () => {
        setIsSignInMode(prev => !prev);
        setLocalError(null);
        setAuthSuccessNotice(null);
        clearAuthError();
    };

    const handleAuthSubmit = async e => {
        e.preventDefault();
        setLocalError(null);
        setAuthSuccessNotice(null);
        clearAuthError();

        const cleanEmail = emailInput.trim().toLowerCase();

        const validationError = validateAuthInput({
            isSignInMode,
            email: cleanEmail,
            password: passInput,
            firstName: fnameInput,
            lastName: lnameInput,
        });

        if (validationError) {
            setLocalError(validationError);
            return;
        }

        setIsSubmitting(true);

        if (rememberMe) {
            localStorage.setItem('remembered_email', cleanEmail);
        } else {
            localStorage.removeItem('remembered_email');
        }

        try {
            if (isSignInMode) {
                const response = await signin({ email: cleanEmail, password: passInput });
                if (response?.success) {
                    setAuthSuccessNotice('Sign-in successful. Redirecting...');
                    setPassInput('');

                    await new Promise(res => setTimeout(res, 800));
                    const targetPath = location.state?.from?.pathname || '/dashboard';
                    navigate(targetPath, { replace: true });
                }
            } else {
                const response = await signup({
                    firstName: fnameInput.trim(),
                    lastName: lnameInput.trim(),
                    email: cleanEmail,
                    password: passInput,
                });

                if (response?.success) {
                    setAuthSuccessNotice('Account created successfully! Switching to sign in...');
                    setFnameInput('');
                    setLnameInput('');

                    setTimeout(() => {
                        setIsSignInMode(true);
                        setAuthSuccessNotice(null);
                    }, 1500);
                }
            }
        } catch (err) {
            setLocalError(err.message || 'An error occurred during authentication.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayedError = localError || authError;

    return (
        <div className={styles.authContainer}>
            <section className={styles.infoPanel}>
                <div className={styles.infoContentWrapper}>
                    <header className={styles.infoHeaderBlock}>
                        <div
                            className={styles.brandWrapper}
                            onClick={() => navigate('/')}
                            title='Go to Home'
                            role='button'
                            tabIndex={0}
                        >
                            <div className={styles.brandLogoBox} aria-hidden>
                                <MessageSquare className={styles.brandLogoIcon} size={22} />
                            </div>
                            <div className={styles.brandTextGroup}>
                                <p className={styles.brandTitle}>Evangadi Forum</p>
                                <p className={styles.brandTagline}>Learn together. Ask with context.</p>
                            </div>
                        </div>
                        <p className={styles.infoDescriptionText}>
                            Sign in to post technical questions, follow threads, and search the forum with both keyword and AI similarity modes.
                        </p>
                    </header>

                    <div className={styles.featureList}>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIconBox}><Sparkles size={20} /></div>
                            <div className={styles.featureBody}>
                                <h3 className={styles.featureHeading}>Visible reasoning</h3>
                                <p className={styles.featureText}>
                                    Threads stay readable: markdown, code blocks, and replies build a knowledge base.
                                </p>
                            </div>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIconBox}><Code size={20} /></div>
                            <div className={styles.featureBody}>
                                <h3 className={styles.featureHeading}>Low-friction workflow</h3>
                                <p className={styles.featureText}>
                                    One clean layout for asking, answering, and scanning search results.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.infoFooterSection}>
                        <div className={styles.infoFooterContent}>
                            <div className={styles.avatarGroup}>
                                {COMMUNITY_AVATARS.map((url, i) => (
                                    <img
                                        key={i}
                                        src={url}
                                        className={styles.avatarImage}
                                        alt={`Community member ${i + 1}`}
                                    />
                                ))}
                            </div>
                            <span className={styles.communityBadge}>
                                Evangadi cohorts · weekly stand-ups · peer review
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.formAreaSection}>
                <div className={styles.formCardContainer}>
                    <AnimatePresence mode='wait'>
                        <Motion.div
                            key={isSignInMode ? 'signin' : 'signup'}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className={styles.formHeadingBlock}>
                                <h2 className={styles.formTitleText}>
                                    {isSignInMode ? 'Sign in to your account' : 'Create an account'}
                                </h2>
                                <p className={styles.formSubtitleText}>
                                    {isSignInMode
                                        ? 'Enter your credentials to access the forum.'
                                        : 'Fill in your details below to get started.'}
                                </p>
                            </div>

                            <form className={styles.entryForm} onSubmit={handleAuthSubmit}>
                                {!isSignInMode && (
                                    <>
                                        <div className={styles.fieldGroup}>
                                            <label htmlFor='fname' className={styles.fieldLabel}>First Name</label>
                                            <input
                                                id='fname'
                                                type='text'
                                                placeholder='First name'
                                                className={styles.textInput}
                                                value={fnameInput}
                                                onChange={e => setFnameInput(e.target.value)}
                                            />
                                        </div>

                                        <div className={styles.fieldGroup}>
                                            <label htmlFor='lname' className={styles.fieldLabel}>Last Name</label>
                                            <input
                                                id='lname'
                                                type='text'
                                                placeholder='Last name'
                                                className={styles.textInput}
                                                value={lnameInput}
                                                onChange={e => setLnameInput(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className={styles.fieldGroup}>
                                    <label htmlFor='email' className={styles.fieldLabel}>Email Address</label>
                                    <input
                                        id='email'
                                        type='email'
                                        placeholder='Enter your email address'
                                        className={styles.textInput}
                                        value={emailInput}
                                        onChange={e => setEmailInput(e.target.value)}
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label htmlFor='pass' className={styles.fieldLabel}>Password</label>
                                    <div className={styles.passwordInputWrapper}>
                                        <input
                                            id='pass'
                                            type={isPassVisible ? 'text' : 'password'}
                                            placeholder='••••••••'
                                            className={`${styles.textInput} ${styles.passwordField}`}
                                            value={passInput}
                                            onChange={e => setPassInput(e.target.value)}
                                        />
                                        <button
                                            type='button'
                                            className={styles.toggleEyeButton}
                                            onClick={() => setIsPassVisible(!isPassVisible)}
                                            aria-label={isPassVisible ? 'Hide password' : 'Show password'}
                                        >
                                            {isPassVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {isSignInMode && (
                                    <div className={styles.rememberOptionGroup}>
                                        <label className={styles.rememberLabel}>
                                            <input
                                                type='checkbox'
                                                checked={rememberMe}
                                                onChange={e => setRememberMe(e.target.checked)}
                                            />
                                            <span>Remember email</span>
                                        </label>
                                    </div>
                                )}

                                {authSuccessNotice && <div className={styles.successNotification}>{authSuccessNotice}</div>}
                                {displayedError && <div className={styles.errorNotification}>{displayedError}</div>}

                                <div className={styles.submitActionContainer}>
                                    <button
                                        type='submit'
                                        className={styles.primaryActionButton}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Processing...' : isSignInMode ? 'Sign In' : 'Create Account'}
                                        {!isSubmitting && <ArrowRight size={16} className={styles.actionIcon} />}
                                    </button>
                                </div>
                            </form>

                            <footer className={styles.cardFooterBlock}>
                                <p className={styles.footerPromptText}>
                                    {isSignInMode ? "Don't have an account?" : 'Already have an account?'}
                                    <button
                                        type='button'
                                        onClick={toggleAuthMode}
                                        className={styles.switchModeBtn}
                                    >
                                        {isSignInMode ? 'Create an account' : 'Back to sign in'}
                                    </button>
                                </p>
                            </footer>
                        </Motion.div>
                    </AnimatePresence>
                </div>
            </section>
        </div>
    );
}