import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Star,
  Plus,
  Loader2,
  AlertTriangle,
  Users,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import AvatarDisplay from '../components/AvatarDisplay';
import Modal from '../components/Modal';

export default function ParentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [familyStats, setFamilyStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bonusModalOpen, setBonusModalOpen] = useState(false);

  const [bonusKidId, setBonusKidId] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusDescription, setBonusDescription] = useState('');
  const [bonusSubmitting, setBonusSubmitting] = useState(false);
  const [bonusError, setBonusError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const [familyRes, calendarRes] = await Promise.all([
        api('/api/stats/family'),
        api('/api/calendar'),
      ]);

      setFamilyStats(familyRes);

      const today = new Date().toISOString().slice(0, 10);
      const todayAssignments = (calendarRes.days && calendarRes.days[today]) || [];
      // Show today's completed quests as activity feed
      const completed = todayAssignments
        .filter((a) => a.status === 'verified' || a.status === 'completed')
        .sort((a, b) => new Date(b.completed_at || 0) - new Date(a.completed_at || 0));
      setRecentActivity(completed);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить данные семьи');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handler = () => { fetchData(); };
    window.addEventListener('ws:message', handler);
    return () => window.removeEventListener('ws:message', handler);
  }, [fetchData]);

  const handleBonusSubmit = async () => {
    setBonusError('');
    if (!bonusKidId) {
      setBonusError('Выберите ребёнка');
      return;
    }
    const amt = parseInt(bonusAmount, 10);
    if (!amt || amt <= 0) {
      setBonusError('Введите положительное количество ОП');
      return;
    }
    if (!bonusDescription.trim()) {
      setBonusError('Введите описание');
      return;
    }

    setBonusSubmitting(true);
    try {
      await api(`/api/points/${bonusKidId}/bonus`, {
        method: 'POST',
        body: { amount: amt, description: bonusDescription.trim() },
      });
      setBonusKidId('');
      setBonusAmount('');
      setBonusDescription('');
      setBonusModalOpen(false);
      await fetchData();
    } catch (err) {
      setBonusError(err.message || 'Не удалось наградить бонусными ОП');
    } finally {
      setBonusSubmitting(false);
    }
  };

  function ProgressBar({ completed, total }) {
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return (
      <div className="xp-bar">
        <div
          className="xp-bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-cream text-lg font-semibold">Обзор семьи</h1>
        <div className="flex items-center gap-1.5 text-muted text-sm">
          <Users size={14} />
          <span>{familyStats.length} участников</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="game-panel p-3 flex items-center gap-2 border-crimson/30 text-crimson text-sm">
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Family member cards */}
      {familyStats.length === 0 ? (
        <div className="game-panel p-8 text-center">
          <p className="text-muted text-sm">В вашей семье пока никого нет.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {familyStats.map((member) => (
            <div
              key={member.id}
              className="game-panel p-4 cursor-pointer hover:border-accent/40 transition-colors"
              onClick={() => navigate(`/kids/${member.id}`)}
            >
              <div className="flex items-center gap-3 mb-3">
                <AvatarDisplay
                  config={member.avatar_config}
                  size="md"
                  name={member.display_name}
                  animate
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-cream text-sm font-medium truncate">
                    {member.display_name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="inline-flex items-center gap-1 text-gold text-xs font-medium">
                      <Star size={11} fill="currentColor" />
                      {member.points_balance.toLocaleString()} XP
                    </span>
                    {member.current_streak > 0 && (
                      <span className="inline-flex items-center gap-1 text-orange-400 text-xs font-medium">
                        <Flame size={11} fill="currentColor" />
                        {member.current_streak}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Сегодня</span>
                  <span className="text-cream font-medium">
                    {member.today_completed}/{member.today_total} квестов
                  </span>
                </div>
                <ProgressBar
                  completed={member.today_completed}
                  total={member.today_total}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent activity feed */}
      {recentActivity.length > 0 && (
        <section>
          <h2 className="text-cream text-sm font-semibold mb-2 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald" />
            Активность сегодня
          </h2>
          <div className="space-y-2">
            {recentActivity.map((assignment) => (
              <div key={assignment.id} className="game-panel p-3 flex items-center gap-3">
                <CheckCircle2 size={16} className="text-emerald flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-cream text-sm font-medium truncate">
                    {assignment.chore?.title || 'Квест'}
                  </p>
                  <p className="text-muted text-xs">
                    {assignment.user?.display_name || 'Участник'}
                    <span className="ml-2 text-gold font-medium">+{assignment.chore?.points} XP</span>
                  </p>
                </div>
                {assignment.completed_at && (
                  <span className="text-muted text-xs flex items-center gap-1 flex-shrink-0">
                    <Clock size={10} />
                    {new Date(assignment.completed_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="flex flex-col sm:flex-row gap-2 pt-1">
        <button
          className="game-btn game-btn-blue flex items-center gap-2 justify-center flex-1"
          onClick={() => navigate('/chores')}
        >
          <Plus size={14} />
          Создать квест
        </button>
        <button
          className="game-btn game-btn-purple flex items-center gap-2 justify-center flex-1"
          onClick={() => {
            setBonusError('');
            setBonusModalOpen(true);
          }}
        >
          <Sparkles size={14} />
          Наградить бонусными ОП
        </button>
      </section>

      {/* Bonus XP Modal */}
      <Modal
        isOpen={bonusModalOpen}
        onClose={() => setBonusModalOpen(false)}
        title="Наградить бонусными ОП"
        actions={[
          {
            label: 'Отмена',
            onClick: () => setBonusModalOpen(false),
            className: 'game-btn game-btn-red',
          },
          {
            label: bonusSubmitting ? 'Награждение...' : 'Наградить ОП',
            onClick: handleBonusSubmit,
            disabled: bonusSubmitting,
            className: 'game-btn game-btn-gold',
          },
        ]}
      >
        <div className="space-y-3">
          {bonusError && (
            <div className="p-2 rounded-md border border-crimson/30 bg-crimson/10 text-crimson text-sm">
              {bonusError}
            </div>
          )}

          <div>
            <label className="block text-cream text-sm font-medium mb-1">
              Выбрать ребёнка
            </label>
            <select
              value={bonusKidId}
              onChange={(e) => setBonusKidId(e.target.value)}
              className="field-input"
            >
              <option value="">-- Выбрать --</option>
              {familyStats.map((kid) => (
                <option key={kid.id} value={kid.id}>
                  {kid.display_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-cream text-sm font-medium mb-1">
              Количество ОП
            </label>
            <input
              type="number"
              min="1"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(e.target.value)}
              placeholder="50"
              className="field-input"
            />
          </div>

          <div>
            <label className="block text-cream text-sm font-medium mb-1">
              Причина
            </label>
            <input
              type="text"
              value={bonusDescription}
              onChange={(e) => setBonusDescription(e.target.value)}
              placeholder="Отличная помощь!"
              className="field-input"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
