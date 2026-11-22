import React, { useState, useMemo } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  X,
  Volume2,
  Clock,
  MapPin,
  ChevronRight,
  Plus,
  Check,
  Send,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  NotificationPrefs,
  REMINDER_PRESETS,
  formatReminderLabel,
  computeTriggerDate,
  formatTriggerTimeKorean,
  formatCountdownKorean,
  parseShowDateTime,
} from '../utils/notifications';

interface NotificationManagerModalProps {
  shows: any[];
  prefs: NotificationPrefs;
  sentNotifications: Record<string, number>;
  browserPermission: NotificationPermission | 'unsupported';
  currentMood: { btnBg: string };
  onClose: () => void;
  onUpdatePrefs: (next: NotificationPrefs) => void;
  onRequestPermission: () => Promise<void>;
  onSendTestNotification: () => void;
  onUpdateShowReminders: (showId: string, reminders: number[]) => void;
  onApplyDefaultToUpcoming: () => void;
  onSelectShow: (show: any) => void;
}

type ManagerViewTab = 'timeline' | 'today' | 'byShow' | 'sent';

export default function NotificationManagerModal({
  shows,
  prefs,
  sentNotifications,
  browserPermission,
  currentMood,
  onClose,
  onUpdatePrefs,
  onRequestPermission,
  onSendTestNotification,
  onUpdateShowReminders,
  onApplyDefaultToUpcoming,
  onSelectShow,
}: NotificationManagerModalProps) {
  const [viewTab, setViewTab] = useState<ManagerViewTab>('timeline');
  const [customMinuteMap, setCustomMinuteMap] = useState<Record<string, string>>({});
  const [appliedBanner, setAppliedBanner] = useState('');

  const nowMs = Date.now();
  const nowObj = new Date(nowMs);
  const todayStr = `${nowObj.getFullYear()}-${String(nowObj.getMonth() + 1).padStart(2, '0')}-${String(nowObj.getDate()).padStart(2, '0')}`;

  // 시간별 알림 타임라인 생성
  const timelineEntries = useMemo(() => {
    const entries: Array<{
      key: string;
      show: any;
      minutesBefore: number;
      triggerDate: Date;
      showDate: Date;
      isSent: boolean;
      isToday: boolean;
      isUpcoming: boolean;
    }> = [];

    for (const show of shows) {
      const reminders: number[] = Array.isArray(show.reminders) ? show.reminders : [];
      const showDate = parseShowDateTime(show.date, show.time);
      if (!showDate) continue;

      for (const mins of reminders) {
        const triggerDate = computeTriggerDate(show.date, show.time, mins);
        if (!triggerDate) continue;

        const key = `${show.id}__${show.date}__${show.time}__${mins}`;
        const isSent = Boolean(sentNotifications[key]);
        const triggerDayStr = `${triggerDate.getFullYear()}-${String(triggerDate.getMonth() + 1).padStart(2, '0')}-${String(triggerDate.getDate()).padStart(2, '0')}`;
        const isToday = triggerDayStr === todayStr;
        const isUpcoming = !isSent && triggerDate.getTime() > nowMs - 5 * 60 * 1000 && showDate.getTime() >= nowMs - 5 * 60 * 1000;

        entries.push({
          key,
          show,
          minutesBefore: mins,
          triggerDate,
          showDate,
          isSent,
          isToday,
          isUpcoming,
        });
      }
    }

    return entries.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());
  }, [shows, sentNotifications, todayStr, nowMs]);

  const upcomingTimeline = timelineEntries.filter((e) => e.isUpcoming);
  const todayTimeline = timelineEntries.filter((e) => e.isToday && !e.isSent);
  const sentTimeline = [...timelineEntries]
    .filter((e) => e.isSent)
    .sort((a, b) => (sentNotifications[b.key] || 0) - (sentNotifications[a.key] || 0));

  const sortedUpcomingShows = useMemo(() => {
    return [...shows]
      .filter((s) => s.date >= todayStr)
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }, [shows, todayStr]);

  const toggleDefaultReminder = (minutes: number) => {
    const exists = prefs.defaultReminders.includes(minutes);
    const next = exists
      ? prefs.defaultReminders.filter((m) => m !== minutes)
      : [...prefs.defaultReminders, minutes].sort((a, b) => a - b);
    onUpdatePrefs({ ...prefs, defaultReminders: next });
  };

  const toggleShowReminder = (show: any, minutes: number) => {
    const current: number[] = Array.isArray(show.reminders) ? show.reminders : [];
    const exists = current.includes(minutes);
    const next = exists
      ? current.filter((m) => m !== minutes)
      : [...current, minutes].sort((a, b) => a - b);
    onUpdateShowReminders(show.id, next);
  };

  const handleAddCustomShowReminder = (show: any) => {
    const raw = (customMinuteMap[show.id] || '').trim();
    const mins = Number(raw);
    if (!Number.isFinite(mins) || mins < 1 || mins > 10080) return;
    const current: number[] = Array.isArray(show.reminders) ? show.reminders : [];
    if (!current.includes(mins)) {
      onUpdateShowReminders(
        show.id,
        [...current, mins].sort((a, b) => a - b)
      );
    }
    setCustomMinuteMap((prev) => ({ ...prev, [show.id]: '' }));
  };

  const permissionStatusLabel =
    browserPermission === 'granted'
      ? '브라우저 푸시 허용됨'
      : browserPermission === 'denied'
        ? '브라우저에서 알림 차단됨'
        : browserPermission === 'unsupported'
          ? '현재 환경 미지원 (앱 내 알림 작동)'
          : '푸시 알림 권한 필요';

  const displayedTimeline =
    viewTab === 'today'
      ? todayTimeline
      : viewTab === 'sent'
        ? sentTimeline
        : upcomingTimeline;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 flex items-end sm:items-center justify-center">
      <div className="w-full max-w-[680px] bg-slate-50 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* 상단 헤더 */}
        <div className="bg-white px-5 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg leading-tight">
                공연 알림 관리
              </h3>
              <p className="text-xs font-bold text-slate-500 tabular-nums">
                예정된 알림 {upcomingTimeline.length}건 · 오늘 {todayTimeline.length}건
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-xl"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 스크롤 본문 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* 1. 푸시 알림 상태 & 기본 설정 카드 */}
          <section className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {browserPermission === 'granted' ? (
                    <BellRing className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : browserPermission === 'denied' ? (
                    <BellOff className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span className="text-sm sm:text-base font-black text-slate-900">
                    {permissionStatusLabel}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  브라우저 푸시와 앱 내 알림음으로 공연 시작 전 미리 알려드립니다.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {browserPermission === 'default' && (
                  <button
                    type="button"
                    onClick={onRequestPermission}
                    className={`px-3.5 min-h-[40px] rounded-xl bg-gradient-to-r ${currentMood.btnBg} text-white text-xs sm:text-sm font-black shadow-xs active:scale-95 transition whitespace-nowrap`}
                  >
                    푸시 권한 허용
                  </button>
                )}
                <button
                  type="button"
                  onClick={onSendTestNotification}
                  className="px-3.5 min-h-[40px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 active:scale-95 transition whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>테스트 알림</span>
                </button>
              </div>
            </div>

            {browserPermission === 'denied' && (
              <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                브라우저 주소창 왼쪽 자물쇠/설정 아이콘에서 알림을 허용해 주세요. 차단 상태에서도 앱이 열려 있으면 화면 알림과 알림음이 정상 작동합니다.
              </p>
            )}

            {/* 푸시 / 알림음 스위치 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() =>
                  onUpdatePrefs({ ...prefs, pushEnabled: !prefs.pushEnabled })
                }
                className={`p-3 rounded-2xl border flex items-center justify-between text-left transition min-h-[48px] ${
                  prefs.pushEnabled
                    ? 'bg-emerald-50/80 border-emerald-300 text-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span className="text-sm font-extrabold flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  푸시 알림 받기
                </span>
                <span className="text-xs font-black">
                  {prefs.pushEnabled ? '켜짐' : '꺼짐'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdatePrefs({ ...prefs, soundEnabled: !prefs.soundEnabled })
                }
                className={`p-3 rounded-2xl border flex items-center justify-between text-left transition min-h-[48px] ${
                  prefs.soundEnabled
                    ? 'bg-amber-50/80 border-amber-300 text-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span className="text-sm font-extrabold flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-600" />
                  앱 내 알림음
                </span>
                <span className="text-xs font-black">
                  {prefs.soundEnabled ? '켜짐' : '꺼짐'}
                </span>
              </button>
            </div>

            {/* 새 공연 기본 알림 시간 선택 */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-slate-800">
                  새 일정 기본 알림 시간
                </span>
                {sortedUpcomingShows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyDefaultToUpcoming();
                      setAppliedBanner('다가오는 모든 일정에 기본 알림 시간을 적용했습니다.');
                      setTimeout(() => setAppliedBanner(''), 3000);
                    }}
                    className="text-xs font-black text-orange-700 hover:text-orange-800 underline whitespace-nowrap"
                  >
                    다가오는 공연에 일괄 적용
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {REMINDER_PRESETS.map((preset) => {
                  const active = prefs.defaultReminders.includes(preset.minutes);
                  return (
                    <button
                      key={preset.minutes}
                      type="button"
                      onClick={() => toggleDefaultReminder(preset.minutes)}
                      className={`px-3.5 min-h-[40px] rounded-xl text-xs sm:text-sm font-extrabold border flex items-center gap-1.5 transition whitespace-nowrap ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>

              {appliedBanner && (
                <p className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  {appliedBanner}
                </p>
              )}
            </div>
          </section>

          {/* 2. 시간별 알림 관리 탭 */}
          <section className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-black text-slate-900 text-base sm:text-lg">
                시간별 알림 스케줄 관리
              </h4>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full">
                {[
                  { id: 'timeline' as ManagerViewTab, label: `예정 (${upcomingTimeline.length})` },
                  { id: 'today' as ManagerViewTab, label: `오늘 (${todayTimeline.length})` },
                  { id: 'byShow' as ManagerViewTab, label: `공연별 (${sortedUpcomingShows.length})` },
                  { id: 'sent' as ManagerViewTab, label: `완료 (${sentTimeline.length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setViewTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition tabular-nums ${
                      viewTab === tab.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 공연별 알림 시간 직접 토글 뷰 */}
            {viewTab === 'byShow' ? (
              sortedUpcomingShows.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100 px-4">
                  <p className="text-sm font-extrabold text-slate-700">
                    다가오는 공연 일정이 없습니다.
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    일정을 추가하면 공연별로 30분 전·1시간 전 알림을 설정할 수 있어요.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedUpcomingShows.map((show) => {
                    const reminders: number[] = Array.isArray(show.reminders)
                      ? show.reminders
                      : [];
                    const customExtras = reminders.filter(
                      (m) => !REMINDER_PRESETS.some((p) => p.minutes === m)
                    );

                    return (
                      <div
                        key={show.id}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-black text-orange-600 tabular-nums">
                              {show.date} · {show.time}
                            </p>
                            <h5 className="text-base font-black text-slate-900 truncate">
                              {show.title}
                            </h5>
                            <p className="text-xs font-bold text-slate-600 flex items-center gap-1 truncate mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                              {show.venue}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {reminders.length > 0 && (
                              <button
                                type="button"
                                onClick={() => onUpdateShowReminders(show.id, [])}
                                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-600 hover:text-rose-600"
                              >
                                모두 끄기
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onSelectShow(show);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-black flex items-center gap-0.5"
                            >
                              <span>상세</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* 시간별 프리셋 토글 */}
                        <div className="flex flex-wrap gap-1.5">
                          {REMINDER_PRESETS.map((preset) => {
                            const active = reminders.includes(preset.minutes);
                            return (
                              <button
                                key={preset.minutes}
                                type="button"
                                onClick={() => toggleShowReminder(show, preset.minutes)}
                                className={`px-3 min-h-[38px] rounded-xl text-xs font-extrabold border flex items-center gap-1 transition whitespace-nowrap ${
                                  active
                                    ? `bg-gradient-to-r ${currentMood.btnBg} text-white border-transparent shadow-2xs`
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {active && <Check className="w-3 h-3" />}
                                <span>{preset.label}</span>
                              </button>
                            );
                          })}
                          {customExtras.map((mins) => (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => toggleShowReminder(show, mins)}
                              className={`px-3 min-h-[38px] rounded-xl text-xs font-extrabold border bg-gradient-to-r ${currentMood.btnBg} text-white border-transparent flex items-center gap-1`}
                            >
                              <span>{formatReminderLabel(mins)}</span>
                              <X className="w-3 h-3" />
                            </button>
                          ))}
                        </div>

                        {/* 직접 분(minute) 추가 */}
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={10080}
                            value={customMinuteMap[show.id] || ''}
                            onChange={(e) =>
                              setCustomMinuteMap((prev) => ({
                                ...prev,
                                [show.id]: e.target.value,
                              }))
                            }
                            placeholder="직접 입력 (예: 45분 전)"
                            className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddCustomShowReminder(show)}
                            className="px-3 min-h-[38px] rounded-xl bg-slate-800 text-white text-xs font-black flex items-center gap-1 shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>추가</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : displayedTimeline.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100 px-4 space-y-2">
                <p className="text-sm font-extrabold text-slate-700">
                  {viewTab === 'today'
                    ? '오늘 발송될 예정 알림이 없습니다.'
                    : viewTab === 'sent'
                      ? '아직 발송 완료된 알림 기록이 없습니다.'
                      : '예정된 공연 알림이 없습니다.'}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  &lsquo;공연별&rsquo; 탭에서 각 일정에 30분 전·1시간 전 알림을 켜보세요.
                </p>
              </div>
            ) : (
              /* 시간순 알림 타임라인 리스트 */
              <div className="space-y-2.5">
                {displayedTimeline.map((item) => {
                  const triggerLabel = formatTriggerTimeKorean(item.triggerDate);
                  const countdown = item.isSent
                    ? '발송 완료'
                    : formatCountdownKorean(item.triggerDate.getTime(), nowMs);

                  return (
                    <div
                      key={item.key}
                      className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-black tabular-nums">
                          <span className="text-orange-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            {triggerLabel}
                          </span>
                          <span aria-hidden="true" className="text-slate-400">·</span>
                          <span className="text-slate-800">
                            {formatReminderLabel(item.minutesBefore)}
                          </span>
                          <span aria-hidden="true" className="text-slate-400">·</span>
                          <span
                            className={
                              item.isSent ? 'text-emerald-700' : 'text-sky-700'
                            }
                          >
                            {countdown}
                          </span>
                        </div>

                        <p className="text-sm sm:text-base font-black text-slate-900 truncate">
                          {item.show.title}
                        </p>
                        <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5 truncate tabular-nums">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            공연 {item.show.date} {item.show.time}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{item.show.venue}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!item.isSent && (
                          <button
                            type="button"
                            onClick={() =>
                              toggleShowReminder(item.show, item.minutesBefore)
                            }
                            className="px-3 min-h-[40px] rounded-xl bg-white border border-slate-300 text-xs font-extrabold text-slate-700 hover:text-rose-600 hover:border-rose-300 transition whitespace-nowrap"
                          >
                            해제
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectShow(item.show);
                          }}
                          className="px-3 min-h-[40px] rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-0.5 whitespace-nowrap"
                        >
                          <span>큐시트</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
