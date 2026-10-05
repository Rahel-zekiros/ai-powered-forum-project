import { Link } from "react-router-dom";
import { KeyRound, Mail, UserRound } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import styles from "./AccountProfile.module.css";

export default function AccountProfile() {
    const { currentUser } = useAuth();
    const firstName = currentUser?.firstName || currentUser?.first_name || "";
    const lastName = currentUser?.lastName || currentUser?.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();

    return (
        <main className={styles.page}>
            <section className={styles.card} aria-labelledby="account-profile-title">
                <header className={styles.header}>
                    <span className={styles.eyebrow}>ACCOUNT</span>
                    <h1 className={styles.title} id="account-profile-title">
                        Account profile
                    </h1>
                    <p className={styles.description}>
                        Your name and email address are managed with your account.
                    </p>
                </header>

                <dl className={styles.details}>
                    <div className={styles.detailRow}>
                        <dt className={styles.label}>
                            <UserRound size={16} aria-hidden="true" />
                            Full name
                        </dt>
                        <dd className={styles.value}>{fullName || "Not provided"}</dd>
                    </div>
                    <div className={styles.detailRow}>
                        <dt className={styles.label}>
                            <Mail size={16} aria-hidden="true" />
                            Email
                        </dt>
                        <dd className={styles.value}>{currentUser?.email || "Not provided"}</dd>
                    </div>
                </dl>

                <Link to="/profile/update" className={styles.passwordLink}>
                    <KeyRound size={16} aria-hidden="true" />
                    Change password
                </Link>
            </section>
        </main>
    );
}
