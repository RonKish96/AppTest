import React, { useState, useEffect } from 'react';

// מנוע החוקים - חישוב התאמה לפי מזג האוויר והספים שהגדרנו
function evaluateActivity(activity, temp, humidity, aqi, rain) {
  let score = 'GREEN';
  let warnings = [];
  let recommendation = '';

  if (activity === 'running') {
    if (temp > 30 || (temp > 28 && humidity > 70)) {
      score = 'RED';
      warnings.push('עומס חום כבד - סיכון להתייבשות ומכת שמש.');
    } else if (temp > 22 || humidity > 70) {
      if (score !== 'RED') score = 'YELLOW';
      warnings.push('טמפרטורה/לחות גבוהה - מומלץ להוריד קצב ולשתות מים.');
    }
  } else if (activity === 'cycling') {
    if (temp > 33) {
      score = 'RED';
      warnings.push('חום קיצוני לרכיבה ממושכת.');
    } else if (temp > 26) {
      if (score !== 'RED') score = 'YELLOW';
      warnings.push('חם בחוץ - הקפד על שתייה מרובה וציוד מגן.');
    }
  } else if (activity === 'walking') {
    if (temp > 37) {
      score = 'RED';
      warnings.push('חום קיצוני - הימנע משהייה בחוץ.');
    } else if (temp > 30) {
      if (score !== 'RED') score = 'YELLOW';
      warnings.push('מומלץ ללכת בצל ולהצטייד במים.');
    }
  }

  if (aqi > 150) {
    score = 'RED';
    warnings.push('איכות אוויר גרועה/אבק כבד - לא מומלץ לבצע פעילות אירובית בחוץ.');
  } else if (aqi > 100) {
    if (score !== 'RED') score = 'YELLOW';
    warnings.push('זיהום אוויר בינוני - רגישים לאסתמה צריכים להיזהר.');
  }

  if (rain > 5) {
    if (activity === 'cycling' || activity === 'running') {
      score = 'RED';
      warnings.push('גשם כבד - סכנת החלקה חמורה וראות לקויה.');
    }
  } else if (rain > 0) {
    if (activity === 'cycling') {
      if (score !== 'RED') score = 'YELLOW';
      warnings.push('כביש רטוב - זהירות מוגברת בפניות ובבלימה.');
    }
  }

  if (score === 'GREEN') {
    recommendation = 'תנאים מעולים לפעילות! צא להתאמן.';
  } else if (score === 'YELLOW') {
    recommendation = 'הפעילות אפשרית, אך יש לשים לב להתרעות ולעומס.';
  } else {
    recommendation = 'לא מומלץ לבצע פעילות בתנאים אלו. שקול חלופה מקורה.';
  }

  return { score, warnings, recommendation };
}

const DEFAULT_CITIES = [
  { name: 'תל אביב', lat: 32.0853, lon: 34.7818 },
  { name: 'ירושלים', lat: 31.7683, lon: 35.2137 },
  { name: 'חיפה', lat: 32.7940, lon: 34.9896 },
  { name: 'באר שבע', lat: 31.2529, lon: 34.7915 },
  { name: 'אילת', lat: 29.5581, lon: 34.9482 },
  { name: 'נתניה', lat: 32.3215, lon: 34.8532 },
  { name: 'אשדוד', lat: 31.8044, lon: 34.6553 },
  { name: 'ראשון לציון', lat: 31.9730, lon: 34.7925 },
  { name: 'פתח תקווה', lat: 32.0840, lon: 34.8878 },
  { name: 'טבריה', lat: 32.7944, lon: 35.5312 },
  { name: 'קצרין', lat: 32.9936, lon: 35.6881 }
];

const WEEKDAYS = [
  { id: 0, label: "א'", name: 'ראשון' },
  { id: 1, label: "ב'", name: 'שני' },
  { id: 2, label: "ג'", name: 'שלישי' },
  { id: 3, label: "ד'", name: 'רביעי' },
  { id: 4, label: "ה'", name: 'חמישי' },
  { id: 5, label: "ו'", name: 'שישי' },
  { id: 6, label: "ש'", name: 'שבת' },
];

