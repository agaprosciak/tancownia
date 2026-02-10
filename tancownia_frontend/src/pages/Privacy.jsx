import { useNavigate } from 'react-router-dom';

const Privacy = () => {
    const navigate = useNavigate();

    return (
        <div style={styles.container}>
            <div style={styles.backButtonWrapper}>
                 <span className="material-symbols-outlined" style={styles.backArrow} onClick={() => navigate(-1)}>arrow_back_ios</span>
            </div>

            <div style={styles.card}>
                <h1 style={styles.title}>Polityka Prywatności</h1>
                <p style={styles.date}>Obowiązuje od: 10.02.2026</p>

                <div style={styles.content}>
                    <h3>1. Administrator Danych</h3>
                    <p>
                        Administratorem Twoich danych osobowych jest Tańcownia Sp. z o.o. Dbamy o bezpieczeństwo Twoich danych i przetwarzamy je zgodnie z RODO.
                    </p>

                    <h3>2. Jakie dane zbieramy?</h3>
                    <p>
                        Zbieramy dane niezbędne do świadczenia usług, takie jak: imię, nazwisko, adres e-mail oraz (opcjonalnie) numer telefonu. W przypadku szkół tańca zbieramy również dane firmowe (NIP, adres siedziby).
                    </p>

                    <h3>3. Cel przetwarzania danych</h3>
                    <p>
                        Twoje dane są przetwarzane w celu:
                    </p>
                        <p>- Umożliwienia logowania i prowadzenia konta w serwisie.</p>
                        <p>- Kontaktu w sprawach technicznych i organizacyjnych.</p>
                        <p>- Wystawiania faktur (dla partnerów biznesowych).</p>

                    <h3>4. Pliki Cookies</h3>
                    <p>
                        Nasz serwis wykorzystuje pliki cookies w celu zapewnienia poprawnego działania strony, zapamiętywania sesji użytkownika oraz w celach statystycznych. Możesz zarządzać ustawieniami cookies w swojej przeglądarce.
                    </p>

                    <h3>5. Twoje prawa</h3>
                    <p>
                        Masz prawo do wglądu w swoje dane, ich sprostowania, usunięcia ("prawo do bycia zapomnianym") oraz ograniczenia przetwarzania. W celu realizacji praw skontaktuj się z nami pod adresem: kontakt@tancownia.pl.
                    </p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { backgroundColor: '#F8F9FF', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '60px', fontFamily: "'Inter', sans-serif" },
    backButtonWrapper: { width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'flex-start', padding: '30px 20px 10px 20px' },
    backArrow: { fontSize: '28px', cursor: 'pointer', color: '#333', fontWeight: 'bold' },
    card: { width: '100%', maxWidth: '1000px', backgroundColor: 'white', borderRadius: '24px', padding: '60px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginTop: '10px' },
    title: { fontSize: '32px', fontWeight: '800', color: '#333', marginBottom: '10px' },
    date: { color: '#888', fontSize: '14px', marginBottom: '40px' },
    content: { lineHeight: '1.8', color: '#555', fontSize: '16px' }
};

export default Privacy;