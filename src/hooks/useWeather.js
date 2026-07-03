import { useState, useEffect, useCallback } from 'react';

// Coordenadas para Barinas, Sector La Yuca
const LAT = 8.6833; // Aprox para La Yuca / Barinas
const LON = -70.2333;
const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutos

/**
 * Traduce los códigos WMO (World Meteorological Organization) de Open-Meteo a texto y emoji
 */
function getWmoCondition(code) {
  if (code === 0) return { text: 'Despejado', emoji: '☀️' };
  if (code === 1) return { text: 'Mayormente despejado', emoji: '🌤️' };
  if (code === 2) return { text: 'Parcialmente nublado', emoji: '⛅' };
  if (code === 3) return { text: 'Nublado', emoji: '☁️' };
  if (code === 45 || code === 48) return { text: 'Niebla', emoji: '🌫️' };
  if (code >= 51 && code <= 55) return { text: 'Llovizna', emoji: '🌧️' };
  if (code >= 56 && code <= 57) return { text: 'Llovizna helada', emoji: '🌧️' };
  if (code >= 61 && code <= 65) return { text: 'Lluvia', emoji: '🌧️' };
  if (code >= 66 && code <= 67) return { text: 'Lluvia helada', emoji: '🌧️' };
  if (code >= 71 && code <= 77) return { text: 'Nieve', emoji: '🌨️' };
  if (code >= 80 && code <= 82) return { text: 'Chubascos', emoji: '🌧️' };
  if (code >= 85 && code <= 86) return { text: 'Chubascos de nieve', emoji: '🌨️' };
  if (code >= 95 && code <= 99) return { text: 'Tormenta eléctrica', emoji: '⛈️' };
  return { text: 'Sin datos', emoji: '🌤️' };
}

export function useWeather() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchWeather = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);

    try {
      // URL de Open-Meteo API con current y daily (para la lluvia de proximos dias)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=precipitation_probability_max&timezone=auto`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const current = data.current || {};
      const condition = getWmoCondition(current.weather_code);

      const daily = data.daily || {};
      const probLluviaDias = (daily.time || []).slice(1, 4).map((timeStr, idx) => {
        const d = new Date(timeStr);
        const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        // Usar getUTCDay() para evitar que el ajuste de zona horaria local atrase el día
        return {
          dia: diasSemana[d.getUTCDay()],
          prob: daily.precipitation_probability_max[idx + 1] || 0
        };
      });

      setWeather({
        emoji: condition.emoji,
        condicion: condition.text,
        temperatura: Math.round(current.temperature_2m ?? 0),
        sensacionTermica: Math.round(current.apparent_temperature ?? 0),
        humedad: Math.round(current.relative_humidity_2m ?? 0),
        viento: Math.round(current.wind_speed_10m ?? 0), // ya viene en km/h
        precipitacion: Math.round(current.precipitation ?? 0), // en mm
        probabilidades: probLluviaDias,
        uvIndex: null,
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
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchWeather(false);
  }, [fetchWeather]);

  // Actualización automática
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWeather(false);
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const refresh = () => fetchWeather(true);

  return { weather, loading, error, lastUpdated, isRefreshing, refresh };
}
