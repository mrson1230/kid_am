import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  Music, 
  Video, 
  Image as ImageIcon, 
  Plus, 
  Play, 
  Pause, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  ChevronRight, 
  Sparkles, 
  FolderOpen,
  Search,
  X,
  Phone,
  FileText,
  Volume2,
  ExternalLink,
  Navigation,
  Upload,
  FileSpreadsheet,
  Loader2,
  Wand2,
  Download,
  HardDriveUpload,
  Check
} from 'lucide-react';

// 초기 상태는 깔끔하게 비워두어 아내분과 동료분들이 바로 본인 자료로 시작할 수 있도록 구성
const INITIAL_SHOWS = [];

const INITIAL_MEDIA = [];

// 10가지 기분 테마 데이터 (상단 기분 툴에서 선택 가능)
const MOOD_THEMES = [
  { id: 'happy', emoji: '🎪', label: '신나는 무대', headerBg: 'from-amber-400 via-orange-400 to-rose-400', navBg: 'from-amber-50 via-orange-50/90 to-rose-50', btnBg: 'from-orange-500 to-rose-500', accentText: 'text-orange-500', greeting: '오늘도 즐거운 무대!' },
  { id: 'love', emoji: '🥰', label: '설렘 가득', headerBg: 'from-pink-400 via-rose-400 to-red-400', navBg: 'from-pink-50 via-rose-50/90 to-red-50', btnBg: 'from-pink-500 to-rose-500', accentText: 'text-pink-500', greeting: '사랑스러운 하루예요!' },
  { id: 'sunny', emoji: '☀️', label: '상큼 발랄', headerBg: 'from-yellow-400 via-amber-400 to-orange-400', navBg: 'from-yellow-50 via-amber-50/90 to-orange-50', btnBg: 'from-amber-500 to-orange-500', accentText: 'text-amber-600', greeting: '햇살처럼 반짝이는 무대!' },
  { id: 'fresh', emoji: '🍀', label: '싱그러움', headerBg: 'from-emerald-400 via-teal-400 to-cyan-500', navBg: 'from-emerald-50 via-teal-50/90 to-cyan-50', btnBg: 'from-emerald-500 to-teal-500', accentText: 'text-emerald-600', greeting: '행운이 가득할 거예요!' },
  { id: 'calm', emoji: '🌊', label: '차분한 여유', headerBg: 'from-sky-400 via-blue-400 to-indigo-400', navBg: 'from-sky-50 via-blue-50/90 to-indigo-50', btnBg: 'from-sky-500 to-blue-500', accentText: 'text-sky-600', greeting: '편안하고 멋진 공연!' },
  { id: 'magic', emoji: '🔮', label: '신비로운 마술', headerBg: 'from-purple-400 via-violet-500 to-indigo-500', navBg: 'from-purple-50 via-violet-50/90 to-indigo-50', btnBg: 'from-purple-500 to-indigo-500', accentText: 'text-purple-600', greeting: '마법 같은 순간을 만들어요!' },
  { id: 'peach', emoji: '🍑', label: '달콤 포근', headerBg: 'from-rose-300 via-orange-300 to-amber-300', navBg: 'from-rose-50 via-orange-50/90 to-amber-50', btnBg: 'from-rose-400 to-orange-400', accentText: 'text-rose-500', greeting: '달콤하고 따뜻한 하루!' },
  { id: 'energetic', emoji: '🔥', label: '열정 뿜뿜', headerBg: 'from-red-500 via-orange-500 to-amber-500', navBg: 'from-red-50 via-orange-50/90 to-amber-50', btnBg: 'from-red-500 to-orange-500', accentText: 'text-red-500', greeting: '에너지 넘치는 최고의 무대!' },
  { id: 'dreamy', emoji: '🦄', label: '동화 속 세상', headerBg: 'from-fuchsia-400 via-pink-400 to-purple-400', navBg: 'from-fuchsia-50 via-pink-50/90 to-purple-50', btnBg: 'from-fuchsia-500 to-purple-500', accentText: 'text-fuchsia-600', greeting: '동화처럼 예쁜 시간!' },
  { id: 'chic', emoji: '🌙', label: '모던 시크', headerBg: 'from-slate-700 via-slate-800 to-zinc-800', navBg: 'from-slate-100 via-slate-200/80 to-zinc-100', btnBg: 'from-slate-700 to-slate-900', accentText: 'text-slate-700', greeting: '프로페셔널한 무대 매너!' }
];

// =====================================================================
// 브라우저 내부 영구 파일 저장소 (IndexedDB) 헬퍼 함수
// 스마트폰에서 선택한 MP3, 영상, 사진 파일을 앱 종료 후에도 영구 보존
// =====================================================================
const DB_NAME = 'KidsShowFilesDB';
const STORE_NAME = 'mediaFiles';

function openFilesDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveFileToDB(id, fileBlob) {
  try {
    const db = await openFilesDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(fileBlob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('파일 영구 저장 실패:', err);
  }
}

async function getAllFileUrlsFromDB() {
  try {
    const db = await openFilesDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const urlMap = {};
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          urlMap[cursor.key] = URL.createObjectURL(cursor.value);
          cursor.continue();
        } else {
          resolve(urlMap);
        }
      };
      cursorReq.onerror = () => resolve({});
    });
  } catch (err) {
    return {};
  }
}

const SAMPLE_SHOW_IDS = ['show-1', 'show-2'];
const SAMPLE_MEDIA_IDS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];

