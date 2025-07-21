import React from 'react';
import './App.css'; // ייבוא קובץ ה-CSS הגלובלי של האפליקציה

// קומפוננטת Header - דוגמה
// בקובץ אמיתי, זו תהיה קומפוננטה נפרדת (לדוגמה, ב-src/components/Header.js)
// וקובץ ה-CSS שלה (Header.css) ייובא בתוכה.
const Header = () => {
  return (
    <header className="app-header">
      <div className="logo-container">
        <a href="/" className="logo-link">
          {/* אייקון SVG לדוגמה */}
          <svg width="32" height="32" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V7h2v10zm4 0h-2V7h2v10z"/>
          </svg>
          אפליקציית פוקר
        </a>
      </div>
      <nav className="main-nav">
        <ul>
          <li><a href="#dashboard">לוח מחוונים</a></li>
          <li><a href="#games">משחקים</a></li>
          <li><a href="#profile">פרופיל</a></li>
          <li><button className="logout-button">התנתק</button></li>
        </ul>
      </nav>
    </header>
  );
};

// קומפוננטת LoginPage - דוגמה
// בקובץ אמיתי, זו תהיה קומפוננטה נפרדת (לדוגמה, ב-src/pages/LoginPage.js)
const LoginPage = () => {
  return (
    <div className="login-form-container">
      <h2>ברוכים הבאים!</h2>
      <p>בחר כיצד ברצונך להתחבר:</p>
      <button className="connect-button">התחבר כעת</button>
      <div className="divider">או</div>
      <button className="email-button">התחבר עם אימייל וסיסמה</button>
      <button className="google-button">התחבר עם Google</button>
    </div>
  );
};

// קומפוננטת DashboardPage - דוגמה
// בקובץ אמיתי, זו תהיה קומפוננטה נפרדת (לדוגמה, ב-src/pages/DashboardPage.js)
const DashboardPage = () => {
  return (
    <div className="dashboard-container">
      <h2>לוח מחוונים</h2>
      <div className="dashboard-cards-container">
        <a href="#profile" className="dashboard-card">
          {/* אייקון SVG לדוגמה */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <h3>פרופיל אישי</h3>
          <p>צפה ועדכן את פרטי הפרופיל שלך.</p>
        </a>
        <a href="#games" className="dashboard-card">
          {/* אייקון SVG לדוגמה */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 16V6l-8 6 8 6z" />
          </svg>
          <h3>שחקים</h3>
          <p>התחל משחק חדש או הצטרף למשחק קיים.</p>
        </a>
        <a href="#history" className="dashboard-card">
          {/* אייקון SVG לדוגמה */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.51 0-2.91-.49-4.06-1.3l-1.42 1.42C9.4 19.52 11.1 20 13 20c4.97 0 9-4.03 9-9s-4.03-9-9-9z" />
          </svg>
          <h3>היסטוריית משחקים</h3>
          <p>צפה בתוצאות המשחקים הקודמים שלך.</p>
        </a>
      </div>
    </div>
  );
};


// קומפוננטת האפליקציה הראשית
function App() {
  // מצב לדוגמה לניתוב בין דפים
  const [currentPage, setCurrentPage] = React.useState('login'); // שנה ל-'dashboard' כדי לראות את לוח המחוונים

  // פונקציה לבחירת הקומפוננטה של הדף הנוכחי
  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage />;
      case 'dashboard':
        return <DashboardPage />;
      default:
        return <LoginPage />; // ברירת מחדל: דף כניסה
    }
  };

  return (
    <div id="root">
      {/* קומפוננטת ה-Header תמיד מוצגת בראש העמוד */}
      <Header />

      {/* אזור התוכן הראשי של האפליקציה.
          ה-CSS ב-App.css יחיל עליו ריפוד עליון כדי למנוע חפיפה עם ה-Header. */}
      <main className="main-content-area">
        {renderPage()} {/* הצגת הדף הנבחר */}
      </main>

      {/* כאן ניתן להוסיף קומפוננטת Footer אם קיימת */}
      {/* <footer className="app-footer">...</footer> */}
    </div>
  );
}

export default App;