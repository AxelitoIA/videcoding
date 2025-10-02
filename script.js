const cityInput = document.getElementById('cityInput');
const getWeatherBtn = document.getElementById('getWeatherBtn');
const weatherInfoDiv = document.getElementById('weatherInfo');
const errorMessageDiv = document.getElementById('errorMessage');
const suggestionsList = document.getElementById('suggestions');

const apiKey = "02c70f0b2f2ba22068998aa8feececc8";
const unsplashKey = "brXeOVJWGcAUDsI8jPt3zfIEqtVVtakGZcip4KB2IBk";

let timeoutId;
let currentSearch = '';

// Autocompletado
cityInput.addEventListener('input', () => {
    const query = cityInput.value.trim();
    
    clearTimeout(timeoutId);
    
    if (query.length < 2) {
        hideSuggestions();
        return;
    }

    if (query === currentSearch) return;
    currentSearch = query;

    timeoutId = setTimeout(() => {
        searchCities(query);
    }, 400);
});

// FUNCIÓN SIMPLIFICADA para buscar ciudades
function searchCities(query) {
    suggestionsList.innerHTML = '<li style="padding: 10px; color: #666;">Buscando ciudades...</li>';
    suggestionsList.style.display = "block";

    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=10&appid=${apiKey}`)
        .then(res => {
            if (!res.ok) throw new Error('Error en la API de ciudades');
            return res.json();
        })
        .then(cities => {
            displaySuggestions(cities, query);
        })
        .catch((error) => {
            console.error('Error buscando ciudades:', error);
            suggestionsList.innerHTML = '<li style="padding: 10px; color: #e74c3c;">Error al buscar ciudades</li>';
        });
}

// FUNCIÓN SIMPLIFICADA para mostrar sugerencias
function displaySuggestions(cities, originalQuery) {
    suggestionsList.innerHTML = "";

    if (!cities || cities.length === 0) {
        suggestionsList.innerHTML = '<li style="padding: 10px; color: #666;">No se encontraron ciudades</li>';
        return;
    }

    // FILTRADO MÁS FLEXIBLE - mostrar todas las ciudades de la API
    const relevantCities = cities
        .filter(city => {
            // Solo excluir ciudades sin nombre
            if (!city.name || city.name.length < 1) return false;
            
            // Incluir todas las ciudades que devuelve la API
            return true;
        })
        // Ordenar por importancia (ciudades más pobladas primero)
        .sort((a, b) => {
            // Priorizar ciudades de países conocidos
            const aIsPopular = isPopularCountry(a.country);
            const bIsPopular = isPopularCountry(b.country);
            
            if (aIsPopular && !bIsPopular) return -1;
            if (!aIsPopular && bIsPopular) return 1;
            
            // Priorizar ciudades que empiezan con la búsqueda
            const aStartsWith = a.name.toLowerCase().startsWith(originalQuery.toLowerCase());
            const bStartsWith = b.name.toLowerCase().startsWith(originalQuery.toLowerCase());
            
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            
            return 0;
        })
        // Limitar a 6 resultados
        .slice(0, 6);

    // Mostrar todas las ciudades relevantes
    relevantCities.forEach(city => {
        const li = createSuggestionItem(city);
        suggestionsList.appendChild(li);
    });

    suggestionsList.style.display = "block";
}

// FUNCIÓN AUXILIAR para crear items de sugerencia
function createSuggestionItem(city) {
    const li = document.createElement('li');
    
    // Formatear nombre de país en español si es posible
    const countryName = getCountryNameInSpanish(city.country);
    
    li.textContent = `${city.name}, ${countryName}`;
    li.setAttribute('data-city', `${city.name},${city.country}`);
    
    li.addEventListener('click', () => {
        selectCity(city.name, city.country);
    });
    
    return li;
}

// FUNCIÓN para verificar si es un país popular/conocido
function isPopularCountry(countryCode) {
    const popularCountries = [
        'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'CA', 'MX', 'AR', 
        'BR', 'CL', 'CO', 'PE', 'AU', 'NZ', 'JP', 'KR', 'CN', 'IN'
    ];
    return popularCountries.includes(countryCode);
}

// FUNCIÓN para obtener nombre del país en español
function getCountryNameInSpanish(countryCode) {
    const countryNames = {
        'US': 'Estados Unidos',
        'GB': 'Reino Unido',
        'FR': 'Francia',
        'DE': 'Alemania',
        'IT': 'Italia',
        'ES': 'España',
        'PT': 'Portugal',
        'CA': 'Canadá',
        'MX': 'México',
        'AR': 'Argentina',
        'BR': 'Brasil',
        'CL': 'Chile',
        'CO': 'Colombia',
        'PE': 'Perú',
        'AU': 'Australia',
        'NZ': 'Nueva Zelanda',
        'JP': 'Japón',
        'KR': 'Corea del Sur',
        'CN': 'China',
        'IN': 'India'
    };
    
    return countryNames[countryCode] || countryCode;
}

// FUNCIÓN para seleccionar ciudad
function selectCity(cityName, country) {
    cityInput.value = `${cityName}, ${getCountryNameInSpanish(country)}`;
    hideSuggestions();
    getWeather(`${cityName},${country}`);
}

// FUNCIÓN para ocultar sugerencias
function hideSuggestions() {
    suggestionsList.style.display = "none";
    suggestionsList.innerHTML = "";
    currentSearch = '';
}

// Botón obtener clima - CORREGIDO para Buenos Aires
getWeatherBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city === '') {
        showError("Por favor, ingresa una ciudad.");
        return;
    }
    hideSuggestions();
    
    // Si el usuario seleccionó una sugerencia, usar el formato correcto
    if (city.includes(',')) {
        const parts = city.split(',');
        const cityName = parts[0].trim();
        const countryName = parts[1].trim();
        
        // Buscar el código del país si tenemos el nombre en español
        const countryCode = getCountryCode(countryName);
        if (countryCode) {
            getWeather(`${cityName},${countryCode}`);
        } else {
            getWeather(cityName);
        }
    } else {
        // Si solo escribió el nombre, buscar directamente
        getWeather(city);
    }
});

// FUNCIÓN para obtener código de país desde nombre en español
function getCountryCode(countryName) {
    const countryMap = {
        'Estados Unidos': 'US',
        'Reino Unido': 'GB',
        'Francia': 'FR',
        'Alemania': 'DE',
        'Italia': 'IT',
        'España': 'ES',
        'Portugal': 'PT',
        'Canadá': 'CA',
        'México': 'MX',
        'Argentina': 'AR',
        'Brasil': 'BR',
        'Chile': 'CL',
        'Colombia': 'CO',
        'Perú': 'PE',
        'Australia': 'AU',
        'Nueva Zelanda': 'NZ',
        'Japón': 'JP',
        'Corea del Sur': 'KR',
        'China': 'CN',
        'India': 'IN'
    };
    
    return countryMap[countryName] || null;
}

// Búsqueda con Enter
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city === '') {
            showError("Por favor, ingresa una ciudad.");
            return;
        }
        hideSuggestions();
        
        // Misma lógica que el botón
        if (city.includes(',')) {
            const parts = city.split(',');
            const cityName = parts[0].trim();
            const countryName = parts[1].trim();
            
            const countryCode = getCountryCode(countryName);
            if (countryCode) {
                getWeather(`${cityName},${countryCode}`);
            } else {
                getWeather(cityName);
            }
        } else {
            getWeather(city);
        }
    }
});

// Ocultar sugerencias al hacer clic fuera
document.addEventListener('click', (e) => {
    if (!cityInput.contains(e.target) && !suggestionsList.contains(e.target)) {
        hideSuggestions();
    }
});

// FUNCIÓN para mostrar errores
function showError(message) {
    errorMessageDiv.textContent = message;
    weatherInfoDiv.classList.remove("show");
    setTimeout(() => {
        errorMessageDiv.textContent = "";
    }, 4000);
}

// FUNCIÓN para obtener clima
function getWeather(city) {
    showError("");
    weatherInfoDiv.classList.remove("show");
    
    // Mostrar loading
    weatherInfoDiv.innerHTML = '<p>Buscando clima...</p>';
    weatherInfoDiv.classList.add("show");

    console.log("Buscando clima para:", city); // Para debug

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=es`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error("Ciudad no encontrada");
            return response.json();
        })
        .then(data => {
            displayWeather(data);
            changeBackground(data.weather[0].main);
            getCityImage(city.split(',')[0]);
        })
        .catch(err => {
            showError("Error: " + err.message);
            weatherInfoDiv.innerHTML = "";
            weatherInfoDiv.classList.remove("show");
        });
}

