import { Link } from 'react-router-dom';
import logotyp from '../assets/logotyp.svg'; 
import logoNazwa from '../assets/logonazwa.svg'; 

const Footer = () => {
    return (
        <footer style={styles.footer}>
            <div style={styles.container}>
                
                {/* SEKCJA LEWA: Logotyp + Nazwa, Opis, Kontakt */}
                <div style={styles.brandSection}>
                    {/* Kontener na oba loga obok siebie */}
                    <div style={styles.logoRow}>
                        <img src={logotyp} alt="Logo" style={styles.logoIcon} />
                        <img src={logoNazwa} alt="DanceApp" style={styles.logoText} />
                    </div>

                    <p style={styles.tagline}>
                        Platforma do wyszukiwania szkół tańca i zajęć w całej Polsce.
                    </p>
                    <a style={styles.email}>
                        kontakt@tancownia.pl
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
        padding: '40px 0', // Zmniejszone z 60px na 40px (kompromis)
    },
    container: {
        width: '100%',
        padding: '0 40px', // Padding boczny bez zmian
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center', // Wyrównanie do środka (wygląda lepiej przy niższej stopce)
        flexWrap: 'wrap',
        gap: '30px',
        boxSizing: 'border-box'
    },
    brandSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '12px', // Nieco mniejsze odstępy
        maxWidth: '450px'
    },
    logoRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    logoIcon: {
        height: '36px', // Minimalnie mniejsze logo dla lepszej proporcji
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
        fontSize: '13px'
    },
    linksSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px'
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