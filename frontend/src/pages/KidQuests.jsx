import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  Star,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Swords,
  ArrowLeft,
  Repeat,
} from 'lucide-react';
import { api } from '../api/client';
import AvatarDisplay from '../components/AvatarDisplay';

const STATUS_CONFIG = {
  pending: { label: 'В процессе', color: 'text-muted', icon: Clock },
  completed: { label: 'Выполнено', color: 'text-emerald', icon: CheckCircle2 },
  verified: { label: 'Выполнено', color: 'text-emerald', icon: CheckCircle2 },
  skipped: { label: 'Пропущено', color: 'text-muted/50', icon: Clock },
};

export default function KidQuests() {
  const { kidId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const res = await api(`/api/stats/family/${kidId}`);
      setData(res);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [kidId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener('ws:message', handler);
    return () => window.removeEventListener('ws:message', handler);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <div className="game-panel p-8 text-center">
          <XCircle size={36} className="mx-auto text-crimson mb-3" />
          <p className="text-cream text-base font-semibold mb-2">Ошибка</p>
          <p className="text-muted text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { kid, assignments } = data;
  const completedCount = assignments.filter(
    (a) => a.status === 'completed' || a.status === 'verified'
  ).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-muted hover:text-cream text-sm transition-colors"
      >
        <ArrowLeft size={14} />
        Назад
      </button>

      {/* Member header */}
      <div className="game-panel p-4">
        <div className="flex items-center gap-3">
          <AvatarDisplay
            config={kid.avatar_config}
            size="md"
            name={kid.display_name}
            animate
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-cream text-base font-semibold truncate">
              {kid.display_name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="inline-flex items-center gap-1 text-gold text-xs font-semibold">
                <Star size={12} fill="currentColor" />
                {kid.points_balance.toLocaleString()} XP
              </span>
              {kid.current_streak > 0 && (
                <span className="inline-flex items-center gap-1 text-orange-400 text-xs font-semibold">
                  <Flame size={12} fill="currentColor" />
                  {kid.current_streak} дней подряд
                </span>
              )}
            </div>
            <p className="text-muted text-xs mt-1">
              {completedCount}/{assignments.length} квестов выполнено сегодня
            </p>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="game-panel p-3 border-crimson/30 text-crimson text-sm">{error}</div>
      )}

      {/* Quest list */}
      {assignments.length === 0 ? (
        <div className="game-panel p-10 text-center">
          <Swords size={40} className="mx-auto text-muted mb-4" />
          <p className="text-muted text-sm">Нет квестов на сегодня.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => {
            const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const isDone = a.status === 'completed' || a.status === 'verified';

            return (
              <div
                key={a.id}
                className={`game-panel p-3 flex items-center gap-3 ${isDone ? 'opacity-60' : ''}`}
              >
                <StatusIcon size={18} className={`flex-shrink-0 ${cfg.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-cream text-sm font-medium truncate">
                    {a.chore?.title || 'Квест'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-gold text-xs font-semibold">
                      +{a.chore?.points} XP
                    </span>
                    {a.chore?.recurrence === 'daily' && (
                      <span className="inline-flex items-center gap-0.5 text-muted text-xs">
                        <Repeat size={10} />
                        ежедневный
                      </span>
                    )}
                    <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
                {isDone && (
                  <CheckCircle2 size={18} className="text-emerald flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