function displayWeather(data) {
    const cityName = data.name;
    const temperature = data.main.temp;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;
    const description = data.weather[0].description;
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    const weatherHTML = `
        <h2>Clima en ${cityName}</h2>
        <img src="${iconUrl}" alt="Icono clima">
        <p><strong>Temperatura:</strong> ${temperature.toFixed(1)}°C</p>
        <p><strong>Descripción:</strong> ${description}</p>
        <p><strong>Humedad:</strong> ${humidity}%</p>
        <p><strong>Viento:</strong> ${windSpeed} m/s</p>
        <button onclick="clearSearch()" style="margin-top: 15px; padding: 8px 15px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Buscar otra ciudad</button>
    `;

    weatherInfoDiv.innerHTML = weatherHTML;
    weatherInfoDiv.classList.add("show");
}

// FUNCIÓN para limpiar y buscar otra ciudad
function clearSearch() {
    cityInput.value = "";
    cityInput.focus();
    weatherInfoDiv.classList.remove("show");
    hideSuggestions();
}

// Cambiar fondo según clima
function changeBackground(condition) {
    document.body.className = "";
    if (condition.includes("Clear")) document.body.classList.add("sunny");
    else if (condition.includes("Cloud")) document.body.classList.add("cloudy");
    else if (condition.includes("Rain")) document.body.classList.add("rainy");
    else if (condition.includes("Snow")) document.body.classList.add("snowy");
}

// Imagen de ciudad
function getCityImage(city) {
    const cityNameOnly = city.split(',')[0];
    fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(cityNameOnly)}&client_id=${unsplashKey}&orientation=landscape`)
        .then(res => res.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                const imgUrl = data.results[0].urls.regular;
                document.querySelector(".container").style.setProperty("--bg-image", `url(${imgUrl})`);
            }
        })
        .catch(() => console.log("No se encontró imagen"));
}

// Focus en el input al cargar la página
cityInput.focus();