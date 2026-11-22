import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Phone,
  Plus,
  Calendar as CalendarIcon,
  Volume2,
  CheckCircle2,
  Bell,
} from 'lucide-react';
import { formatReminderLabel } from '../utils/notifications';

interface MoodTheme {
  id: string;
  emoji: string;
  label: string;
  headerBg: string;
  navBg: string;
  btnBg: string;
  accentText: string;
  greeting: string;
}

interface MonthlyCalendarViewProps {
  shows: any[];
  currentMood: MoodTheme;
  onSelectShow: (show: any) => void;
  onAddShowForDate: (dateStr: string) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateStr(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function formatSelectedDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dateObj = new Date(y, m - 1, d);
  const dayLabel = WEEKDAYS[dateObj.getDay()];
  return `${y}년 ${m}월 ${d}일 (${dayLabel})`;
}

export default function MonthlyCalendarView({
  shows,
  currentMood,
  onSelectShow,
  onAddShowForDate,
}: MonthlyCalendarViewProps) {
  const todayObj = new Date();
  const todayStr = toDateStr(
    todayObj.getFullYear(),
    todayObj.getMonth(),
    todayObj.getDate()
  );

  // 초기 선택 날짜: 오늘 일정이 있으면 오늘, 아니면 가장 가까운 다가오는 공연 또는 오늘
  const upcomingSorted = useMemo(() => {
    return [...shows]
      .filter((s) => s.date >= todayStr)
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }, [shows, todayStr]);

  const initialFocusDate = upcomingSorted[0]?.date || todayStr;
  const [initialYear, initialMonth] = initialFocusDate.split('-').map(Number);

  const [viewYear, setViewYear] = useState<number>(
    initialYear || todayObj.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    initialMonth ? initialMonth - 1 : todayObj.getMonth()
  );
  const [selectedDate, setSelectedDate] = useState<string>(initialFocusDate);

  // 날짜별 공연 맵 생성 (시간순 정렬)
  const showsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const show of shows) {
      if (!show?.date) continue;
      if (!map[show.date]) map[show.date] = [];
      map[show.date].push(show);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    }
    return map;
  }, [shows]);

  // 현재 보고 있는 달의 총 공연 건수
  const currentMonthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const currentMonthShows = useMemo(() => {
    return shows
      .filter((s) => typeof s.date === 'string' && s.date.startsWith(currentMonthPrefix))
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }, [shows, currentMonthPrefix]);

  // 월간 6주(또는 5주) 그리드 날짜 셀 계산
  const calendarCells = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthLastDate = new Date(viewYear, viewMonth, 0).getDate();

    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;

    const cells: Array<{
      dateStr: string;
      day: number;
      isCurrentMonth: boolean;
      dayOfWeek: number;
    }> = [];

    // 이전 달 채우기
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDate - i;
      cells.push({
        dateStr: toDateStr(prevYear, prevMonth, day),
        day,
        isCurrentMonth: false,
        dayOfWeek: cells.length % 7,
      });
    }

    // 이번 달 채우기
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        dateStr: toDateStr(viewYear, viewMonth, day),
        day,
        isCurrentMonth: true,
        dayOfWeek: cells.length % 7,
      });
    }

    // 다음 달 채우기 (7의 배수로 맞춤)
    let nextDay = 1;
    while (cells.length % 7 !== 0) {
      cells.push({
        dateStr: toDateStr(nextYear, nextMonth, nextDay),
        day: nextDay,
        isCurrentMonth: false,
        dayOfWeek: cells.length % 7,
      });
      nextDay++;
    }

    return cells;
  }, [viewYear, viewMonth]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setViewYear(todayObj.getFullYear());
    setViewMonth(todayObj.getMonth());
    setSelectedDate(todayStr);
  };

  const handleTapDateCell = (cell: {
    dateStr: string;
    isCurrentMonth: boolean;
  }) => {
    setSelectedDate(cell.dateStr);
    if (!cell.isCurrentMonth) {
      const [y, m] = cell.dateStr.split('-').map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m - 1);
      }
    }
  };

  const selectedDateShows = showsByDate[selectedDate] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* 왼쪽/상단: 월간 달력 카드 */}
      <div className="lg:col-span-7 bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/90">
        {/* 달력 상단 컨트롤 바 */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">
              {viewYear}년 {viewMonth + 1}월
            </h3>
            <span className="text-xs sm:text-sm font-bold text-slate-500 tabular-nums">
              · 공연 {currentMonthShows.length}건
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={goToToday}
              className="px-3 min-h-[40px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-extrabold transition active:scale-95 whitespace-nowrap"
            >
              오늘
            </button>
            <button
              type="button"
              onClick={goToPrevMonth}
              aria-label="이전 달"
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.4]" />
            </button>
            <button
              type="button"
              onClick={goToNextMonth}
              aria-label="다음 달"
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition active:scale-95"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.4]" />
            </button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-1.5 text-center">
          {WEEKDAYS.map((day, idx) => (
            <div
              key={day}
              className={`py-1.5 text-xs sm:text-sm font-black ${
                idx === 0
                  ? 'text-rose-600'
                  : idx === 6
                    ? 'text-sky-600'
                    : 'text-slate-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {calendarCells.map((cell) => {
            const dayShows = showsByDate[cell.dateStr] || [];
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDate;
            const isPast = cell.dateStr < todayStr;
            const hasShows = dayShows.length > 0;

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => handleTapDateCell(cell)}
                aria-label={`${cell.dateStr}${hasShows ? ` 공연 ${dayShows.length}건` : ''}`}
                className={`relative min-h-[58px] sm:min-h-[78px] p-1 sm:p-1.5 rounded-2xl flex flex-col items-center justify-start text-left transition active:scale-[0.97] border ${
                  isSelected
                    ? `bg-gradient-to-br ${currentMood.btnBg} text-white border-transparent shadow-sm`
                    : isToday
                      ? 'bg-amber-50 border-amber-400 text-slate-900'
                      : hasShows
                        ? 'bg-orange-50/70 hover:bg-orange-100/70 border-orange-200 text-slate-900'
                        : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-800'
                } ${!cell.isCurrentMonth && !isSelected ? 'opacity-40' : ''}`}
              >
                {/* 날짜 숫자 */}
                <div className="w-full flex items-center justify-between px-0.5">
                  <span
                    className={`text-xs sm:text-sm font-black tabular-nums leading-none ${
                      isSelected
                        ? 'text-white'
                        : cell.dayOfWeek === 0
                          ? 'text-rose-600'
                          : cell.dayOfWeek === 6
                            ? 'text-sky-600'
                            : 'text-slate-900'
                    }`}
                  >
                    {cell.day}
                  </span>
                  {isToday && !isSelected && (
                    <span className="text-[10px] font-black text-amber-700 leading-none">
                      오늘
                    </span>
                  )}
                </div>

                {/* 해당 날짜의 공연 미리보기 */}
                {hasShows && (
                  <div className="w-full mt-1 sm:mt-1.5 space-y-0.5 overflow-hidden">
                    {/* 모바일: 콤팩트 시간/건수 표시 */}
                    <div className="sm:hidden flex flex-col items-center gap-0.5">
                      <span
                        className={`text-[10px] font-black tabular-nums truncate max-w-full px-1 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-white/25 text-white'
                            : isPast
                              ? 'bg-slate-200/80 text-slate-600'
                              : 'bg-orange-500 text-white'
                        }`}
                      >
                        {dayShows[0].time}
                      </span>
                      {dayShows.length > 1 && (
                        <span
                          className={`text-[10px] font-black tabular-nums leading-none ${
                            isSelected ? 'text-white/95' : 'text-orange-700'
                          }`}
                        >
                          +{dayShows.length - 1}
                        </span>
                      )}
                    </div>

                    {/* 태블릿/PC: 시간 + 공연명 미리보기 */}
                    <div className="hidden sm:flex flex-col gap-0.5 w-full">
                      {dayShows.slice(0, 2).map((s) => (
                        <div
                          key={s.id}
                          className={`w-full px-1.5 py-0.5 rounded-md text-[11px] font-extrabold truncate leading-tight ${
                            isSelected
                              ? 'bg-white/25 text-white'
                              : isPast
                                ? 'bg-slate-200/70 text-slate-600'
                                : 'bg-white text-orange-900 border border-orange-200/80'
                          }`}
                        >
                          <span className="tabular-nums mr-1">{s.time}</span>
                          {s.venue || s.title}
                        </div>
                      ))}
                      {dayShows.length > 2 && (
                        <span
                          className={`text-[10px] font-black px-1 ${
                            isSelected ? 'text-white/90' : 'text-orange-700'
                          }`}
                        >
                          +{dayShows.length - 2}건 더
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 다가오는 일정이 다른 달에 있을 때 빠른 이동 바 */}
        {upcomingSorted.length > 0 &&
          !upcomingSorted[0].date.startsWith(currentMonthPrefix) && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-600 truncate">
                다음 공연: {upcomingSorted[0].date} ({upcomingSorted[0].venue})
              </span>
              <button
                type="button"
                onClick={() => {
                  const [y, m] = upcomingSorted[0].date.split('-').map(Number);
                  if (y && m) {
                    setViewYear(y);
                    setViewMonth(m - 1);
                    setSelectedDate(upcomingSorted[0].date);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-black shrink-0 transition"
              >
                해당 달로 이동
              </button>
            </div>
          )}
      </div>

      {/* 오른쪽/하단: 선택한 날짜의 공연 상세 패널 */}
      <div className="lg:col-span-5 bg-white rounded-3xl p-5 shadow-xs border border-slate-200/90 space-y-4">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <p className="text-xs font-extrabold text-slate-500 flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5 text-orange-500" />
              선택한 날짜 일정
            </p>
            <h4 className="text-base sm:text-lg font-black text-slate-900 tabular-nums mt-0.5">
              {formatSelectedDateLabel(selectedDate)}
            </h4>
          </div>
          <button
            type="button"
            onClick={() => onAddShowForDate(selectedDate)}
            className="px-3.5 min-h-[40px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-black flex items-center gap-1 shrink-0 active:scale-95 transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>이 날 등록</span>
          </button>
        </div>

        {selectedDateShows.length === 0 ? (
          <div className="py-8 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-100 px-4">
            <p className="text-sm sm:text-base font-extrabold text-slate-700">
              이 날짜에 등록된 공연이 없습니다.
            </p>
            <p className="text-xs font-semibold text-slate-500">
              달력에서 공연이 표시된 날짜를 누르거나 새 일정을 등록해 보세요.
            </p>
            <button
              type="button"
              onClick={() => onAddShowForDate(selectedDate)}
              className={`px-4 py-2.5 rounded-xl bg-gradient-to-r ${currentMood.btnBg} text-white text-xs sm:text-sm font-black inline-flex items-center gap-1.5 shadow-xs active:scale-95 transition`}
            >
              <Plus className="w-4 h-4 stroke-[2.6]" />
              <span>이 날짜에 공연 추가하기</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDateShows.map((show) => {
              const doneCount = Array.isArray(show.checklist)
                ? show.checklist.filter((c: any) => c.done).length
                : 0;
              const totalCount = Array.isArray(show.checklist)
                ? show.checklist.length
                : 0;
              const mediaCount = Array.isArray(show.mediaIds)
                ? show.mediaIds.length
                : 0;

              return (
                <div
                  key={show.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-orange-600 tabular-nums mb-1">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>{show.time || '시간 미정'}</span>
                      </div>
                      <h5 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                        {show.title}
                      </h5>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm font-bold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                      <span>{show.venue}</span>
                    </div>
                    {show.contact && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-sky-600 shrink-0" />
                        <a
                          href={`tel:${show.contact}`}
                          className="text-sky-700 underline font-extrabold"
                        >
                          {show.contact}
                        </a>
                      </div>
                    )}
                  </div>

                  {show.notes && (
                    <p className="text-xs sm:text-sm font-semibold text-amber-950 bg-amber-50 border border-amber-200/80 p-3 rounded-xl leading-relaxed">
                      📌 {show.notes}
                    </p>
                  )}

                  {/* 요약 메타 정보 (텍스트 구분자 사용) */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs font-extrabold text-slate-600 tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                      자료 {mediaCount}개
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      준비물 {doneCount}/{totalCount}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-orange-700">
                      <Bell className="w-3.5 h-3.5 text-orange-500" />
                      {Array.isArray(show.reminders) && show.reminders.length > 0
                        ? show.reminders.map((m: number) => formatReminderLabel(m)).join(', ')
                        : '알림 없음'}
                    </span>
                    {show.settlement?.isPaid && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-700 font-extrabold">입금 완료</span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectShow(show)}
                    className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r ${currentMood.btnBg} text-white text-sm font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.99] transition`}
                  >
                    <span>현장 큐시트 · 상세 열기</span>
                    <ChevronRight className="w-4 h-4 stroke-[2.6]" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
