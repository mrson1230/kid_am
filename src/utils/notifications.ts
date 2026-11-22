export interface NotificationPrefs {
  defaultReminders: number[];
  soundEnabled: boolean;
  pushEnabled: boolean;
}

export interface InAppAlert {
  alertKey: string;
  showId: string;
  showTitle: string;
  venue: string;
  date: string;
  time: string;
  minutesBefore: number;
  triggeredAt: number;
}

export const REMINDER_PRESETS: Array<{ minutes: number; label: string }> = [
  { minutes: 10, label: '10분 전' },
  { minutes: 30, label: '30분 전' },
  { minutes: 60, label: '1시간 전' },
  { minutes: 120, label: '2시간 전' },
  { minutes: 1440, label: '하루 전' },
];

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  defaultReminders: [30, 60],
  soundEnabled: true,
  pushEnabled: true,
};

export function formatReminderLabel(minutes: number): string {
  if (minutes === 1440) return '하루 전';
  if (minutes % 60 === 0 && minutes >= 60) {
    return `${minutes / 60}시간 전`;
  }
  if (minutes > 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}시간 ${m}분 전`;
  }
  return `${minutes}분 전`;
}

export function getBrowserPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestBrowserPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function parseShowDateTime(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const [hh, mm] = (timeStr || '09:00').split(':').map(Number);
  return new Date(y, m - 1, d, Number.isFinite(hh) ? hh : 9, Number.isFinite(mm) ? mm : 0, 0, 0);
}

export function computeTriggerDate(
  dateStr: string,
  timeStr: string,
  minutesBefore: number
): Date | null {
  const showDate = parseShowDateTime(dateStr, timeStr);
  if (!showDate) return null;
  return new Date(showDate.getTime() - minutesBefore * 60 * 1000);
}

export function formatTriggerTimeKorean(triggerDate: Date): string {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const tmrw = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tmrwKey = `${tmrw.getFullYear()}-${tmrw.getMonth()}-${tmrw.getDate()}`;
  const targetKey = `${triggerDate.getFullYear()}-${triggerDate.getMonth()}-${triggerDate.getDate()}`;

  const hh = String(triggerDate.getHours()).padStart(2, '0');
  const mm = String(triggerDate.getMinutes()).padStart(2, '0');
  const timePart = `${hh}:${mm}`;

  if (targetKey === todayKey) return `오늘 ${timePart}`;
  if (targetKey === tmrwKey) return `내일 ${timePart}`;
  return `${triggerDate.getMonth() + 1}월 ${triggerDate.getDate()}일 ${timePart}`;
}

export function formatCountdownKorean(targetMs: number, nowMs: number): string {
  const diffMs = targetMs - nowMs;
  if (diffMs <= 0) return '시간 도래';
  const totalMins = Math.ceil(diffMs / 60000);
  if (totalMins < 60) return `${totalMins}분 남음`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours < 24) {
    return mins > 0 ? `${hours}시간 ${mins}분 남음` : `${hours}시간 남음`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}일 ${remHours}시간 남음` : `${days}일 남음`;
}

export function playReminderChime(): void {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx: AudioContext = new AudioContextClass();

    const playTone = (freq: number, startOffset: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + startOffset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startOffset);
      osc.stop(ctx.currentTime + startOffset + duration);
    };

    playTone(587.33, 0, 0.28); // D5
    playTone(880.0, 0.16, 0.42); // A5
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 900);
  } catch {
    // Ignore audio context autoplay errors
  }
}

export function sendBrowserPushNotification(
  title: string,
  body: string,
  tag: string,
  onClick?: () => void
): boolean {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    Notification.permission !== 'granted'
  ) {
    return false;
  }
  try {
    const notification = new Notification(title, {
      body,
      tag,
    });
    if (onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
        notification.close();
      };
    }
    return true;
  } catch {
    return false;
  }
}