export default function App() {
  // 상태 관리 (LocalStorage 연동으로 브라우저를 닫아도 데이터 유지)
  const [shows, setShows] = useState(() => {
    const saved = localStorage.getItem('kids_shows_v1');
    if (!saved) return INITIAL_SHOWS;
    const parsed = JSON.parse(saved);
    return parsed.filter(s => !SAMPLE_SHOW_IDS.includes(s.id));
  });

  const [mediaList, setMediaList] = useState(() => {
    const saved = localStorage.getItem('kids_media_v1');
    if (!saved) return INITIAL_MEDIA;
    const parsed = JSON.parse(saved);
    return parsed.filter(m => !SAMPLE_MEDIA_IDS.includes(m.id));
  });

  // 네비게이션 및 모달 상태
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'schedule' | 'media'
  const [selectedShow, setSelectedShow] = useState(null); // 상세보기 및 현장 큐시트 모드
  const [showAddModal, setShowAddModal] = useState(false);
  const [mediaAddModal, setMediaAddModal] = useState(false);
  const [defaultMediaType, setDefaultMediaType] = useState('audio');
  const [mediaFilter, setMediaFilter] = useState('all'); // 'all' | 'audio' | 'video' | 'image'
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClearSamples, setConfirmClearSamples] = useState(false);

  // 데이터 백업/복원 상태
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupStatusMsg, setBackupStatusMsg] = useState('');

  // 기분 테마 상태 (기본값: 'happy')
  const [moodId, setMoodId] = useState(() => {
    return localStorage.getItem('kids_mood_v1') || 'happy';
  });
  const currentMood = MOOD_THEMES.find(m => m.id === moodId) || MOOD_THEMES[0];

  useEffect(() => {
    localStorage.setItem('kids_mood_v1', moodId);
  }, [moodId]);

  // 오디오 재생 시뮬레이터 상태 (현장에서 바로 테스트 및 재생 느낌 제공)
  const [playingMediaId, setPlayingMediaId] = useState(null);
  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);

  // 데이터 변경 시 로컬스토리지 저장
  useEffect(() => {
    localStorage.setItem('kids_shows_v1', JSON.stringify(shows));
  }, [shows]);

  useEffect(() => {
    // blob URL은 세션마다 새로 생성되므로 저장 시 제외하고 메타데이터만 안전하게 보관
    const serializableMedia = mediaList.map(({ fileUrl, ...rest }) => rest);
    localStorage.setItem('kids_media_v1', JSON.stringify(serializableMedia));
  }, [mediaList]);

  // 앱 실행 시 IndexedDB에서 영구 저장된 실제 음악/영상/사진 파일 복원
  useEffect(() => {
    let activeUrls = [];
    getAllFileUrlsFromDB().then((urlMap) => {
      activeUrls = Object.values(urlMap);
      if (activeUrls.length > 0) {
        setMediaList((prev) =>
          prev.map((m) => (urlMap[m.id] ? { ...m, fileUrl: urlMap[m.id], hasSavedFile: true } : m))
        );
      }
    });
    return () => {
      activeUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  // 오디오 재생/정지 핸들러 (실제 파일이 없어도 사운드 테스트가 가능하도록 Web Audio API 활용 + 실제 업로드 파일 재생 지원)
  const togglePlayAudio = (media) => {
    if (playingMediaId === media.id) {
      stopAudio();
      return;
    }

    stopAudio();
    setPlayingMediaId(media.id);

    // 실제 업로드된 오디오 URL이 있는 경우
    if (media.fileUrl) {
      const audio = new Audio(media.fileUrl);
      audio.onended = () => setPlayingMediaId(null);
      audio.play().catch(() => setPlayingMediaId(null));
      oscRef.current = { stop: () => { audio.pause(); audio.currentTime = 0; } };
      return;
    }

    // 샘플 데이터용 멜로디 시뮬레이터
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(media.freq || 440, ctx.currentTime);
      
      // 부드러운 멜로디 변화
      osc.frequency.exponentialRampToValueAtTime((media.freq || 440) * 1.25, ctx.currentTime + 0.5);
      osc.frequency.exponentialRampToValueAtTime(media.freq || 440, ctx.currentTime + 1.0);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 2.5);

      osc.onended = () => {
        setPlayingMediaId(null);
      };
      oscRef.current = osc;
    } catch (e) {
      setTimeout(() => setPlayingMediaId(null), 2000);
    }
  };

  const stopAudio = () => {
    if (oscRef.current) {
      try {
        oscRef.current.stop();
      } catch (e) {}
      oscRef.current = null;
    }
    setPlayingMediaId(null);
  };

  // 체크리스트 토글
  const toggleChecklist = (showId, checkId) => {
    setShows(prev => prev.map(show => {
      if (show.id !== showId) return show;
      const updated = {
        ...show,
        checklist: show.checklist.map(c => c.id === checkId ? { ...c, done: !c.done } : c)
      };
      if (selectedShow?.id === showId) setSelectedShow(updated);
      return updated;
    }));
  };

  // 체크리스트 항목 추가
  const addChecklistItem = (showId, text) => {
    if (!text.trim()) return;
    setShows(prev => prev.map(show => {
      if (show.id !== showId) return show;
      const updated = {
        ...show,
        checklist: [...show.checklist, { id: `c-${Date.now()}`, text, done: false }]
      };
      if (selectedShow?.id === showId) setSelectedShow(updated);
      return updated;
    }));
  };

  // 공연에 미디어 연결/해제 토글
  const toggleShowMedia = (showId, mediaId) => {
    setShows(prev => prev.map(show => {
      if (show.id !== showId) return show;
      const exists = show.mediaIds.includes(mediaId);
      const updated = {
        ...show,
        mediaIds: exists 
          ? show.mediaIds.filter(id => id !== mediaId)
          : [...show.mediaIds, mediaId]
      };
      if (selectedShow?.id === showId) setSelectedShow(updated);
      return updated;
    }));
  };

  // 공연 삭제
  const deleteShow = (showId) => {
    setShows(prev => prev.filter(s => s.id !== showId));
    if (selectedShow?.id === showId) setSelectedShow(null);
  };

  // 미디어 삭제
  const deleteMedia = (mediaId) => {
    deleteFileFromDB(mediaId);
    setMediaList(prev => prev.filter(m => m.id !== mediaId));
    setShows(prev => prev.map(s => ({
      ...s,
      mediaIds: s.mediaIds.filter(id => id !== mediaId)
    })));
  };

  // 현재 남아있는 샘플 데이터 개수 확인 및 일괄 삭제 핸들러
  const hasSampleData =
    shows.some(s => SAMPLE_SHOW_IDS.includes(s.id)) ||
    mediaList.some(m => SAMPLE_MEDIA_IDS.includes(m.id));

  const handleClearSamples = () => {
    stopAudio();
    SAMPLE_MEDIA_IDS.forEach(id => deleteFileFromDB(id));
    setShows(prev =>
      prev
        .filter(s => !SAMPLE_SHOW_IDS.includes(s.id))
        .map(s => ({
          ...s,
          mediaIds: s.mediaIds.filter(id => !SAMPLE_MEDIA_IDS.includes(id))
        }))
    );
    setMediaList(prev => prev.filter(m => !SAMPLE_MEDIA_IDS.includes(m.id)));
    if (selectedShow && SAMPLE_SHOW_IDS.includes(selectedShow.id)) {
      setSelectedShow(null);
    }
    setConfirmClearSamples(false);
  };

  // 전체 데이터 백업 파일(JSON) 내보내기 (일정 + 자료 목록 + 실제 음악/영상/사진 파일 포함)
  const handleExportBackup = async () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    setBackupStatusMsg('백업 파일을 생성하고 있어요...');
    try {
      const filesMap = await exportAllFilesFromDB();
      const serializableMedia = mediaList.map(({ fileUrl, ...rest }) => rest);
      const backupPayload = {
        app: 'KidsShowManager',
        version: 1,
        exportedAt: new Date().toISOString(),
        moodId,
        shows,
        mediaList: serializableMedia,
        files: filesMap
      };
      const blob = new Blob([JSON.stringify(backupPayload)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStamp = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `키즈공연매니저_백업_${dateStamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupStatusMsg('✅ 백업 파일이 다운로드되었습니다! 카톡이나 메일로 PC에 옮겨두세요.');
    } catch (err) {
      setBackupStatusMsg('⚠️ 백업 생성 중 오류가 발생했습니다.');
    } finally {
      setIsBackingUp(false);
      setTimeout(() => setBackupStatusMsg(''), 5000);
    }
  };

  // 백업 파일 불러오기(복원)
  const handleImportBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsBackingUp(true);
    setBackupStatusMsg('백업 데이터를 복원하고 있어요...');
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.app !== 'KidsShowManager' || !Array.isArray(parsed.shows) || !Array.isArray(parsed.mediaList)) {
        throw new Error('올바른 백업 파일이 아닙니다.');
      }

      // 실제 파일(IndexedDB) 복원
      const restoredUrlMap = {};
      if (parsed.files && typeof parsed.files === 'object') {
        for (const [id, fileObj] of Object.entries(parsed.files)) {
          if (fileObj?.dataUrl) {
            const res = await fetch(fileObj.dataUrl);
            const blob = await res.blob();
            await saveFileToDB(id, blob);
            restoredUrlMap[id] = URL.createObjectURL(blob);
          }
        }
      }

      if (parsed.moodId) setMoodId(parsed.moodId);
      setShows(parsed.shows);
      setMediaList(
        parsed.mediaList.map((m) =>
          restoredUrlMap[m.id] ? { ...m, fileUrl: restoredUrlMap[m.id], hasSavedFile: true } : m
        )
      );
      setBackupStatusMsg(`✅ 복원 완료! 일정 ${parsed.shows.length}건, 자료 ${parsed.mediaList.length}개를 불러왔습니다.`);
    } catch (err) {
      setBackupStatusMsg('⚠️ 백업 파일을 읽을 수 없습니다. 정상적인 백업(.json) 파일인지 확인해 주세요.');
    } finally {
      setIsBackingUp(false);
      e.target.value = '';
      setTimeout(() => setBackupStatusMsg(''), 5000);
    }
  };

  // 날짜 포맷 도우미
  const formatDateKorean = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return '오늘 공연';
    const d = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
  };

  // 다가오는 공연 정렬
  const sortedShows = [...shows].sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
  const nextShow = sortedShows[0];

  // 미디어 필터링
  const filteredMedia = mediaList.filter(m => {
    const matchesType = mediaFilter === 'all' || m.type === mediaFilter;
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans text-slate-900">
      {/* PC와 모바일 모두에 최적화된 반응형 앱 컨테이너 (모바일 100%, 태블릿/PC 최대 960px 확장) */}
      <div className="w-full max-w-[960px] bg-slate-50 min-h-screen shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* 상단 헤더 */}
        <header className={`bg-gradient-to-r ${currentMood.headerBg} text-white px-5 md:px-8 pt-5 pb-6 rounded-b-3xl shadow-md z-10 transition-colors duration-300`}>
          {/* 상단 기분 선택 툴 (10가지 기분 테마) */}
          <div className="flex items-center justify-between gap-2 mb-3.5 bg-black/20 backdrop-blur-xs px-3 py-2 rounded-2xl">
            <span className="text-xs sm:text-sm font-extrabold text-white shrink-0 pl-1">
              기분: {currentMood.label}
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {MOOD_THEMES.map((mood) => {
                const isSelected = mood.id === moodId;
                return (
                  <button
                    key={mood.id}
                    onClick={() => setMoodId(mood.id)}
                    title={mood.label}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base shrink-0 transition-all ${
                      isSelected 
                        ? 'bg-white scale-110 shadow-sm ring-2 ring-white/80' 
                        : 'bg-white/25 hover:bg-white/45 opacity-85 hover:opacity-100'
                    }`}
                  >
                    {mood.emoji}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between items-center gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-black/25 backdrop-blur-xs px-3 py-1 rounded-full text-white text-xs sm:text-sm font-extrabold tracking-wide mb-2 shadow-2xs">
                <Sparkles className="w-4 h-4 text-yellow-200" />
                <span>키즈 아티스트 전용 매니저</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] flex items-center gap-2">
                <span>{currentMood.greeting}</span>
                <span className="drop-shadow-none">{currentMood.emoji}</span>
              </h1>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-white/25 hover:bg-white/35 border border-white/40 active:scale-95 transition backdrop-blur-sm px-3.5 py-3 rounded-2xl flex items-center gap-1.5 text-sm sm:text-base font-black shadow-sm shrink-0"
            >
              <Plus className="w-5 h-5 stroke-[2.8]" />
              <span>일정추가</span>
            </button>
          </div>
        </header>

        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 pt-5 pb-36 space-y-6">
          
          {/* 1. 홈 (대시보드) 탭 */}
          {activeTab === 'home' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              {/* 다가오는 가장 빠른 공연 하이라이트 카드 */}
              {nextShow ? (
                <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-orange-100">
                  <div className="flex justify-between items-center gap-2 mb-3.5">
                    <span className="px-3.5 py-1.5 bg-rose-100 text-rose-700 text-xs sm:text-sm font-black rounded-full">
                      {formatDateKorean(nextShow.date)} • {nextShow.time}
                    </span>
                    <button 
                      onClick={() => setSelectedShow(nextShow)}
                      className={`px-4 py-2 bg-gradient-to-r ${currentMood.btnBg} text-white text-xs sm:text-sm font-black rounded-full flex items-center gap-1 shadow-sm hover:opacity-95 active:scale-95 transition shrink-0`}
                    >
                      <span>현장 큐시트 열기</span>
                      <ChevronRight className="w-4 h-4 stroke-[2.8]" />
                    </button>
                  </div>
                  
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1.5 leading-snug">{nextShow.title}</h2>
                  <div className="flex items-center gap-1.5 text-slate-700 text-sm sm:text-base font-bold mb-4">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 shrink-0" />
                    <span className="truncate">{nextShow.venue}</span>
                  </div>

                  {/* 이 공연에 연결된 음원/영상 바로 실행 퀵바 */}
                  <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200/80">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-extrabold text-amber-900 flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-amber-600" />
                        바로 쓰는 공연 자료 ({nextShow.mediaIds.length}개)
                      </span>
                      <button 
                        onClick={() => setSelectedShow(nextShow)}
                        className="text-xs sm:text-sm text-amber-800 font-extrabold underline"
                      >
                        전체/편집
                      </button>
                    </div>
                    
                    <div className="space-y-2.5">
                      {nextShow.mediaIds.length === 0 ? (
                        <p className="text-sm font-semibold text-slate-500 text-center py-2">연결된 음악/영상이 없습니다.</p>
                      ) : (
                        nextShow.mediaIds.slice(0, 3).map(mId => {
                          const media = mediaList.find(m => m.id === mId);
                          if (!media) return null;
                          const isPlaying = playingMediaId === media.id;
                          return (
                            <div key={media.id} className="bg-white p-3 rounded-xl flex items-center justify-between shadow-xs border border-amber-100/60">
                              <div className="flex items-center gap-3 min-w-0">
                                <MediaIcon type={media.type} />
                                <div className="truncate">
                                  <p className="text-sm font-extrabold text-slate-900 truncate">{media.title}</p>
                                  <p className="text-xs font-bold text-slate-500">{media.category}</p>
                                </div>
                              </div>
                              {media.type === 'audio' ? (
                                <button
                                  onClick={() => togglePlayAudio(media)}
                                  className={`p-2.5 rounded-full shrink-0 transition ${
                                    isPlaying ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  }`}
                                >
                                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSelectedShow(nextShow)}
                                  className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-extrabold shrink-0"
                                >
                                  보기
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </section>
              ) : (
                <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
                  <p className="text-slate-600 text-base font-bold mb-3">예정된 공연 일정이 없습니다.</p>
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-base font-extrabold"
                  >
                    첫 공연 등록하기
                  </button>
                </div>
              )}

              <div className="space-y-5">
                {/* 준비물 빠른 체크리스트 */}
                {nextShow && (
                  <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-3.5">
                      <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        출발 전 챙길 것 ({nextShow.checklist.filter(c => c.done).length}/{nextShow.checklist.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {nextShow.checklist.map(item => (
                        <button
                          key={item.id}
                          onClick={() => toggleChecklist(nextShow.id, item.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition text-left"
                        >
                          {item.done ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-400 shrink-0" />
                          )}
                          <span className={`text-base ${item.done ? 'line-through text-slate-400 font-semibold' : 'text-slate-900 font-bold'}`}>
                            {item.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* 자주 찾는 자료함 바로가기 */}
                <section>
                  <div className="flex justify-between items-center mb-3 px-1">
                    <h3 className="font-black text-slate-900 text-base sm:text-lg">자료 보관함 바로가기</h3>
                    <button onClick={() => setActiveTab('media')} className="text-xs sm:text-sm text-slate-600 font-extrabold underline">전체보기</button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => { setMediaFilter('audio'); setActiveTab('media'); }}
                      className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition"
                    >
                      <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                        <Music className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-extrabold text-slate-900">음악/효과음</span>
                      <span className="text-xs font-bold text-slate-600">{mediaList.filter(m => m.type === 'audio').length}개</span>
                    </button>
                    <button 
                      onClick={() => { setMediaFilter('video'); setActiveTab('media'); }}
                      className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition"
                    >
                      <div className="w-11 h-11 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                        <Video className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-extrabold text-slate-900">배경/율동영상</span>
                      <span className="text-xs font-bold text-slate-600">{mediaList.filter(m => m.type === 'video').length}개</span>
                    </button>
                    <button 
                      onClick={() => { setMediaFilter('image'); setActiveTab('media'); }}
                      className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition"
                    >
                      <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-extrabold text-slate-900">사진/시안</span>
                      <span className="text-xs font-bold text-slate-600">{mediaList.filter(m => m.type === 'image').length}개</span>
                    </button>
                  </div>
                </section>

                {/* 샘플 데이터 일괄 지우기 배너 (샘플이 남아있을 때만 표시) */}
                {hasSampleData && (
                  <section className="bg-slate-200/80 rounded-2xl p-4 flex items-center justify-between gap-2.5 border border-slate-300/80">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-800">예시 일정과 샘플 자료가 들어있어요</p>
                      <p className="text-xs font-semibold text-slate-600 truncate">직접 등록한 자료는 유지되고 샘플만 지워집니다.</p>
                    </div>
                    {!confirmClearSamples ? (
                      <button
                        onClick={() => setConfirmClearSamples(true)}
                        className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs sm:text-sm font-black shrink-0 active:scale-95 transition flex items-center gap-1.5 shadow-2xs"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                        <span>샘플 일괄 지우기</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={handleClearSamples}
                          className="px-3.5 py-2 bg-rose-600 text-white rounded-xl text-xs sm:text-sm font-black active:scale-95 transition shadow-xs"
                        >
                          초기화 확인
                        </button>
                        <button
                          onClick={() => setConfirmClearSamples(false)}
                          className="px-3 py-2 bg-white text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold"
                        >
                          취소
                        </button>
                      </div>
                    )}
                  </section>
                )}

                {/* 기기 간 이동용 전체 데이터 백업 & 복원 카드 */}
                <section className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/90 space-y-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                      💾 데이터 백업 및 PC 이동
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
                      로그인 없이 기기에 저장되므로, PC로 옮기거나 폰을 바꿀 때 백업 파일로 내보내고 불러오세요.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={handleExportBackup}
                      disabled={isBackingUp}
                      className="py-3 px-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition disabled:opacity-50"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span>백업 파일 저장</span>
                    </button>

                    <label className="py-3 px-3.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition">
                      <HardDriveUpload className="w-4 h-4 shrink-0" />
                      <span>백업 불러오기</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleImportBackup}
                        disabled={isBackingUp}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {backupStatusMsg && (
                    <p className="text-xs sm:text-sm font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl">
                      {backupStatusMsg}
                    </p>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* 2. 전체 공연 일정 탭 */}
          {activeTab === 'schedule' && (
            <section className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h2 className="font-black text-slate-900 text-lg sm:text-xl">전체 공연 일정 ({sortedShows.length})</h2>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="text-sm font-extrabold text-orange-600 bg-orange-100/80 px-4 py-2 rounded-full"
                >
                  + 새 일정
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {sortedShows.map(show => (
                  <div 
                    key={show.id} 
                    onClick={() => setSelectedShow(show)}
                    className="bg-white p-4.5 sm:p-5 rounded-2xl shadow-xs border border-slate-200/80 active:scale-[0.99] transition cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2.5">
                      <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs sm:text-sm font-black rounded-lg">
                        {formatDateKorean(show.date)} {show.time}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-600 font-bold">
                        자료 {show.mediaIds.length}개 연결됨
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 text-lg mb-1.5">{show.title}</h3>
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-2.5">
                      <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                      {show.venue}
                    </p>
                    {show.notes && (
                      <p className="text-xs sm:text-sm font-semibold bg-slate-100 text-slate-800 p-2.5 rounded-xl line-clamp-1">
                        📝 {show.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. 자료 보관함 (음악, 영상, 사진 통합 관리) 탭 */}
          {activeTab === 'media' && (
            <section className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h2 className="font-black text-slate-900 text-lg sm:text-xl">공연 자료 보관함</h2>
                <button 
                  onClick={() => {
                    setDefaultMediaType(mediaFilter === 'all' ? 'audio' : mediaFilter);
                    setMediaAddModal(true);
                  }}
                  className="bg-orange-500 text-white text-sm font-black px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                >
                  <Plus className="w-4 h-4 stroke-[2.8]" /> 
                  {mediaFilter === 'image' ? '사진 올리기' : mediaFilter === 'video' ? '영상 등록' : mediaFilter === 'audio' ? '음악 등록' : '자료 등록'}
                </button>
              </div>

              {/* 검색창 */}
              <div className="relative">
                <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="곡명, 인형극, 마술 등 키워드 검색..."
                  className="w-full bg-white pl-11 pr-4 py-3 rounded-2xl text-base font-bold text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* 유형 필터 칩 */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: '전체' },
                  { id: 'audio', label: '🎵 음악/효과음' },
                  { id: 'video', label: '🎬 영상' },
                  { id: 'image', label: '🖼️ 사진/시안' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setMediaFilter(tab.id)}
                    className={`px-4 py-2 rounded-full text-sm font-extrabold whitespace-nowrap transition ${
                      mediaFilter === tab.id 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-white text-slate-700 border border-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 자료 리스트 (PC 2열 / 모바일 1열 반응형) */}
              {filteredMedia.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs">
                  <p className="text-base font-extrabold text-slate-700 mb-1">등록된 자료가 없습니다.</p>
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 mb-4">
                    우측 상단 버튼을 눌러 음악, 영상, 사진을 등록해 보세요.
                  </p>
                  <button
                    onClick={() => {
                      setDefaultMediaType(mediaFilter === 'all' ? 'audio' : mediaFilter);
                      setMediaAddModal(true);
                    }}
                    className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-black inline-flex items-center gap-1.5 shadow-xs active:scale-95 transition"
                  >
                    <Plus className="w-4 h-4 stroke-[2.8]" />
                    <span>{mediaFilter === 'image' ? '첫 사진 올리기' : '첫 자료 등록하기'}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredMedia.map(media => {
                    const isPlaying = playingMediaId === media.id;
                    return (
                      <div key={media.id} className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <MediaIcon type={media.type} large />
                            <div className="min-w-0">
                              <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-800 text-xs font-extrabold rounded-md mb-1">
                                {media.category}
                              </span>
                              <h4 className="font-black text-slate-900 text-base truncate">{media.title}</h4>
                              {media.memo && (
                                <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5 line-clamp-2">{media.memo}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {media.type === 'audio' && (
                              <button
                                onClick={() => togglePlayAudio(media)}
                                className={`p-3 rounded-full transition ${
                                  isPlaying ? 'bg-rose-500 text-white animate-pulse' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                }`}
                              >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </button>
                            )}
                            {media.type === 'video' && (media.fileUrl || media.url) && (
                              <a
                                href={media.fileUrl || media.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-3 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => deleteMedia(media.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 transition"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* 사진 타입 미리보기 영역 */}
                        {media.type === 'image' && (
                          <div className="mt-3 rounded-xl overflow-hidden border border-slate-200">
                            {media.fileUrl ? (
                              <img src={media.fileUrl} alt={media.title} className="w-full h-40 object-cover" />
                            ) : (
                              <div className={`w-full h-24 bg-gradient-to-r ${media.color || 'from-amber-100 to-orange-100'} flex items-center justify-center text-slate-800 text-xs sm:text-sm font-extrabold`}>
                                🖼️ {media.title}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </main>

        {/* 하단 네비게이션 바 (시원하고 큼직한 터치 영역 & 고시인성 디자인) */}
        <nav className={`fixed bottom-0 w-full max-w-[960px] bg-gradient-to-r ${currentMood.navBg} border-t-2 border-slate-300/90 px-3 sm:px-6 py-3.5 sm:py-4 flex justify-around items-center gap-2 z-20 shadow-[0_-6px_16px_rgba(0,0,0,0.08)] transition-colors duration-300`}>
          <button 
            onClick={() => { setSelectedShow(null); setActiveTab('home'); }}
            className={`flex-1 max-w-[260px] flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 py-3 sm:py-3.5 px-3 sm:px-6 rounded-2xl transition-all ${
              activeTab === 'home' && !selectedShow 
                ? `bg-gradient-to-r ${currentMood.btnBg} text-white font-black shadow-md scale-[1.03]` 
                : 'text-slate-800 font-extrabold hover:bg-white/60 hover:text-slate-950'
            }`}
          >
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.4]" />
            <span className="text-sm sm:text-lg tracking-tight">오늘의 무대</span>
          </button>
          <button 
            onClick={() => { setSelectedShow(null); setActiveTab('schedule'); }}
            className={`flex-1 max-w-[260px] flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 py-3 sm:py-3.5 px-3 sm:px-6 rounded-2xl transition-all ${
              activeTab === 'schedule' && !selectedShow 
                ? `bg-gradient-to-r ${currentMood.btnBg} text-white font-black shadow-md scale-[1.03]` 
                : 'text-slate-800 font-extrabold hover:bg-white/60 hover:text-slate-950'
            }`}
          >
            <CalendarIcon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.4]" />
            <span className="text-sm sm:text-lg tracking-tight">공연 일정</span>
          </button>
          <button 
            onClick={() => { setSelectedShow(null); setActiveTab('media'); }}
            className={`flex-1 max-w-[260px] flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 py-3 sm:py-3.5 px-3 sm:px-6 rounded-2xl transition-all ${
              activeTab === 'media' && !selectedShow 
                ? `bg-gradient-to-r ${currentMood.btnBg} text-white font-black shadow-md scale-[1.03]` 
                : 'text-slate-800 font-extrabold hover:bg-white/60 hover:text-slate-950'
            }`}
          >
            <FolderOpen className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.4]" />
            <span className="text-sm sm:text-lg tracking-tight">자료 보관함</span>
          </button>
        </nav>

        {/* =====================================================================
            모달 1: 공연 상세 및 현장 큐시트 모드 (가장 핵심 기능!)
            공연장에 도착해서 이 화면 하나만 띄워놓고 음악/영상/체크리스트를 다 해결
           ===================================================================== */}
        {selectedShow && (
          <ShowDetailSheet 
            show={selectedShow}
            mediaList={mediaList}
            playingMediaId={playingMediaId}
            onClose={() => { stopAudio(); setSelectedShow(null); }}
            onTogglePlay={togglePlayAudio}
            onToggleChecklist={(checkId) => toggleChecklist(selectedShow.id, checkId)}
            onAddChecklist={(text) => addChecklistItem(selectedShow.id, text)}
            onToggleMedia={(mediaId) => toggleShowMedia(selectedShow.id, mediaId)}
            onDeleteShow={() => deleteShow(selectedShow.id)}
          />
        )}

        {/* 모달 2: 새 공연 일정 추가 */}
        {showAddModal && (
          <AddShowModal 
            mediaList={mediaList}
            onAddMedia={(newMedia) => setMediaList(prev => [newMedia, ...prev])}
            onClose={() => setShowAddModal(false)}
            onSave={(newShowOrList) => {
              const items = Array.isArray(newShowOrList) ? newShowOrList : [newShowOrList];
              setShows(prev => [...prev, ...items]);
              setShowAddModal(false);
              if (items.length > 1) {
                setActiveTab('schedule');
              }
            }}
          />
        )}

        {/* 모달 3: 새 자료(음악/영상/사진) 등록 */}
        {mediaAddModal && (
          <AddMediaModal 
            initialType={defaultMediaType}
            onClose={() => setMediaAddModal(false)}
            onSave={(newMedia) => {
              setMediaList(prev => [newMedia, ...prev]);
              setMediaAddModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

// 미디어 타입별 아이콘 컴포넌트
function MediaIcon({ type, large = false }) {
  const sizeClass = large ? 'w-10 h-10 rounded-2xl' : 'w-8 h-8 rounded-xl';
  const iconSize = large ? 'w-5 h-5' : 'w-4 h-4';

  if (type === 'audio') {
    return (
      <div className={`${sizeClass} bg-rose-100 text-rose-500 flex items-center justify-center shrink-0`}>
        <Music className={iconSize} />
      </div>
    );
  }
  if (type === 'video') {
    return (
      <div className={`${sizeClass} bg-sky-100 text-sky-500 flex items-center justify-center shrink-0`}>
        <Video className={iconSize} />
      </div>
    );
  }
  return (
    <div className={`${sizeClass} bg-amber-100 text-amber-600 flex items-center justify-center shrink-0`}>
      <ImageIcon className={iconSize} />
    </div>
  );
}

// 현장 큐시트 & 공연 상세 슬라이드 뷰
function ShowDetailSheet({ 
  show, 
  mediaList, 
  playingMediaId, 
  onClose, 
  onTogglePlay, 
  onToggleChecklist, 
  onAddChecklist,
  onToggleMedia,
  onDeleteShow
}) {
  const [newCheckText, setNewCheckText] = useState('');
  const [isEditingMedia, setIsEditingMedia] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // 장소명에서 괄호 안의 층수/세부위치(예: "(2층)")를 제외한 순수 목적지명 추출하여 길찾기 검색 정확도 향상
  const cleanDestination = show.venue.replace(/\([^)]*\)/g, '').trim() || show.venue;
  const encodedDest = encodeURIComponent(cleanDestination);

  const attachedMedia = show.mediaIds
    .map(id => mediaList.find(m => m.id === id))
    .filter(Boolean);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 flex justify-center">
      <div className="w-full max-w-[760px] bg-slate-50 h-full flex flex-col animate-in slide-in-from-bottom duration-200 shadow-2xl">
        
        {/* 상단 바 */}
        <div className="bg-white px-5 py-4 border-b border-slate-200 flex justify-between items-center">
          <button onClick={onClose} className="p-2 -ml-2 text-slate-700 hover:text-slate-950 flex items-center gap-1 font-black text-base">
            <X className="w-5 h-5 stroke-[2.5]" /> 닫기
          </button>
          <span className="text-sm font-black text-orange-600 bg-orange-100 px-3.5 py-1 rounded-full">
            현장 공연 큐시트
          </span>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="p-2 text-slate-500 hover:text-rose-600">
              <Trash2 className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={onDeleteShow} className="text-xs sm:text-sm bg-rose-600 text-white px-3 py-1.5 rounded-lg font-black">
              삭제확인
            </button>
          )}
        </div>

        {/* 스크롤 본문 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 pb-14">
          {/* 기본 정보 카드 */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-slate-200/80">
            <div className="flex items-center gap-2 text-sm font-black text-orange-600 mb-1.5">
              <Clock className="w-4 h-4" />
              <span>{show.date} • {show.time}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-3">{show.title}</h2>
            
            <div className="space-y-2 text-base font-bold text-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500 shrink-0" />
                <span>{show.venue}</span>
              </div>
              {show.contact && (
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-sky-600 shrink-0" />
                  <a href={`tel:${show.contact}`} className="text-sky-700 font-extrabold underline">
                    {show.contact} (담당자 전화걸기)
                  </a>
                </div>
              )}

              {/* 내비게이션 바로가기 버튼 영역 */}
              <div className="pt-2 flex items-start gap-2">
                <Navigation className="w-5 h-5 text-emerald-600 shrink-0 mt-1.5" />
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://map.naver.com/v5/search/${encodedDest}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs sm:text-sm font-extrabold flex items-center gap-1 transition active:scale-95"
                  >
                    <span>네이버지도 길찾기</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://map.kakao.com/link/search/${encodedDest}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs sm:text-sm font-extrabold flex items-center gap-1 transition active:scale-95"
                  >
                    <span>카카오맵/내비</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodedDest}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs sm:text-sm font-extrabold flex items-center gap-1 transition active:scale-95"
                  >
                    <span>구글지도</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {show.notes && (
              <div className="mt-4 bg-amber-50 p-4 rounded-2xl text-sm font-bold text-amber-950 leading-relaxed border border-amber-200">
                <span className="font-black block mb-1 text-amber-900">📌 현장 특이사항 메모</span>
                {show.notes}
              </div>
            )}
          </div>

          {/* 핵심 섹션: 이 공연에서 쓸 음악 / 영상 / 사진 큐시트 */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-orange-200">
            <div className="flex justify-between items-center gap-2 mb-3.5">
              <div>
                <h3 className="font-black text-slate-900 text-lg">🎵 공연 사용 자료 ({attachedMedia.length})</h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-600">터치하면 현장에서 바로 재생하거나 볼 수 있어요</p>
              </div>
              <button 
                onClick={() => setIsEditingMedia(!isEditingMedia)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition shrink-0 ${
                  isEditingMedia ? 'bg-slate-900 text-white' : 'bg-orange-100 text-orange-800'
                }`}
              >
                {isEditingMedia ? '선택 완료' : '+ 자료 연결/편집'}
              </button>
            </div>

            {/* 자료 연결 편집 모드 */}
            {isEditingMedia ? (
              <div className="bg-slate-50 p-3.5 rounded-2xl space-y-2 border border-slate-200">
                <p className="text-sm font-extrabold text-slate-800 mb-2">이 공연에 사용할 자료를 체크하세요:</p>
                {mediaList.map(m => {
                  const isLinked = show.mediaIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => onToggleMedia(m.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                        isLinked ? 'bg-orange-50 border-orange-400' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <MediaIcon type={m.type} />
                        <div className="truncate">
                          <p className="text-sm font-extrabold text-slate-900 truncate">{m.title}</p>
                          <p className="text-xs font-bold text-slate-500">{m.category}</p>
                        </div>
                      </div>
                      {isLinked ? (
                        <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* 현장 실행 리스트 */
              <div className="space-y-3">
                {attachedMedia.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl">
                    <p className="text-sm font-bold text-slate-500 mb-2">아직 연결된 음악이나 영상이 없어요.</p>
                    <button 
                      onClick={() => setIsEditingMedia(true)}
                      className="text-sm font-black text-orange-600 underline"
                    >
                      보관함에서 자료 가져오기
                    </button>
                  </div>
                ) : (
                  attachedMedia.map((media, idx) => {
                    const isPlaying = playingMediaId === media.id;
                    return (
                      <div key={media.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <MediaIcon type={media.type} />
                            <div className="min-w-0">
                              <h4 className="font-black text-slate-900 text-base truncate">{media.title}</h4>
                              <p className="text-xs sm:text-sm font-semibold text-slate-600 truncate">{media.memo || media.category}</p>
                            </div>
                          </div>

                          {media.type === 'audio' && (
                            <button
                              onClick={() => onTogglePlay(media)}
                              className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 shrink-0 transition ${
                                isPlaying 
                                  ? 'bg-rose-600 text-white shadow-md animate-pulse' 
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                            >
                              {isPlaying ? (
                                <>
                                  <Pause className="w-4 h-4" /> 정지
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4" /> 재생
                                </>
                              )}
                            </button>
                          )}

                          {media.type === 'video' && (media.fileUrl || media.url) && (
                            <a
                              href={media.fileUrl || media.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2.5 rounded-xl bg-sky-600 text-white font-black text-xs sm:text-sm flex items-center gap-1 shrink-0"
                            >
                              <Play className="w-4 h-4" /> 열기
                            </a>
                          )}
                        </div>

                        {media.type === 'video' && media.fileUrl && (
                          <div className="mt-3 rounded-xl overflow-hidden bg-black">
                            <video src={media.fileUrl} controls playsInline className="w-full max-h-56" />
                          </div>
                        )}

                        {media.type === 'image' && (
                          <div className="mt-3 rounded-xl overflow-hidden">
                            {media.fileUrl ? (
                              <img src={media.fileUrl} alt={media.title} className="w-full h-44 object-cover" />
                            ) : (
                              <div className={`w-full h-24 bg-gradient-to-r ${media.color || 'from-amber-100 to-orange-100'} flex items-center justify-center text-sm font-extrabold text-slate-800`}>
                                🖼️ {media.title}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* 준비물 체크리스트 */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-slate-200/80">
            <h3 className="font-black text-slate-900 text-lg mb-3">🎒 소품 & 준비물 체크</h3>
            <div className="space-y-2 mb-3.5">
              {show.checklist.map(item => (
                <button
                  key={item.id}
                  onClick={() => onToggleChecklist(item.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-left transition"
                >
                  {item.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                  <span className={`text-base ${item.done ? 'line-through text-slate-400 font-semibold' : 'text-slate-900 font-bold'}`}>
                    {item.text}
                  </span>
                </button>
              ))}
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                onAddChecklist(newCheckText);
                setNewCheckText('');
              }}
              className="flex gap-2"
            >
              <input 
                type="text"
                value={newCheckText}
                onChange={(e) => setNewCheckText(e.target.value)}
                placeholder="추가할 준비물 입력..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-900 focus:outline-none focus:border-orange-500"
              />
              <button type="submit" className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-black shrink-0">
                추가
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// 새 공연 일정 추가 모달
function AddShowModal({ mediaList, onAddMedia, onClose, onSave }) {
  const [entryMode, setEntryMode] = useState('manual'); // 'manual' | 'import'
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:30');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedMediaIds, setSelectedMediaIds] = useState([]);

  // 이미지 / 엑셀(CSV) 자동 인식 상태
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsedShows, setParsedShows] = useState([]);

  // 직접 자료 추가 입력 상태
  const [isAddingCustomMedia, setIsAddingCustomMedia] = useState(false);
  const [customType, setCustomType] = useState('audio');
  const [customTitle, setCustomTitle] = useState('');
  const [customMemo, setCustomMemo] = useState('');

  // Gemini API 호출 (지수 백오프 적용)
  const callGeminiWithRetry = async (payload) => {
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    const delays = [1000, 2000, 4000];
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        if (attempt === delays.length) throw err;
        await new Promise(res => setTimeout(res, delays[attempt]));
      }
    }
  };

  // 첨부된 일정표 이미지 또는 엑셀(CSV/텍스트) 자동 분석 핸들러
  const handleScheduleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseError('');
    setParsedShows([]);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const currentYear = new Date().getFullYear();
      const promptText = `첨부된 공연 일정표(이미지 또는 표/텍스트 데이터)에서 모든 유치원/어린이집 공연 일정을 추출해 JSON 배열로 반환해 주세요.
오늘 날짜는 ${todayStr}이며, 연도가 생략된 날짜(예: 11/25 또는 11월 25일)는 ${currentYear}년을 기준으로 YYYY-MM-DD 형식으로 변환하세요.
시간은 HH:MM (24시간제, 예: 10:30) 형식으로 변환하고, 오전/오후 표기가 있으면 반영하세요.
장소명만 있고 공연명이 따로 없으면 장소명을 활용해 "장소명 찾아가는 공연" 형태로 title을 채워주세요.`;

      const responseSchema = {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING", description: "공연명 또는 프로그램명" },
            venue: { type: "STRING", description: "유치원, 어린이집, 기관명 등 공연 장소" },
            date: { type: "STRING", description: "YYYY-MM-DD 형식 날짜" },
            time: { type: "STRING", description: "HH:MM 형식 공연 시작 시간" },
            contact: { type: "STRING", description: "담당자 연락처 (없으면 빈 문자열)" },
            notes: { type: "STRING", description: "특이사항, 주차, 대상 연령 등 메모 (없으면 빈 문자열)" }
          },
          required: ["title", "venue", "date", "time"]
        }
      };

      let parts = [{ text: promptText }];

      if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        // 이미지 및 PDF 파일 Base64 변환
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        parts.push({
          inlineData: {
            mimeType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png'),
            data: base64Data
          }
        });
      } else {
        // 엑셀(XLSX/XLS/CSV), 워드(DOCX), 한글(HWPX/HWP), TXT 파일 텍스트 추출
        let extractedText = '';
        const lowerName = file.name.toLowerCase();

        if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
          if (!window.XLSX) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            });
          }
          const arrayBuffer = await file.arrayBuffer();
          const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
          workbook.SheetNames.forEach(sheetName => {
            const csv = window.XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
            extractedText += `[시트: ${sheetName}]\n${csv}\n`;
          });
        } else if (lowerName.endsWith('.docx')) {
          // 워드(.docx) 파일 텍스트 추출 (Mammoth.js 동적 로드)
          if (!window.mammoth) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            });
          }
          const arrayBuffer = await file.arrayBuffer();
          const docResult = await window.mammoth.extractRawText({ arrayBuffer });
          extractedText = docResult.value;
        } else if (lowerName.endsWith('.hwpx')) {
          // 한글 최신 표준 포맷(.hwpx) 내부 XML에서 텍스트 추출 (JSZip 동적 로드)
          if (!window.JSZip) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            });
          }
          const arrayBuffer = await file.arrayBuffer();
          const zip = await window.JSZip.loadAsync(arrayBuffer);
          const sectionFiles = Object.keys(zip.files)
            .filter(name => name.startsWith('Contents/section') && name.endsWith('.xml'))
            .sort();
          for (const secName of sectionFiles) {
            const xmlStr = await zip.files[secName].async('text');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
            const textNodes = xmlDoc.getElementsByTagNameNS('*', 't');
            const lines = [];
            for (let i = 0; i < textNodes.length; i++) {
              if (textNodes[i].textContent) lines.push(textNodes[i].textContent);
            }
            extractedText += lines.join(' ') + '\n';
          }
        } else if (lowerName.endsWith('.hwp')) {
          // 구형 한글 바이너리(.hwp)는 브라우저에서 직접 해독이 제한되므로 안내 또는 텍스트 추출 시도
          throw new Error('HWP_BINARY_FORMAT');
        } else {
          extractedText = await file.text();
        }

        if (!extractedText || !extractedText.trim()) {
          throw new Error('EMPTY_DOCUMENT');
        }
        parts.push({ text: `일정표 문서 내용:\n${extractedText}` });
      }

      const result = await callGeminiWithRetry({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema
        }
      });

      const rawJson = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) throw new Error('일정 내용을 인식하지 못했습니다.');

      const items = JSON.parse(rawJson);
      if (!Array.isArray(items) || items.length === 0) {
        setParseError('파일에서 공연 일정을 찾지 못했습니다. 글자가 선명한 이미지나 표 파일인지 확인해 주세요.');
      } else {
        setParsedShows(items.map((item, idx) => ({
          id: `show-${Date.now()}-${idx}`,
          title: item.title || `${item.venue || '어린이'} 공연`,
          venue: item.venue || '장소 미지정',
          date: item.date || todayStr,
          time: item.time || '10:30',
          contact: item.contact || '',
          notes: item.notes || '',
          selected: true
        })));
      }
    } catch (err) {
      if (err?.message === 'HWP_BINARY_FORMAT') {
        setParseError('구버전 한글(.hwp) 파일은 브라우저 보안상 직접 읽기가 어렵습니다. 한글 프로그램에서 [다른 이름으로 저장 → .hwpx 또는 .pdf]로 저장하시거나, 화면을 캡처한 이미지를 올려주세요!');
      } else {
        setParseError('일정표를 분석하는 중 문제가 발생했습니다. 파일 형식을 확인하거나 다시 시도해 주세요.');
      }
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveParsedShows = () => {
    const selectedItems = parsedShows.filter(item => item.selected);
    if (selectedItems.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const formattedShows = selectedItems.map((item, idx) => {
      // "2026-06 02" 등 공백/점/슬래시가 섞인 날짜를 "YYYY-MM-DD" 표준 형식으로 자동 정규화
      const digits = (item.date || '').replace(/[^0-9]/g, '');
      const normalizedDate =
        digits.length >= 8
          ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
          : todayStr;

      return {
        id: `show-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        title: String(item.title || '공연 일정'),
        venue: String(item.venue || '장소 미지정'),
        date: normalizedDate,
        time: String(item.time || '10:30'),
        contact: String(item.contact || ''),
        notes: String(item.notes || ''),
        checklist: [
          { id: `c-${Date.now()}-${idx}-1`, text: '음향 장비 및 케이블 확인', done: false },
          { id: `c-${Date.now()}-${idx}-2`, text: '공연 의상 및 주요 소품', done: false }
        ],
        mediaIds: [...selectedMediaIds]
      };
    });

    onSave(formattedShows);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !venue.trim()) return;
    onSave({
      id: `show-${Date.now()}`,
      title,
      venue,
      date,
      time,
      contact,
      notes,
      checklist: [
        { id: `c-${Date.now()}-1`, text: '음향 장비 및 케이블 확인', done: false },
        { id: `c-${Date.now()}-2`, text: '공연 의상 및 주요 소품', done: false }
      ],
      mediaIds: selectedMediaIds
    });
  };

  const toggleSelectMedia = (id) => {
    setSelectedMediaIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // 일정 등록 화면에서 바로 새 자료 생성 및 자동 선택
  const handleQuickAddMedia = () => {
    if (!customTitle.trim()) return;
    const newId = `m-${Date.now()}`;
    const newMedia = {
      id: newId,
      title: customTitle.trim(),
      type: customType,
      category: title.trim() || '신규 공연',
      memo: customMemo.trim(),
      freq: 523.25
    };
    onAddMedia(newMedia);
    setSelectedMediaIds(prev => [newId, ...prev]);
    setCustomTitle('');
    setCustomMemo('');
    setIsAddingCustomMedia(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 flex items-end sm:items-center justify-center">
      <div className="w-full max-w-[560px] bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-black text-slate-900 text-lg">새 공연 일정 등록</h3>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-900"><X className="w-6 h-6" /></button>
        </div>

        {/* 직접 입력 vs 이미지/엑셀 자동등록 탭 전환 */}
        <div className="px-5 pt-3 bg-slate-50 border-b border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() => setEntryMode('manual')}
            className={`flex-1 py-2.5 rounded-t-xl text-sm font-black border-b-2 transition ${
              entryMode === 'manual'
                ? 'bg-white text-orange-600 border-orange-500'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            ✏️ 직접 하나씩 입력
          </button>
          <button
            type="button"
            onClick={() => setEntryMode('import')}
            className={`flex-1 py-2.5 rounded-t-xl text-sm font-black border-b-2 flex items-center justify-center gap-1.5 transition ${
              entryMode === 'import'
                ? 'bg-white text-orange-600 border-orange-500'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>파일·이미지 자동등록</span>
          </button>
        </div>

        {entryMode === 'import' ? (
          <>
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* 파일 첨부 영역 */}
              <label className="block border-2 border-dashed border-orange-300 bg-orange-50/60 hover:bg-orange-50 rounded-2xl p-5 text-center cursor-pointer transition">
                <input
                  type="file"
                  accept="image/*,.xlsx,.xls,.csv,.docx,.hwpx,.hwp,.pdf,.txt"
                  onChange={handleScheduleFileUpload}
                  className="hidden"
                  disabled={isParsing}
                />
                <div className="flex justify-center gap-2 mb-2">
                  <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-base font-black text-slate-900">
                  이미지 · 엑셀 · 워드 · 한글(.hwpx) · PDF 선택
                </p>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                  카톡 일정 캡처, 엑셀(.xlsx/.csv), 워드(.docx), 한글(.hwpx), PDF 파일을 올리면 AI가 날짜·장소·시간을 자동으로 읽어옵니다.
                </p>
              </label>

              {/* 분석 중 로딩 표시 */}
              {isParsing && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center space-y-2">
                  <Loader2 className="w-7 h-7 text-orange-500 animate-spin mx-auto" />
                  <p className="text-base font-black text-slate-900">AI가 일정표 내용을 읽고 있어요...</p>
                  <p className="text-xs sm:text-sm font-semibold text-slate-600">잠시만 기다려 주세요 (약 3~5초 소요)</p>
                </div>
              )}

              {/* 에러 안내 */}
              {parseError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-sm font-bold">
                  ⚠️ {parseError}
                </div>
              )}

              {/* 추출된 일정 목록 미리보기 & 선택 */}
              {parsedShows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-base font-black text-slate-900">
                      인식된 공연 일정 ({parsedShows.filter(s => s.selected).length}/{parsedShows.length}건 선택됨)
                    </h4>
                    <span className="text-xs font-bold text-slate-500">터치해서 선택/해제</span>
                  </div>

                  <div className="space-y-2.5">
                    {parsedShows.map((item, index) => (
                      <div
                        key={item.id}
                        onClick={() =>
                          setParsedShows(prev =>
                            prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
                          )
                        }
                        className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                          item.selected
                            ? 'bg-orange-50/70 border-orange-400'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="inline-block px-2.5 py-0.5 bg-white border border-orange-200 text-orange-700 text-xs font-black rounded-lg mb-1">
                              {item.date} • {item.time}
                            </span>
                            <p className="text-base font-black text-slate-900 truncate">{item.title}</p>
                            <p className="text-sm font-bold text-slate-700 truncate">📍 {item.venue}</p>
                            {item.contact && (
                              <p className="text-xs font-bold text-sky-700 mt-0.5">📞 {item.contact}</p>
                            )}
                            {item.notes && (
                              <p className="text-xs font-semibold text-slate-600 mt-0.5">📝 {item.notes}</p>
                            )}
                          </div>
                          {item.selected ? (
                            <CheckCircle2 className="w-6 h-6 text-orange-600 shrink-0" />
                          ) : (
                            <Circle className="w-6 h-6 text-slate-300 shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 하단 고정 일괄 등록 버튼 */}
            {parsedShows.length > 0 && (
              <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveParsedShows();
                  }}
                  disabled={parsedShows.filter(s => s.selected).length === 0}
                  className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:opacity-95 text-white text-base font-black py-4 rounded-2xl shadow-md active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
                >
                  선택한 {parsedShows.filter(s => s.selected).length}개 일정 한 번에 등록하기
                </button>
              </div>
            )}
          </>
        ) : (
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-sm font-extrabold text-slate-800 mb-1.5">공연명 *</label>
            <input 
              required
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 무지개유치원 신나는 마술공연"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-base font-bold text-slate-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-extrabold text-slate-800 mb-1.5">장소 (유치원/어린이집명) *</label>
            <input 
              required
              type="text" 
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="예: 무지개유치원 3층 강당"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-base font-bold text-slate-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-extrabold text-slate-800 mb-1.5">날짜</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-3 text-sm sm:text-base font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-extrabold text-slate-800 mb-1.5">공연 시간</label>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-3 text-sm sm:text-base font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-extrabold text-slate-800 mb-1.5">담당 선생님 연락처</label>
            <input 
              type="tel" 
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="010-0000-0000"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-base font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-extrabold text-slate-800 mb-1.5">현장 메모 (주차, 마이크 등)</label>
            <textarea 
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="주차 위치나 특이사항을 적어두세요"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-900"
            />
          </div>

          {/* 자료 미리 연결하기 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-extrabold text-slate-800">이 공연에 쓸 음악/영상 미리 묶기</label>
              <button
                type="button"
                onClick={() => setIsAddingCustomMedia(prev => !prev)}
                className="text-xs sm:text-sm font-black text-orange-700 bg-orange-100 hover:bg-orange-200 px-3 py-1.5 rounded-full flex items-center gap-1 transition"
              >
                {isAddingCustomMedia ? <><X className="w-3.5 h-3.5" /> 닫기</> : <><Plus className="w-3.5 h-3.5" /> 직접 추가</>}
              </button>
            </div>

            {/* 직접 항목 추가 폼 */}
            {isAddingCustomMedia && (
              <div className="mb-3 p-3.5 rounded-2xl bg-orange-50 border border-orange-300 space-y-2.5">
                <div className="flex gap-1.5">
                  {[
                    { id: 'audio', label: '🎵 음악' },
                    { id: 'video', label: '🎬 영상' },
                    { id: 'image', label: '🖼️ 사진' }
                  ].map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setCustomType(t.id)}
                      className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-extrabold border transition ${
                        customType === t.id
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleQuickAddMedia();
                    }
                  }}
                  placeholder="추가할 음악/영상/사진 이름 입력..."
                  className="w-full bg-white border border-orange-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customMemo}
                    onChange={(e) => setCustomMemo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleQuickAddMedia();
                      }
                    }}
                    placeholder="간단 메모 (선택사항, 예: 2부 시작곡)"
                    className="flex-1 bg-white border border-orange-300 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddMedia}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-black shrink-0 active:scale-95 transition"
                  >
                    항목 등록
                  </button>
                </div>
              </div>
            )}

            <div className="max-h-40 overflow-y-auto space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              {mediaList.map(m => {
                const checked = selectedMediaIds.includes(m.id);
                const typeEmoji = m.type === 'audio' ? '🎵' : m.type === 'video' ? '🎬' : '🖼️';
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => toggleSelectMedia(m.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm ${
                      checked ? 'bg-orange-100 text-orange-950 font-black' : 'bg-white text-slate-800 font-bold'
                    }`}
                  >
                    <span className="truncate">{typeEmoji} {m.title}</span>
                    <span className="shrink-0 ml-2 text-xs sm:text-sm">{checked ? '✅ 선택됨' : '+ 선택'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white text-base font-black py-4 rounded-2xl shadow-md active:scale-[0.99] transition"
          >
            일정 저장하기
          </button>
        </form>
        )}
      </div>
    </div>
  );
}

// 새 자료(음악/영상/사진) 등록 모달
function AddMediaModal({ initialType = 'audio', onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState(initialType);
  const [category, setCategory] = useState('인형극');
  const [memo, setMemo] = useState('');
  const [url, setUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // 스마트폰 갤러리/파일에서 직접 선택 시 미리보기 및 재생 URL 생성
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFileUrl(objectUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;
    setIsSaving(true);

    const newId = `m-${Date.now()}`;
    if (selectedFile) {
      await saveFileToDB(newId, selectedFile);
    }

    onSave({
      id: newId,
      title,
      type,
      category,
      memo,
      url,
      fileUrl,
      hasSavedFile: Boolean(selectedFile),
      freq: 523.25
    });
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 flex items-end sm:items-center justify-center">
      <div className="w-full max-w-[560px] bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-black text-slate-900 text-lg">자료 보관함에 추가</h3>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-900"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* 자료 종류 선택 */}
          <div>
            <label className="block text-sm font-extrabold text-slate-800 mb-1.5">자료 종류</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'audio', label: '🎵 음악/효과음' },
                { id: 'video', label: '🎬 영상' },
                { id: 'image', label: '🖼️ 사진/시안' }
              ].map(t => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`py-3 rounded-xl text-xs sm:text-sm font-extrabold border transition ${
                    type === t.id ? 'bg-orange-50 border-orange-500 text-orange-800' : 'border-slate-300 text-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 스마트폰 파일 직접 불러오기 */}
          <div>
            <label className="block text-sm font-extrabold text-slate-800 mb-1.5">폰에서 파일 선택 (앱에 영구 저장됨)</label>
            <input 
              type="file" 
              accept={type === 'audio' ? 'audio/*' : type === 'video' ? 'video/*' : 'image/*'}
              onChange={handleFileChange}
              className="w-full text-sm font-bold text-slate-700 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs sm:text-sm file:font-black file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200"
            />
            {selectedFile && (
              <p className="text-xs sm:text-sm text-emerald-700 font-extrabold mt-1.5">
                ✅ '{selectedFile.name}' 파일이 스마트폰 내부에 영구 저장됩니다.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-extrabold text-slate-800 mb-1.5">자료 이름 *</label>
            <input 
              required
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 늑대 등장 긴장감 효과음"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-base font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-extrabold text-slate-800 mb-1.5">공연 프로그램 분류</label>
            <input 
              type="text" 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="예: 인형극, 마술쇼, 공통/오프닝"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-base font-bold text-slate-900"
            />
          </div>

          {type === 'video' && (
            <div>
              <label className="block text-sm font-extrabold text-slate-800 mb-1.5">유튜브 / 클라우드 영상 링크</label>
              <input 
                type="url" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-base font-bold text-slate-900"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-extrabold text-slate-800 mb-1.5">사용 타이밍 메모</label>
            <input 
              type="text" 
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 아이들 박수 유도할 때 재생"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-base font-bold text-slate-900"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-slate-900 text-white text-base font-black py-4 rounded-2xl shadow-md active:scale-[0.99] transition disabled:opacity-50"
          >
            {isSaving ? '파일 저장 중...' : '자료 등록 완료'}
          </button>
        </form>
      </div>
    </div>
  );
}