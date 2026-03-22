const API_KEY = 'XZR9ULGRKFSRYTBV4EXHJ3UHH';
const weatherTranslations = {
    'clear': 'Ясно',
    'clear-day': 'Ясно',
    'clear-night': 'Ясно',
    'partly-cloudy-day': 'Переменная облачность',
    'partly-cloudy-night': 'Переменная облачность',
    'cloudy': 'Облачно',
    'rain': 'Дождь',
    'snow': 'Снег',
    'wind': 'Ветрено',
    'fog': 'Туман',
    'thunder': 'Гроза',
    'thunderstorm': 'Гроза',
    'overcast': 'Пасмурно',
    'drizzle': 'Морось'
};

function translateWeather(engCondition) {
    if (!engCondition) return '—';
    const lower = engCondition.toLowerCase();
    for (let key in weatherTranslations) {
        if (lower.includes(key)) return weatherTranslations[key];
    }
    return engCondition.charAt(0).toUpperCase() + engCondition.slice(1);
}

document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.querySelector('.city-input');
    const getButton = document.querySelector('.get-weather');
    const loadingDiv = document.querySelector('.loading');
    const resultDiv = document.querySelector('.weather-result');

    function showLoading(show) {
        loadingDiv.style.display = show ? 'block' : 'none';
    }

    function showError(msg) {
        resultDiv.innerHTML = `<div class="error-message">❌ ${msg}</div>`;
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const options = { weekday: 'short', day: 'numeric' };
        let formatted = date.toLocaleDateString('ru-RU', options);
        return formatted.replace('.', '');
    }

    function renderWeather(data) {
        if (!data || !data.days || data.days.length === 0) {
            throw new Error('Нет данных о погоде');
        }

        const city = data.resolvedAddress || data.address;
        const today = data.days[0];
        const nextDays = data.days.slice(1, 4);

        const todayCondition = translateWeather(today.conditions || today.description || '');

        resultDiv.innerHTML = `
            <div class="current">
                <div class="city-name">${escapeHtml(city)}</div>
                <div class="temp">${Math.round(today.temp)}°C</div>
                <div class="condition">${todayCondition}</div>
                <div style="font-size:0.8rem; margin-top:5px;">
                    💧 Влажность: ${today.humidity ?? '—'}% | 💨 Ветер: ${Math.round(today.windspeed ?? 0)} м/с
                </div>
            </div>
            <div class="days">
                ${nextDays.map(day => `
                    <div class="day-card">
                        <span class="day-name">${formatDate(day.datetime)}</span>
                        <span>${Math.round(day.tempmin ?? day.temp)}°…${Math.round(day.tempmax ?? day.temp)}°</span>
                        <span class="day-temp">${translateWeather(day.conditions || '')}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    async function fetchWeather(city) {
        if (!city.trim()) throw new Error('Введите название города');

        const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(city.trim())}?unitGroup=metric&include=days&key=${API_KEY}&contentType=json`;

        const resp = await fetch(url);
        if (!resp.ok) {
            if (resp.status === 401) throw new Error('Неверный API ключ');
            if (resp.status === 404) throw new Error('Город не найден');
            if (resp.status === 400) throw new Error('Проверьте название города');
            throw new Error(`Ошибка ${resp.status}`);
        }
        return await resp.json();
    }

    async function handleClick() {
        const city = cityInput.value.trim();
        showLoading(true);
        resultDiv.innerHTML = '';

        try {
            const data = await fetchWeather(city);
            renderWeather(data);
        } catch (err) {
            showError(err.message);
        } finally {
            showLoading(false);
        }
    }

    getButton.addEventListener('click', handleClick);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleClick();
    });
});