const ACTIVITY_NAMES = {
  running: '🏃‍♂️ ריצה',
  cycling: '🚴‍♂️ רכיבה',
  walking: '🚶‍♂️ הליכה'
};

// פרופיל ברירת מחדל
const INITIAL_PROFILES = [
  {
    id: 'prof_default',
    name: 'שגרת אימונים רגילה',
    active: true,
    schedule: {
      0: { primary: 'running', fallback: 'walking', active: true },
      2: { primary: 'running', fallback: 'cycling', active: true },
      4: { primary: 'cycling', fallback: 'walking', active: true },
    }
  }
];

export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState('profiles');

  const [activity, setActivity] = useState('running');
  const [selectedCity, setSelectedCity] = useState(DEFAULT_CITIES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);

  // ניהול פרופילים
  const [profiles, setProfiles] = useState(() => {
    const saved = localStorage.getItem('fitweather_profiles');
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  const [newProfileName, setNewProfileName] = useState('');

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('fitweather_theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('fitweather_fontsize');
    return saved ? Number(saved) : 13;
  });

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('fitweather_favorites');
    return saved ? JSON.parse(saved) : [DEFAULT_CITIES[0], DEFAULT_CITIES[1]];
  });

  const [weatherData, setWeatherData] = useState({
    temp: 24,
    humidity: 50,
    aqi: 40,
    rain: 0,
    hourly: [],
    dailyForecast: [],
    selectedLabel: 'נוכחי',
    loading: false,
    error: null
  });

  useEffect(() => {
    localStorage.setItem('fitweather_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('fitweather_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('fitweather_fontsize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('fitweather_profiles', JSON.stringify(profiles));
  }, [profiles]);

  // הפרופיל הפעיל כרגע
  const activeProfile = profiles.find(p => p.active) || profiles[0];

  const toggleFavorite = (cityObj) => {
    setIsHeartAnimating(true);
    setTimeout(() => setIsHeartAnimating(false), 300);

    if (favorites.some(c => c.name === cityObj.name)) {
      setFavorites(favorites.filter(c => c.name !== cityObj.name));
    } else {
      setFavorites([...favorites, cityObj]);
    }
  };

  const isFavorite = favorites.some(c => c.name === selectedCity.name);

  const fetchWeather = async (cityObj) => {
    setSelectedCity(cityObj);
    setSearchQuery('');
    setWeatherData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${cityObj.lat}&longitude=${cityObj.lon}&current=temperature_2m,relative_humidity_2m,precipitation&hourly=temperature_2m,relative_humidity_2m,precipitation&daily=temperature_2m_max,relative_humidity_2m_mean,precipitation_sum&timezone=auto`
      );

      if (!response.ok) throw new Error('שגיאה בטעינת הנתונים');

      const data = await response.json();
      const currentHourIndex = new Date().getHours();
      const hourlyList = [];

      for (let i = 0; i < 6; i++) {
        const index = currentHourIndex + i;
        if (index < data.hourly.time.length) {
          const timeString = new Date(data.hourly.time[index]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          hourlyList.push({
            time: timeString,
            temp: Math.round(data.hourly.temperature_2m[index]),
            humidity: data.hourly.relative_humidity_2m[index],
            rain: data.hourly.precipitation[index] || 0
          });
        }
      }

      const dailyList = [];
      if (data.daily && data.daily.time) {
        data.daily.time.forEach((t, idx) => {
          const dateObj = new Date(t);
          const dayOfWeek = dateObj.getDay();
          dailyList.push({
            dayId: dayOfWeek,
            dateStr: t,
            maxTemp: Math.round(data.daily.temperature_2m_max[idx]),
            humidity: Math.round(data.daily.relative_humidity_2m_mean ? data.daily.relative_humidity_2m_mean[idx] : 50),
            rain: data.daily.precipitation_sum ? data.daily.precipitation_sum[idx] : 0
          });
        });
      }

      setWeatherData({
        temp: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
        aqi: 45,
        rain: data.current.precipitation || 0,
        hourly: hourlyList,
        dailyForecast: dailyList,
        selectedLabel: 'נוכחי',
        loading: false,
        error: null
      });
    } catch (err) {
      setWeatherData(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const handleSelectHour = (hourData) => {
    setWeatherData(prev => ({
      ...prev,
      temp: hourData.temp,
      humidity: hourData.humidity,
      rain: hourData.rain,
      selectedLabel: `שעה ${hourData.time}`
    }));
  };

  useEffect(() => {
    fetchWeather(DEFAULT_CITIES[0]);
  }, []);

  const result = evaluateActivity(activity, weatherData.temp, weatherData.humidity, weatherData.aqi, weatherData.rain);

  const getHeaderBackground = (score) => {
    if (score === 'GREEN') return 'linear-gradient(135deg, #10b981 0%, #065f46 100%)';
    if (score === 'YELLOW') return 'linear-gradient(135deg, #f59e0b 0%, #92400e 100%)';
    return 'linear-gradient(135deg, #f43f5e 0%, #881337 100%)';
  };

  const filteredCities = searchQuery.trim().length >= 2 
    ? DEFAULT_CITIES.filter(c => c.name.includes(searchQuery.trim()))
    : [];

  const themeStyles = {
    pageBg: isDarkMode ? '#0f172a' : '#f1f5f9',
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    cardBorder: isDarkMode ? '#334155' : '#e2e8f0',
    textColor: isDarkMode ? '#f8fafc' : '#0f172a',
    subTextColor: isDarkMode ? '#94a3b8' : '#64748b',
    btnBg: isDarkMode ? '#334155' : '#e2e8f0',
    btnText: isDarkMode ? '#cbd5e1' : '#334155',
    boxBg: isDarkMode ? '#0f172a' : '#f8fafc',
    boxBorder: isDarkMode ? '#334155' : '#cbd5e1',
    inputBg: isDarkMode ? '#0f172a' : '#ffffff'
  };

  // יצירת פרופיל חדש
  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    const newProf = {
      id: 'prof_' + Date.now(),
      name: newProfileName.trim(),
      active: false,
      schedule: {
        0: { primary: 'running', fallback: 'walking', active: true },
        2: { primary: 'running', fallback: 'cycling', active: true },
        4: { primary: 'cycling', fallback: 'walking', active: true }
      }
    };
    setProfiles([...profiles, newProf]);
    setNewProfileName('');
  };

  // הגדרת פרופיל כפעיל
  const handleSetActiveProfile = (profId) => {
    setProfiles(profiles.map(p => ({
      ...p,
      active: p.id === profId
    })));
  };

  // עדכון שגרת יום בפרופיל
  const handleUpdateScheduleDay = (profId, dayId, field, value) => {
    setProfiles(profiles.map(p => {
      if (p.id !== profId) return p;
      const dayData = p.schedule[dayId] || { primary: 'running', fallback: 'walking', active: false };
      return {
        ...p,
        schedule: {
          ...p.schedule,
          [dayId]: {
            ...dayData,
            [field]: value
          }
        }
      };
    }));
  };

  // חישוב המלצה ליום ביומן הפרופיל
  const getDayScheduleStatus = (dayId) => {
    if (!activeProfile || !activeProfile.schedule[dayId] || !activeProfile.schedule[dayId].active) {
      return { bg: themeStyles.boxBg, border: themeStyles.boxBorder, text: themeStyles.subTextColor, label: 'מנוחה', info: 'יום מנוחה' };
    }

    const dayConfig = activeProfile.schedule[dayId];
    const dayData = weatherData.dailyForecast.find(d => d.dayId === dayId);
    
    if (!dayData) {
      return { bg: '#2563eb', border: '#3b82f6', text: '#ffffff', label: ACTIVITY_NAMES[dayConfig.primary], info: 'תוכנן אימון' };
    }

    const primaryEval = evaluateActivity(dayConfig.primary, dayData.maxTemp, dayData.humidity, 45, dayData.rain);

    if (primaryEval.score === 'GREEN') {
      return { bg: 'rgba(16, 185, 129, 0.25)', border: '#10b981', text: '#34d399', label: `${ACTIVITY_NAMES[dayConfig.primary]} 🟢`, info: 'תנאים מעולים!' };
    }

    // אם הראשוני לא ירוק, נבדוק את החלופי!
    const fallbackEval = evaluateActivity(dayConfig.fallback, dayData.maxTemp, dayData.humidity, 45, dayData.rain);

    if (fallbackEval.score === 'GREEN') {
      return { bg: 'rgba(245, 158, 11, 0.25)', border: '#f59e0b', text: '#fbbf24', label: `${ACTIVITY_NAMES[dayConfig.fallback]} 🟡`, info: `מומלץ לעבור ל${ACTIVITY_NAMES[dayConfig.fallback]}` };
    }

    return { bg: 'rgba(244, 63, 94, 0.25)', border: '#f43f5e', text: '#f87171', label: `${ACTIVITY_NAMES[dayConfig.primary]} 🔴`, info: 'עדיף חלופה מקורה' };
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: themeStyles.pageBg,
      color: themeStyles.textColor,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px 10px',
      boxSizing: 'border-box',
      direction: 'rtl',
      transition: 'all 0.3s ease',
      fontSize: `${fontSize}px`
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: themeStyles.cardBg,
        borderRadius: '36px',
        overflow: 'hidden',
        boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 20px 30px -10px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${themeStyles.cardBorder}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s ease'
      }}>
        
        {/* כותרת עליונה */}
        <div style={{
          background: getHeaderBackground(result.score),
          padding: '25px 20px',
          textAlign: 'center',
          transition: 'all 0.5s ease',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            
            <button
              onClick={() => toggleFavorite(selectedCity)}
              title={isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
              style={{
                background: 'rgba(0,0,0,0.25)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                color: isFavorite ? '#f43f5e' : '#ffffff',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: isHeartAnimating ? 'scale(1.3)' : 'scale(1)',
                transition: 'transform 0.2s ease, color 0.2s ease, background-color 0.2s ease',
                boxShadow: isFavorite ? '0 0 12px rgba(244, 63, 94, 0.4)' : 'none'
              }}
            >
              {isFavorite ? '♥' : '♡'}
            </button>

            <span style={{
              backgroundColor: 'rgba(0,0,0,0.25)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: `${fontSize - 1}px`,
              fontWeight: '600'
            }}>
              {selectedCity.name} • {weatherData.selectedLabel}
            </span>

            <button
              onClick={() => setIsDrawerOpen(true)}
              title="תפריט הגדרות"
              style={{
                background: 'rgba(0,0,0,0.25)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                color: '#ffffff',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.15s ease'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              ☰
            </button>

          </div>

          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            margin: '10px auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
          }}>
            <span style={{ fontSize: `${fontSize + 26}px`, fontWeight: '900', lineHeight: '1' }}>{weatherData.temp}°</span>
            <span style={{ fontSize: `${fontSize - 2}px`, opacity: 0.8, marginTop: '2px' }}>טמפרטורה</span>
          </div>

          <div style={{
            backgroundColor: 'rgba(0,0,0,0.2)',
            padding: '10px 15px',
            borderRadius: '16px',
            fontSize: `${fontSize}px`,
            fontWeight: 'bold',
            marginTop: '10px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {result.recommendation}
          </div>
        </div>

        {/* תוכן הפאנל הראשי */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* יומן אימונים שבועי לפי הפרופיל הפעיל */}
          <div style={{
            backgroundColor: themeStyles.boxBg,
            borderRadius: '16px',
            padding: '14px',
            border: `1px solid ${themeStyles.boxBorder}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: `${fontSize - 1}px`, fontWeight: 'bold', color: themeStyles.textColor, display: 'block' }}>📅 יומן אימונים חכם</label>
                <span style={{ fontSize: '10px', color: themeStyles.subTextColor }}>פרופיל: {activeProfile ? activeProfile.name : 'ללא'}</span>
              </div>
              <button
                onClick={() => { setActiveMenuTab('profiles'); setIsDrawerOpen(true); }}
                style={{ fontSize: '11px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ערוך פרופילים ⚙️
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {WEEKDAYS.map((day) => {
                const status = getDayScheduleStatus(day.id);

                return (
                  <div
                    key={day.id}
                    style={{
                      padding: '8px 2px',
                      borderRadius: '12px',
                      border: `1.5px solid ${status.border}`,
                      backgroundColor: status.bg,
                      color: status.text,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{day.label}</span>
                    <span style={{ fontSize: '9px', fontWeight: '600' }}>{status.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* מועדפים */}
          {favorites.length > 0 && (
            <div>
              <label style={{ fontSize: `${fontSize - 1}px`, fontWeight: 'bold', color: themeStyles.subTextColor, display: 'block', marginBottom: '6px' }}>⭐️ מועדפים שלי</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {favorites.map((fav) => (
                  <button
                    key={fav.name}
                    onClick={() => fetchWeather(fav)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: `${fontSize}px`,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      backgroundColor: selectedCity.name === fav.name ? '#10b981' : themeStyles.btnBg,
                      color: selectedCity.name === fav.name ? '#ffffff' : themeStyles.btnText,
                      transition: 'all 0.2s'
                    }}
                  >
                    {fav.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* שדה חיפוש עיר */}
          <div style={{ position: 'relative' }}>
            <label style={{ fontSize: `${fontSize - 1}px`, fontWeight: 'bold', color: themeStyles.subTextColor, display: 'block', marginBottom: '6px' }}>חיפוש עיר מהמאגר</label>
            <input
              type="text"
              placeholder="הקלד לפחות 2 אותיות (למשל: תל, חי)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: `1px solid ${themeStyles.boxBorder}`,
                backgroundColor: themeStyles.inputBg,
                color: themeStyles.textColor,
                fontSize: `${fontSize}px`,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            {filteredCities.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                backgroundColor: themeStyles.cardBg,
                border: `1px solid ${themeStyles.cardBorder}`,
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                zIndex: 20,
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                {filteredCities.map((city) => (
                  <div
                    key={city.name}
                    onClick={() => fetchWeather(city)}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      fontSize: `${fontSize}px`,
                      borderBottom: `1px solid ${themeStyles.boxBorder}`,
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = themeStyles.btnBg}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    {city.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* בחירת פעילות */}
          <div>
            <label style={{ fontSize: `${fontSize - 1}px`, fontWeight: 'bold', color: themeStyles.subTextColor, display: 'block', marginBottom: '6px' }}>בחר פעילות</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: 'running', name: '🏃‍♂️ ריצה' },
                { id: 'cycling', name: '🚴‍♂️ רכיבה' },
                { id: 'walking', name: '🚶‍♂️ הליכה' },
              ].map((act) => (
                <button
                  key={act.id}
                  onClick={() => setActivity(act.id)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: `${fontSize}px`,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    backgroundColor: activity === act.id ? '#2563eb' : themeStyles.btnBg,
                    color: activity === act.id ? '#ffffff' : themeStyles.btnText,
                    transition: 'all 0.2s'
                  }}
                >
                  {act.name}
                </button>
              ))}
            </div>
          </div>

          {/* נתוני מזג אוויר */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div style={{ backgroundColor: themeStyles.boxBg, padding: '8px', borderRadius: '12px', textAlign: 'center', border: `1px solid ${themeStyles.boxBorder}` }}>
              <span style={{ fontSize: `${fontSize - 2}px`, color: themeStyles.subTextColor, display: 'block', marginBottom: '2px' }}>לחות</span>
              <span style={{ fontSize: `${fontSize}px`, fontWeight: 'bold' }}>{weatherData.humidity}%</span>
            </div>
            <div style={{ backgroundColor: themeStyles.boxBg, padding: '8px', borderRadius: '12px', textAlign: 'center', border: `1px solid ${themeStyles.boxBorder}` }}>
              <span style={{ fontSize: `${fontSize - 2}px`, color: themeStyles.subTextColor, display: 'block', marginBottom: '2px' }}>איכות אוויר</span>
              <span style={{ fontSize: `${fontSize}px`, fontWeight: 'bold' }}>{weatherData.aqi} AQI</span>
            </div>
            <div style={{ backgroundColor: themeStyles.boxBg, padding: '8px', borderRadius: '12px', textAlign: 'center', border: `1px solid ${themeStyles.boxBorder}` }}>
              <span style={{ fontSize: `${fontSize - 2}px`, color: themeStyles.subTextColor, display: 'block', marginBottom: '2px' }}>גשם</span>
              <span style={{ fontSize: `${fontSize}px`, fontWeight: 'bold' }}>{weatherData.rain} מ"מ</span>
            </div>
          </div>

          {/* תחזית שעתית */}
          {weatherData.hourly.length > 0 && (
            <div>
              <label style={{ fontSize: `${fontSize - 1}px`, fontWeight: 'bold', color: themeStyles.subTextColor, display: 'block', marginBottom: '6px' }}>תחזית לשעות הקרובות</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                {weatherData.hourly.map((h, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectHour(h)}
                    style={{
                      padding: '6px 2px',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: weatherData.selectedLabel === `שעה ${h.time}` ? '#2563eb' : themeStyles.boxBg,
                      color: weatherData.selectedLabel === `שעה ${h.time}` ? '#ffffff' : themeStyles.btnText,
                      outline: weatherData.selectedLabel === `שעה ${h.time}` ? '2px solid #60a5fa' : `1px solid ${themeStyles.boxBorder}`,
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '10px', display: 'block', opacity: 0.8 }}>{h.time}</span>
                    <span style={{ fontSize: `${fontSize}px`, fontWeight: 'bold', display: 'block', marginTop: '2px' }}>{h.temp}°</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* התרעות ואזהרות */}
          {result.warnings.length > 0 && (
            <div style={{
              backgroundColor: isDarkMode ? 'rgba(120, 53, 15, 0.3)' : '#fef3c7',
              border: `1px solid ${isDarkMode ? '#92400e' : '#fde68a'}`,
              borderRadius: '12px',
              padding: '10px',
              color: isDarkMode ? '#fef3c7' : '#92400e'
            }}>
              <span style={{ fontSize: `${fontSize - 1}px`, fontWeight: 'bold', display: 'block', marginBottom: '4px', color: isDarkMode ? '#fbbf24' : '#b45309' }}>התרעות והדגשים:</span>
              <ul style={{ margin: 0, paddingRight: '16px', fontSize: `${fontSize}px` }}>
                {result.warnings.map((w, idx) => (
                  <li key={idx} style={{ marginBottom: '2px' }}>{w}</li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* שכבת רקע כהה בעת פתיחת המגירה */}
        <div
          onClick={() => setIsDrawerOpen(false)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
            opacity: isDrawerOpen ? 1 : 0,
            pointerEvents: isDrawerOpen ? 'auto' : 'none',
            transition: 'opacity 0.3s ease'
          }}
        />

        {/* מגירת צד (Slide-in) משמאל */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '85%',
          backgroundColor: themeStyles.cardBg,
          boxShadow: '10px 0 30px rgba(0,0,0,0.5)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          boxSizing: 'border-box',
          borderRight: `1px solid ${themeStyles.cardBorder}`,
          transform: isDrawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${themeStyles.cardBorder}`, paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>⚙️ תפריט מערכת</h3>
            <button
              onClick={() => setIsDrawerOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: themeStyles.textColor
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {[
              { id: 'profiles', name: 'פרופילים' },
              { id: 'settings', name: 'הגדרות' },
              { id: 'about', name: 'אודות' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMenuTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '12px',
                  backgroundColor: activeMenuTab === tab.id ? '#2563eb' : themeStyles.btnBg,
                  color: activeMenuTab === tab.id ? '#ffffff' : themeStyles.btnText,
                  transition: 'background-color 0.2s ease'
                }}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* ניהול פרופילים מורחב */}
            {activeMenuTab === 'profiles' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* יצירת פרופיל חדש */}
                <div style={{ backgroundColor: themeStyles.boxBg, padding: '12px', borderRadius: '14px', border: `1px solid ${themeStyles.boxBorder}` }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>צור פרופיל אימונים חדש</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="שם הפרופיל (למשל: שגרת קיץ)..."
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: `1px solid ${themeStyles.boxBorder}`,
                        backgroundColor: themeStyles.inputBg,
                        color: themeStyles.textColor,
                        fontSize: '12px'
                      }}
                    />
                    <button
                      onClick={handleCreateProfile}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      צור
                    </button>
                  </div>
                </div>

                {/* רשימת פרופילים קיימים ועריכת השגרה שלהם */}
                {profiles.map((prof) => (
                  <div
                    key={prof.id}
                    style={{
                      backgroundColor: themeStyles.boxBg,
                      borderRadius: '14px',
                      padding: '12px',
                      border: `1.5px solid ${prof.active ? '#2563eb' : themeStyles.boxBorder}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{prof.name}</span>
                      <button
                        onClick={() => handleSetActiveProfile(prof.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          backgroundColor: prof.active ? '#2563eb' : themeStyles.btnBg,
                          color: prof.active ? '#ffffff' : themeStyles.btnText
                        }}
                      >
                        {prof.active ? 'פעיל כעת ✓' : 'הפעל פרופיל'}
                      </button>
                    </div>

                    {/* הגדרת ימי השבוע בתוך הפרופיל */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {WEEKDAYS.map((day) => {
                        const dayCfg = prof.schedule[day.id] || { primary: 'running', fallback: 'walking', active: false };

                        return (
                          <div
                            key={day.id}
                            style={{
                              backgroundColor: themeStyles.cardBg,
                              padding: '6px 8px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '11px',
                              gap: '4px'
                            }}
                          >
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                              <input
                                type="checkbox"
                                checked={dayCfg.active}
                                onChange={(e) => handleUpdateScheduleDay(prof.id, day.id, 'active', e.target.checked)}
                              />
                              {day.label}
                            </label>

                            {dayCfg.active ? (
                              <div style={{ display: 'flex', gap: '4px', flex: 1, justifyContent: 'flex-end' }}>
                                <select
                                  value={dayCfg.primary}
                                  onChange={(e) => handleUpdateScheduleDay(prof.id, day.id, 'primary', e.target.value)}
                                  style={{ fontSize: '10px', padding: '2px', borderRadius: '4px', backgroundColor: themeStyles.inputBg, color: themeStyles.textColor }}
                                >
                                  <option value="running">🏃‍♂️ ראשי: ריצה</option>
                                  <option value="cycling">🚴‍♂️ ראשי: רכיבה</option>
                                  <option value="walking">🚶‍♂️ ראשי: הליכה</option>
                                </select>

                                <select
                                  value={dayCfg.fallback}
                                  onChange={(e) => handleUpdateScheduleDay(prof.id, day.id, 'fallback', e.target.value)}
                                  style={{ fontSize: '10px', padding: '2px', borderRadius: '4px', backgroundColor: themeStyles.inputBg, color: themeStyles.textColor }}
                                >
                                  <option value="running">חלופי: ריצה</option>
                                  <option value="cycling">חלופי: רכיבה</option>
                                  <option value="walking">חלופי: הליכה</option>
                                </select>
                              </div>
                            ) : (
                              <span style={{ color: themeStyles.subTextColor, fontSize: '10px' }}>מנוחה</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

              </div>
            )}

            {activeMenuTab === 'settings' && (
              <>
                <div style={{ backgroundColor: themeStyles.boxBg, padding: '12px', borderRadius: '14px', border: `1px solid ${themeStyles.boxBorder}` }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>מצב תצוגה</span>
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    style={{
                      width: '100%',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {isDarkMode ? '🌙 כהה (החלף לבהיר)' : '☀️ בהיר (החלף לכהה)'}
                  </button>
                </div>

                <div style={{ backgroundColor: themeStyles.boxBg, padding: '12px', borderRadius: '14px', border: `1px solid ${themeStyles.boxBorder}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>גודל טקסט דינמי</span>
                    <span style={{ fontSize: '11px', color: themeStyles.subTextColor }}>{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="11"
                    max="17"
                    step="1"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
              </>
            )}

            {activeMenuTab === 'about' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6', margin: '0 0 6px 0' }}>FitWeather 🌤️</h4>
                <p style={{ fontSize: '12px', color: themeStyles.subTextColor, margin: '0 0 16px 0' }}>
                  אפליקציית מזג אוויר חכמה להתאמת אימונים אישיים.
                </p>
                <div style={{ backgroundColor: themeStyles.boxBg, padding: '10px', borderRadius: '10px', border: `1px solid ${themeStyles.boxBorder}` }}>
                  <span style={{ fontSize: '10px', color: themeStyles.subTextColor, display: 'block' }}>גרסת תוכנה</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>v2.0.0 (Smart Schedule)</span>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}