/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, ZoomIn, ZoomOut } from 'lucide-react';

const KakaoMap = ({ stores, onStoreSelect, selectedStore }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [error, setError] = useState(null);

  const initializeMap = useCallback(() => {
    try {
      const container = mapRef.current;
      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780),
        level: 8
      };
      const map = new window.kakao.maps.Map(container, options);
      mapInstanceRef.current = map;
      const zoomControl = new window.kakao.maps.ZoomControl();
      map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
      setIsMapLoaded(true);
    } catch {
      setError('지도를 초기화하는 중 오류가 발생했습니다.');
    }
  }, []);

  const updateMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.kakao.maps.LatLngBounds();

    stores.forEach(store => {
      const position = new window.kakao.maps.LatLng(store.lat, store.lng);
      bounds.extend(position);

      const markerImage = new window.kakao.maps.MarkerImage(
        'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
        new window.kakao.maps.Size(24, 35)
      );

      const marker = new window.kakao.maps.Marker({
        position: position,
        map: map,
        title: store.name,
        image: markerImage
      });

      const iwContent = '<div style="padding:12px;min-width:200px;font-family:sans-serif;">' +
        '<div style="font-weight:bold;font-size:14px;margin-bottom:4px;color:#1a365d;">' + store.name + '</div>' +
        '<div style="font-size:12px;color:#64748b;margin-bottom:8px;">' + store.address + '</div>' +
        '<div style="display:flex;align-items:center;gap:4px;">' +
        '<span style="color:#f59e0b;">★</span>' +
        '<span style="font-weight:600;">' + store.rating + '</span>' +
        '<span style="color:#94a3b8;">(' + store.review_count + ')</span>' +
        '</div></div>';

      const infowindow = new window.kakao.maps.InfoWindow({
        content: iwContent,
        removable: true
      });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        markersRef.current.forEach(m => {
          if (m.infowindow) m.infowindow.close();
        });
        infowindow.open(map, marker);
        if (onStoreSelect) onStoreSelect(store);
      });

      marker.infowindow = infowindow;
      markersRef.current.push(marker);
    });

    if (stores.length > 0) {
      map.setBounds(bounds);
    }
  }, [stores, onStoreSelect]);

  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      initializeMap();
    } else {
      setError('카카오맵 SDK가 로드되지 않았습니다. API 키를 확인해주세요.');
    }
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
    };
  }, [initializeMap]);

  useEffect(() => {
    if (isMapLoaded && stores.length > 0) {
      updateMarkers();
    }
  }, [stores, isMapLoaded, updateMarkers]);

  useEffect(() => {
    if (selectedStore && mapInstanceRef.current) {
      const position = new window.kakao.maps.LatLng(selectedStore.lat, selectedStore.lng);
      mapInstanceRef.current.setCenter(position);
      mapInstanceRef.current.setLevel(3);
    }
  }, [selectedStore]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const level = mapInstanceRef.current.getLevel();
      mapInstanceRef.current.setLevel(level - 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const level = mapInstanceRef.current.getLevel();
      mapInstanceRef.current.setLevel(level + 1);
    }
  };

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const locPosition = new window.kakao.maps.LatLng(lat, lng);
          mapInstanceRef.current.setCenter(locPosition);
          mapInstanceRef.current.setLevel(4);
        },
        () => { alert('위치 정보를 가져올 수 없습니다.'); }
      );
    } else {
      alert('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
    }
  };

  if (error) {
    return (
      <div className="h-full bg-gradient-to-br from-navy-100 to-navy-200 rounded-2xl flex items-center justify-center">
        <div className="text-center p-8">
          <MapPin className="w-16 h-16 text-navy-400 mx-auto mb-4" />
          <p className="text-navy-600 font-medium mb-2">지도를 불러올 수 없습니다</p>
          <p className="text-navy-400 text-sm">{error}</p>
          <p className="text-navy-400 text-sm mt-4">
            카카오 개발자 사이트에서 발급받은 JavaScript 키를<br />
            index.html의 KAKAO_APP_KEY에 입력해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div ref={mapRef} className="w-full h-full rounded-2xl" />

      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button onClick={handleMyLocation} className="w-10 h-10 bg-white rounded-xl shadow-card flex items-center justify-center hover:bg-gray-50 transition-colors" title="내 위치">
          <Navigation className="w-5 h-5 text-primary-600" />
        </button>
        <button onClick={handleZoomIn} className="w-10 h-10 bg-white rounded-xl shadow-card flex items-center justify-center hover:bg-gray-50 transition-colors" title="확대">
          <ZoomIn className="w-5 h-5 text-navy-600" />
        </button>
        <button onClick={handleZoomOut} className="w-10 h-10 bg-white rounded-xl shadow-card flex items-center justify-center hover:bg-gray-50 transition-colors" title="축소">
          <ZoomOut className="w-5 h-5 text-navy-600" />
        </button>
      </div>
    </div>
  );
};

export default KakaoMap;
