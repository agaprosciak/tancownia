import { Link } from 'react-router-dom';
import logotyp from '../assets/logotyp.svg'; 
import logoNazwa from '../assets/logonazwa.svg'; 

const Footer = () => {
    return (
        <footer style={styles.footer}>
            <div style={styles.container}>
                
                {/* SEKCJA LEWA: Logotyp + Nazwa, Kontakt */}
                <div style={styles.brandSection}>
                    <div style={styles.logoRow}>
                        <img src={logotyp} alt="Logo" style={styles.logoIcon} />
                        <img src={logoNazwa} alt="DanceApp" style={styles.logoText} />
                    </div>
                    <p style={styles.tagline}>
                        Platforma do wyszukiwania szkół tańca i zajęć w całej Polsce.
                    </p>
                    <a href="mailto:kontakt@tancownia.pl" style={styles.authorEmail}>
                        kontakt@tancownia.pl
                    </a>
                </div>

                {/* SEKCJA ŚRODKOWA: Autorka */}
                <div style={styles.authorSection}>
                    <div style={styles.authorTitle}>Autorka: Agnieszka Prościak</div>
                    <a href="mailto:agnprosciak@gmail.com" style={styles.email}>
                        agnprosciak@gmail.com
                    </a>
                </div>

                {/* SEKCJA PRAWA: Linki Prawne i Copyright */}
                <div style={styles.linksSection}>
                    <div style={styles.legalLinks}>
                        <Link to="/terms" style={styles.link}>Regulamin strony</Link>
                        <Link to="/privacy" style={styles.link}>Polityka Prywatności</Link>
                    </div>
                    <div style={styles.copyright}>
                        &copy; Tańcownia {new Date().getFullYear()}
                    </div>
                </div>

            </div>
        </footer>
    );
};

const styles = {
    footer: {
        backgroundColor: '#fff',
        borderTop: '1px solid #eee',
        marginTop: 'auto',
        fontFamily: "'Inter', sans-serif",
        fontSize: '14px',
        color: '#555',
        width: '100%',
        padding: '40px 0',
    },
    container: {
        width: '100%',
        padding: '0 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '30px',
        boxSizing: 'border-box'
    },
    brandSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '12px',
        flex: '1 1 300px' // Pozwala sekcji rosnąć i zwijać się
    },
    logoRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    logoIcon: {
        height: '36px',
        width: 'auto'
    },
    logoText: {
        height: '24px', 
        width: 'auto',
        marginTop: '4px'
    },
    tagline: {
        margin: 0,
        fontSize: '13px',
        color: '#777',
        lineHeight: '1.5'
    },
    email: {
        color: '#7A33E3',
        textDecoration: 'none',
        fontWeight: '600',
        fontSize: '13px',
        cursor: 'pointer'
    },
    authorSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '4px',
        flex: '1 1 200px'
    },
    authorTitle: {
        fontWeight: '500',
        color: '#555',
        fontSize: '13px'
    },
    authorEmail: {
        color: '#7A33E3',
        textDecoration: 'none',
        fontSize: '12px',
        fontWeight: '500'
    },
    linksSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
        flex: '1 1 300px'
    },
    legalLinks: {
        display: 'flex',
        gap: '20px'
    },
    link: {
        textDecoration: 'none',
        color: '#555',
        transition: '0.2s',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500'
    },
    copyright: {
        fontSize: '11px',
        color: '#999'
    }
};

export default Footer;