import { useState, useEffect } from 'react';

/**
 * Tarayıcı Geolocation API'sini kullanarak kullanıcı konumunu döner.
 * returns { coords, loading, error, retry }
 */
export default function useGeolocation() {
  const [coords,  setCoords]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetch = () => {
    if (!navigator.geolocation) {
      setError('Tarayıcınız konum özelliğini desteklemiyor.');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(err.code === 1 ? 'Konum izni reddedildi.' : 'Konum alınamadı.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return { coords, loading, error, retry: fetch };
}
