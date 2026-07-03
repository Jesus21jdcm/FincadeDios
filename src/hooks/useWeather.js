/**
 * Mapea el tipo de condición de clima de Google Weather a un emoji representativo.
 * Referencia: https://developers.google.com/maps/documentation/weather/conditions
 */
function getWeatherEmoji(type) {
  if (!type) return '🌤️';
  const t = type.toLowerCase();
  if (t.includes('thunder') || t.includes('storm')) return '⛈️';
  if (t.includes('rain') || t.includes('drizzle') || t.includes('shower')) return '🌧️';
  if (t.includes('snow') || t.includes('sleet') || t.includes('hail')) return '🌨️';
  if (t.includes('fog') || t.includes('mist') || t.includes('haze')) return '🌫️';
  if (t.includes('overcast') || t.includes('cloudy')) return '☁️';
  if (t.includes('partly') || t.includes('mostly_cloudy')) return '⛅';
  if (t.includes('clear') || t.includes('sunny')) return '☀️';
  if (t.includes('wind')) return '💨';
  return '🌤️';
}

/**
 * Traduce las condiciones de clima de inglés a español.
 */
function translateCondition(text) {
  if (!text) return 'Sin datos';
  const map = {
    'Clear': 'Despejado',
    'Sunny': 'Soleado',
    'Partly cloudy': 'Parcialmente nublado',
    'Mostly cloudy': 'Mayormente nublado',
    'Cloudy': 'Nublado',
    'Overcast': 'Cubierto',
    'Light rain': 'Lluvia ligera',
    'Moderate rain': 'Lluvia moderada',
    'Heavy rain': 'Lluvia intensa',
    'Thunderstorm': 'Tormenta eléctrica',
    'Drizzle': 'Llovizna',
    'Fog': 'Niebla',
    'Mist': 'Neblina',
    'Haze': 'Calima',
    'Windy': 'Ventoso',
    'Hot': 'Caluroso',
    'Humid': 'Húmedo',
  };
  for (const [en, es] of Object.entries(map)) {
    if (text.toLowerCase().includes(en.toLowerCase())) return es;
  }
  return text;
}

export function useWeather() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchWeather = useCallback(async (isManual = false) => {
    const apiKey = import.meta.env.VITE_GOOGLE_WEATHER_API_KEY;

    if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
      setError('API Key no configurada. Agrega VITE_GOOGLE_WEATHER_API_KEY en el archivo .env');
      setLoading(false);
      return;
    }

    if (isManual) setIsRefreshing(true);
    else if (!weather) setLoading(true);

    try {
      const url = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKey}&location.latitude=${LAT}&location.longitude=${LON}&unitsSystem=METRIC`;
      const res = await fetch(url);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData?.error?.message || `Error HTTP ${res.status}: ${res.statusText}`
        );
      }

      const data = await res.json();

      // Extrae los datos relevantes de la respuesta de Google Weather
      const condition = data.weatherCondition || {};
      const temp = data.temperature || {};
      const feelsLike = data.feelsLike || {};
      const wind = data.wind || {};
      const humidity = data.relativeHumidity;
      const precipitation = data.precipitation || {};

      setWeather({
        emoji: getWeatherEmoji(condition.type || condition.description?.text),
        condicion: translateCondition(condition.description?.text || condition.type || ''),
        temperatura: Math.round(temp.degrees ?? 0),
        sensacionTermica: Math.round(feelsLike.degrees ?? 0),
        humedad: Math.round(humidity ?? 0),
        viento: Math.round((wind.speed?.value ?? 0) * 3.6), // m/s a km/h
        precipitacion: Math.round(precipitation.probability?.percent ?? 0),
        uvIndex: data.uvIndex ?? null,
      });

      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[useWeather] Error al obtener clima:', err);
      setError(err.message || 'No se pudo conectar con el servicio de clima.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [weather]);

  // Carga inicial
  useEffect(() => {
    fetchWeather(false);
  }, []);

  // Actualización automática cada 10 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWeather(false);
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const refresh = () => fetchWeather(true);

  return { weather, loading, error, lastUpdated, isRefreshing, refresh };
