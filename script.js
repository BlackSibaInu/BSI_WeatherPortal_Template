class WeatherPortal {
    constructor() {
        this.apiKey = 'YOUR_API_KEY'; // Замените на ваш API ключ OpenWeatherMap
        this.isLightTheme = true;
        this.currentCity = 'Moscow';
        this.currentWeatherCode = 800;
        this.units = 'metric';
        this.timeFormat = '24';
        this.soundEnabled = true;
        this.animationsEnabled = true;
        this.initializeElements();
        this.setupEventListeners();
        this.startApplication();
    }

    initializeElements() {
        // Основные элементы
        this.elements = {
            themeToggle: document.getElementById('theme-toggle'),
            refreshData: document.getElementById('refresh-data'),
            settingsToggle: document.getElementById('settings-toggle'),
            cityInput: document.getElementById('city-input'),
            geolocation: document.getElementById('geolocation'),
            weatherInfo: document.getElementById('weather-info'),
            weatherIcon: document.getElementById('weather-icon'),
            feelsLike: document.getElementById('feels-like'),
            humidity: document.getElementById('humidity'),
            windSpeed: document.getElementById('wind-speed'),
            pressure: document.getElementById('pressure'),
            currentTime: document.getElementById('current-time'),
            currentDate: document.getElementById('current-date'),
            notification: document.getElementById('notification'),
            soundEffect: document.getElementById('sound-effect'),
            forecastContainer: document.getElementById('forecast-container'),
            settingsPanel: document.getElementById('settings-panel'),
            unitsSelect: document.getElementById('units-select'),
            timeFormatSelect: document.getElementById('time-format'),
            soundToggle: document.getElementById('sound-toggle'),
            animationToggle: document.getElementById('animation-toggle'),
            citySuggestions: document.getElementById('city-suggestions')
        };
    }

    setupEventListeners() {
        // Основные элементы управления
        this.elements.themeToggle.addEventListener('click', () => this.switchTheme());
        this.elements.refreshData.addEventListener('click', () => this.updateAllData());
        this.elements.settingsToggle.addEventListener('click', () => this.toggleSettings());
        this.elements.geolocation.addEventListener('click', () => this.getCurrentLocation());

        // Поиск города
        this.elements.cityInput.addEventListener('input', (e) => this.handleCityInput(e));
        this.elements.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.changeCity();
        });

        // Настройки
        this.elements.unitsSelect.addEventListener('change', (e) => this.changeUnits(e.target.value));
        this.elements.timeFormatSelect.addEventListener('change', (e) => this.changeTimeFormat(e.target.value));
        this.elements.soundToggle.addEventListener('change', (e) => this.toggleSound(e.target.checked));
        this.elements.animationToggle.addEventListener('change', (e) => this.toggleAnimations(e.target.checked));

        // Обработка офлайн/онлайн состояния
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
    }

    startApplication() {
        this.loadSettings();
        this.initializeParticles();
        this.initializeChart();
        this.initializeAnalogClock();
        this.updateAllData();
        this.startTimeUpdate();
    }

    async updateAllData() {
        try {
            await this.updateWeather();
            await this.updateForecast();
            this.updateLastUpdateTime();
            this.showNotification('Данные успешно обновлены');
        } catch (error) {
            this.showNotification('Ошибка при обновлении данных', true);
            console.error('Ошибка обновления данных:', error);
        }
    }

    async updateWeather() {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${this.currentCity}&appid=${this.apiKey}&lang=ru&units=${this.units}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.cod === 200) {
                this.currentWeatherCode = data.weather[0].id;
                this.updateWeatherDisplay(data);
                this.addWeatherAnimation();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            throw new Error('Ошибка получения погодных данных');
        }
    }

    updateWeatherDisplay(data) {
        const tempUnit = this.units === 'metric' ? '°C' : '°F';
        const speedUnit = this.units === 'metric' ? 'м/с' : 'mph';
        
        this.elements.weatherInfo.textContent = `${data.weather[0].description}, ${Math.round(data.main.temp)}${tempUnit}`;
        this.elements.feelsLike.textContent = `${Math.round(data.main.feels_like)}${tempUnit}`;
        this.elements.humidity.textContent = `${data.main.humidity}%`;
        this.elements.windSpeed.textContent = `${data.wind.speed} ${speedUnit}`;
        this.elements.pressure.textContent = `${data.main.pressure} hPa`;
        this.updateWeatherIcon(data.weather[0].id);
    }

    async updateForecast() {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${this.currentCity}&appid=${this.apiKey}&lang=ru&units=${this.units}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.cod === '200') {
                const dailyForecasts = this.processForecastData(data.list);
                this.renderForecast(dailyForecasts);
                this.updateChart(dailyForecasts);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            throw new Error('Ошибка получения прогноза');
        }
    }

    processForecastData(forecastList) {
        const dailyForecasts = {};
        
        forecastList.forEach(forecast => {
            const date = new Date(forecast.dt * 1000).toLocaleDateString();
            
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = {
                    temp: forecast.main.temp,
                    icon: forecast.weather[0].id,
                    description: forecast.weather[0].description
                };
            }
        });

        return Object.entries(dailyForecasts).slice(1, 6);
    }

    renderForecast(forecasts) {
        const tempUnit = this.units === 'metric' ? '°C' : '°F';
        
        this.elements.forecastContainer.innerHTML = forecasts.map(([date, data]) => `
            <div class="forecast-item">
                <div class="forecast-date">${date}</div>
                <i class="fas ${this.getWeatherIconClass(data.icon)}"></i>
                <div class="forecast-temp">${Math.round(data.temp)}${tempUnit}</div>
                <div class="forecast-desc">${data.description}</div>
            </div>
        `).join('');
    }

    getWeatherIconClass(code) {
        if (code >= 200 && code < 300) return 'fa-bolt';
        if (code >= 300 && code < 500) return 'fa-cloud-rain';
        if (code >= 500 && code < 600) return 'fa-rain';
        if (code >= 600 && code < 700) return 'fa-snowflake';
        if (code >= 700 && code < 800) return 'fa-smog';
        if (code === 800) return 'fa-sun';
        return 'fa-cloud';
    }

    // Продолжение следует...
    async getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showNotification('Геолокация не поддерживается вашим браузером', true);
            return;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const { latitude, longitude } = position.coords;
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&lang=ru&units=${this.units}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.cod === 200) {
                this.currentCity = data.name;
                this.elements.cityInput.value = data.name;
                this.updateAllData();
                this.showNotification('Местоположение обновлено');
            }
        } catch (error) {
            this.showNotification('Ошибка определения местоположения', true);
        }
    }

    async handleCityInput(event) {
        const query = event.target.value.trim();
        if (query.length < 3) {
            this.elements.citySuggestions.style.display = 'none';
            return;
        }

        try {
            const url = `https://api.openweathermap.org/data/2.5/find?q=${query}&appid=${this.apiKey}&lang=ru`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.list && data.list.length > 0) {
                this.showCitySuggestions(data.list);
            }
        } catch (error) {
            console.error('Ошибка поиска городов:', error);
        }
    }

    showCitySuggestions(cities) {
        this.elements.citySuggestions.innerHTML = cities
            .slice(0, 5)
            .map(city => `
                <div class="suggestion-item" data-city="${city.name}">
                    ${city.name}, ${city.sys.country}
                </div>
            `)
            .join('');

        this.elements.citySuggestions.style.display = 'block';

        // Добавляем обработчики для выбора города из списка
        const suggestions = document.querySelectorAll('.suggestion-item');
        suggestions.forEach(item => {
            item.addEventListener('click', () => {
                this.elements.cityInput.value = item.dataset.city;
                this.currentCity = item.dataset.city;
                this.elements.citySuggestions.style.display = 'none';
                this.updateAllData();
            });
        });
    }

    switchTheme() {
        this.isLightTheme = !this.isLightTheme;
        document.body.classList.toggle('light-theme');
        document.body.classList.toggle('dark-theme');
        
        const icon = this.elements.themeToggle.querySelector('i');
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
        
        this.playSound('theme');
        this.saveSettings();
    }

    toggleSettings() {
        this.elements.settingsPanel.classList.toggle('active');
        this.playSound('click');
    }

    changeUnits(value) {
        this.units = value;
        this.updateAllData();
        this.saveSettings();
        this.playSound('click');
    }

    changeTimeFormat(value) {
        this.timeFormat = value;
        this.startTimeUpdate();
        this.saveSettings();
        this.playSound('click');
    }

    toggleSound(enabled) {
        this.soundEnabled = enabled;
        this.saveSettings();
    }

    toggleAnimations(enabled) {
        this.animationsEnabled = enabled;
        document.body.style.setProperty('--animation-speed', enabled ? '0.5s' : '0s');
        this.saveSettings();
        this.playSound('click');
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        const sounds = {
            theme: 'sounds/theme.mp3',
            click: 'sounds/click.mp3',
            notification: 'sounds/notification.mp3'
        };

        this.elements.soundEffect.src = sounds[type];
        this.elements.soundEffect.play().catch(() => {});
    }

    startTimeUpdate() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('ru-RU', {
                hour12: this.timeFormat === '12',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const dateString = now.toLocaleDateString('ru-RU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            this.elements.currentTime.textContent = timeString;
            this.elements.currentDate.textContent = dateString;
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    showNotification(message, isError = false) {
        this.elements.notification.textContent = message;
        this.elements.notification.style.backgroundColor = isError ? 
            'var(--secondary-color)' : 'var(--success-color)';
        this.elements.notification.classList.add('show');
        
        this.playSound('notification');
        
        setTimeout(() => {
            this.elements.notification.classList.remove('show');
        }, 3000);
    }

    saveSettings() {
        const settings = {
            isLightTheme: this.isLightTheme,
            units: this.units,
            timeFormat: this.timeFormat,
            soundEnabled: this.soundEnabled,
            animationsEnabled: this.animationsEnabled,
            currentCity: this.currentCity
        };
        localStorage.setItem('weatherPortalSettings', JSON.stringify(settings));
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('weatherPortalSettings'));
            if (settings) {
                this.isLightTheme = settings.isLightTheme;
                this.units = settings.units;
                this.timeFormat = settings.timeFormat;
                this.soundEnabled = settings.soundEnabled;
                this.animationsEnabled = settings.animationsEnabled;
                this.currentCity = settings.currentCity;

                // Применяем загруженные настройки
                document.body.classList.toggle('dark-theme', !this.isLightTheme);
                this.elements.unitsSelect.value = this.units;
                this.elements.timeFormatSelect.value = this.timeFormat;
                this.elements.soundToggle.checked = this.soundEnabled;
                this.elements.animationToggle.checked = this.animationsEnabled;
                this.elements.cityInput.value = this.currentCity;
            }
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
        }
    }

    handleOnlineStatus(isOnline) {
        this.showNotification(
            isOnline ? 'Подключение восстановлено' : 'Нет подключения к интернету',
            !isOnline
        );
        if (isOnline) {
            this.updateAllData();
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Регистрация Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker зарегистрирован:', registration);
            })
            .catch(error => {
                console.error('Ошибка регистрации ServiceWorker:', error);
            });
    }

    // Создание экземпляра приложения
    window.weatherPortal = new WeatherPortal();
});
function initializeToggles() {
    const toggles = document.querySelectorAll('.fancy-toggle');
    
    toggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const option = e.target.closest('.toggle-option');
            if (!option) return;
            
            const value = option.dataset.value;
            const currentActive = toggle.dataset.active;
            
            if (value === currentActive) return;
            
            // Обновляем активное состояние
            toggle.dataset.active = value;
            toggle.classList.add('toggle-pulse');
            
            // Обновляем классы опций
            toggle.querySelectorAll('.toggle-option').forEach(opt => {
                opt.classList.toggle('active', opt.dataset.value === value);
            });
            
            // Удаляем класс анимации
            setTimeout(() => {
                toggle.classList.remove('toggle-pulse');
            }, 500);
            
            // Вызываем соответствующий обработчик
            if (toggle.classList.contains('units-toggle')) {
                handleUnitsChange(value);
            } else if (toggle.classList.contains('time-format-toggle')) {
                handleTimeFormatChange(value);
            }
        });
    });
}

function handleUnitsChange(value) {
    // Ваш код обработки изменения единиц измерения
    console.log('Units changed to:', value);
}

function handleTimeFormatChange(value) {
    // Ваш код обработки изменения формата времени
    console.log('Time format changed to:', value);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', initializeToggles);

