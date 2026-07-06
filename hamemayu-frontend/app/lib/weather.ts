// app/lib/weather.ts
const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  description: string;
  icon: string;
  wind_speed: number;
  city: string;
}

export interface ForecastData {
  dt: number;
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
}

export async function getCurrentWeather(): Promise<WeatherData | null> {
  try {
    const lat = process.env.NEXT_PUBLIC_WEATHER_LAT || '-7.7956';
    const lon = process.env.NEXT_PUBLIC_WEATHER_LNG || '110.3695';
    const city = process.env.NEXT_PUBLIC_WEATHER_CITY || 'Yogyakarta';
    
    const res = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=id`,
      { next: { revalidate: 300 } } // Cache 5 menit
    );

    if (!res.ok) return null;

    const data = await res.json();

    return {
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      wind_speed: data.wind.speed,
      city: city,
    };
  } catch (error) {
    console.error('Weather API Error:', error);
    return null;
  }
}

export async function getForecast(): Promise<ForecastData[] | null> {
  try {
    const lat = process.env.NEXT_PUBLIC_WEATHER_LAT || '-7.7956';
    const lon = process.env.NEXT_PUBLIC_WEATHER_LNG || '110.3695';

    const res = await fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=id`,
      { next: { revalidate: 600 } } // Cache 10 menit
    );

    if (!res.ok) return null;

    const data = await res.json();

    // Ambil 1 data per hari (jam 12:00)
    const dailyData: ForecastData[] = [];
    const seenDates = new Set();

    for (const item of data.list) {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      
      if (!seenDates.has(date) && dailyData.length < 7) {
        seenDates.add(date);
        dailyData.push({
          dt: item.dt,
          temp: Math.round(item.main.temp),
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          humidity: item.main.humidity,
          wind_speed: item.wind.speed,
        });
      }
    }

    return dailyData;
  } catch (error) {
    console.error('Forecast API Error:', error);
    return null;
  }
}

export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

export async function fetchItineraryWeather(startDate: string, days: number) {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error("API Key cuaca tidak ditemukan di .env.local");

  // OpenWeather 5-day forecast (Yogyakarta)
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=-7.7956&lon=110.3695&appid=${apiKey}&units=metric&lang=id`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error("Gagal fetch cuaca");
  
  const data = await res.json();
  
  // Kelompokkan per tanggal (YYYY-MM-DD)
  const dailyMap: Record<string, any> = {};
  data.list.forEach((item: any) => {
    const dateStr = item.dt_txt.split(' ')[0];
    if (!dailyMap[dateStr]) {
      dailyMap[dateStr] = {
        date: dateStr,
        temp: Math.round(item.main.temp),
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
        wind_speed: item.wind.speed
      };
    }
  });

  // Sesuaikan dengan jumlah hari itinerary
  const start = new Date(startDate);
  const forecast = [];
  
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    forecast.push(dailyMap[dateStr] || null);
  }
  
  return forecast; // Array index 0 = Hari 1, index 1 = Hari 2, dst
}