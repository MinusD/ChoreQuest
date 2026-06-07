import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { themedTitle, themedDescription } from '../utils/questThemeText';
import {
  ArrowLeft,
  Star,
  RefreshCw,
  Camera,
  CheckCircle2,
  Calendar,
  Clock,
  Shield,
  Loader2,
  RotateCw,
  Trash2,
  ChevronRight,
  Users,
} from 'lucide-react';

const DIFFICULTY_LEVEL = { easy: 1, medium: 2, hard: 3, expert: 4 };
const DIFFICULTY_LABELS = ['Тривиальный', 'Лёгкий', 'Средний', 'Сложный', 'Легендарный'];
const DIFFICULTY_COLORS = [
  'text-muted',
  'text-emerald',
  'text-accent',
  'text-purple',
  'text-gold',
];
const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const CATEGORY_COLORS = {
  cleaning: 'bg-accent/20 text-accent border-accent/40',
  cooking: 'bg-gold/20 text-gold border-gold/40',
  outdoor: 'bg-emerald/20 text-emerald border-emerald/40',
  homework: 'bg-purple/20 text-purple border-purple/40',
  pet_care: 'bg-crimson/20 text-crimson border-crimson/40',
  laundry: 'bg-accent/20 text-accent border-accent/40',
  errands: 'bg-gold/20 text-gold border-gold/40',
  default: 'bg-cream/10 text-muted border-border',
};

function DifficultyStars({ level }) {
  // level can be a string ("easy") or number — normalise to 1-based int
  const num = typeof level === 'string' ? (DIFFICULTY_LEVEL[level] || 1) : (level || 1);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={18}
          className={i <= num ? 'text-gold fill-gold' : 'text-cream/20'}
        />
      ))}
      <span className={`ml-2 text-sm ${DIFFICULTY_COLORS[num - 1] || 'text-muted'}`}>
        {DIFFICULTY_LABELS[num - 1] || 'Неизвестно'}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-gold/20 text-gold border-gold/40',
    completed: 'bg-emerald/20 text-emerald border-emerald/40',
    verified: 'bg-accent/20 text-accent border-accent/40',
    skipped: 'bg-cream/10 text-muted border-border',
    missed: 'bg-crimson/20 text-crimson border-crimson/40',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-md text-sm border capitalize ${
        styles[status] || styles.pending
      }`}
    >
      {({'pending':'в процессе','completed':'выполнено','verified':'выполнено','skipped':'пропущено','missed':'пропущен'})[status] || 'в процессе'}
    </span>
  );
}

export default function ChoreDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { colorTheme } = useTheme();
  const navigate = useNavigate();
  const isParent = user?.role === 'parent' || user?.role === 'admin';
  const isKid = user?.role === 'kid';

  const [chore, setChore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Rotation state (parent only)
  const [rotation, setRotation] = useState(null);
  const [allKids, setAllKids] = useState([]);
  const [selectedCadence, setSelectedCadence] = useState('daily');
  const [assignmentRules, setAssignmentRules] = useState([]);

  const fetchRotation = useCallback(async () => {
    if (!isParent) return;
    try {
      const rotations = await api('/api/rotations');
      const match = (rotations || []).find((r) => r.chore_id === parseInt(id));
      setRotation(match || null);
    } catch { setRotation(null); }
  }, [id, isParent]);

  const fetchAssignmentRules = useCallback(async () => {
    if (!isParent) return;
    try {
      const rules = await api(`/api/chores/${id}/rules`);
      setAssignmentRules(Array.isArray(rules) ? rules.filter((r) => r.is_active) : []);
    } catch { setAssignmentRules([]); }
  }, [id, isParent]);

  const fetchChore = useCallback(async () => {
    try {
      setError('');
      const data = await api(`/api/chores/${id}`);
      setChore(data);
    } catch (err) {
      setError(err.message || 'Этот свиток задания не найден.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchChore();
    fetchRotation();
    fetchAssignmentRules();
    if (isParent) {
      api('/api/stats/kids').then((data) => setAllKids(data || [])).catch(() => {});
    }
  }, [fetchChore, fetchRotation, fetchAssignmentRules, isParent]);

  // Live updates via WebSocket
  useEffect(() => {
    const handler = () => { fetchChore(); fetchRotation(); };
    window.addEventListener('ws:message', handler);
    return () => window.removeEventListener('ws:message', handler);
  }, [fetchChore, fetchRotation]);

  const handleComplete = async () => {
    setActionLoading('complete');
    setActionMessage('');
    try {
      await api(`/api/chores/${id}/complete`, { method: 'POST' });
      setActionMessage('Квест выполнен! Герой получил ОП.');
      await fetchChore();
    } catch (err) {
      setActionMessage(err.message || 'Не удалось завершить квест.');
    } finally {
      setActionLoading('');
    }
  };

  const handleCreateRotation = async () => {
    if (allKids.length < 2) { setActionMessage('Need at least 2 kids for a rotation.'); return; }
    setActionLoading('rotation');
    try {
      await api('/api/rotations', {
        method: 'POST',
        body: { chore_id: parseInt(id), kid_ids: allKids.map((k) => k.id), cadence: selectedCadence },
      });
      await fetchRotation();
      setActionMessage('Ротация создана.');
    } catch (err) {
      setActionMessage(err.message || 'Не удалось создать ротацию.');
    } finally {
      setActionLoading('');
    }
  };

  const handleAdvanceRotation = async () => {
    if (!rotation) return;
    setActionLoading('rotation');
    try {
      await api(`/api/rotations/${rotation.id}/advance`, { method: 'POST' });
      await fetchRotation();
      setActionMessage('Ротация переключена на следующего ребёнка.');
    } catch (err) {
      setActionMessage(err.message || 'Не удалось сдвинуть ротацию.');
    } finally {
      setActionLoading('');
    }
  };

  const handleUpdateCadence = async (newCadence) => {
    if (!rotation) return;
    setActionLoading('rotation');
    try {
      await api(`/api/rotations/${rotation.id}`, {
        method: 'PUT',
        body: { cadence: newCadence },
      });
      await fetchRotation();
      setActionMessage(`Частота обновлена: ${newCadence}.`);
    } catch (err) {
      setActionMessage(err.message || 'Не удалось обновить частоту.');
    } finally {
      setActionLoading('');
    }
  };

  const handleDeleteRotation = async () => {
    if (!rotation) return;
    setActionLoading('rotation');
    try {
      await api(`/api/rotations/${rotation.id}`, { method: 'DELETE' });
      setRotation(null);
      setActionMessage('Ротация удалена.');
    } catch (err) {
      setActionMessage(err.message || 'Не удалось удалить ротацию.');
    } finally {
      setActionLoading('');
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <button
          onClick={() => navigate('/chores')}
          className="flex items-center gap-2 text-muted hover:text-cream transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Назад к доске заданий</span>
        </button>
        <div className="game-panel p-10 text-center">
          <XCircle size={48} className="mx-auto text-crimson mb-4" />
          <p className="text-cream text-base font-semibold mb-2">Не найдено</p>
          <p className="text-muted text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!chore) return null;

  const categoryName = typeof chore.category === 'object' ? chore.category?.name : chore.category;
  const categoryColorClass =
    CATEGORY_COLORS[categoryName?.toLowerCase()] || CATEGORY_COLORS.default;

  // Determine today's assignment
  const assignments = chore.assignments || chore.history || [];
  const today = new Date().toISOString().split('T')[0];
  const todayAssignment = assignments.find(
    (a) => a.date === today || a.assigned_date === today || a.due_date === today
  );
  const hasPendingToday =
    todayAssignment && (todayAssignment.status === 'pending' || todayAssignment.status === 'assigned');
  const recentAssignments = assignments.slice(0, 10);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/chores')}
        className="flex items-center gap-2 text-muted hover:text-cream transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Назад к доске заданий</span>
      </button>

      {/* Main chore panel */}
      <div className="game-panel p-6 space-y-5">
        {/* Title */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h1 className="text-cream text-lg font-semibold leading-relaxed">
              {themedTitle(chore.title, colorTheme)}
            </h1>
          </div>
        </div>

        {/* Description */}
        {chore.description && (
          <div className="pl-10">
            <p className="text-muted text-sm leading-relaxed">
              {themedDescription(chore.title, chore.description, colorTheme)}
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="mx-auto w-full h-[1px] bg-border" />

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* XP */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-gold/10 flex items-center justify-center">
              <span className="text-gold text-xl">&#9733;</span>
            </div>
            <div>
              <p className="text-muted text-xs font-medium">Награда XP</p>
              <p className="text-gold text-lg font-medium">{chore.points} XP</p>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <p className="text-muted text-xs font-medium mb-1">Сложность</p>
            <DifficultyStars level={chore.difficulty || 1} />
          </div>

          {/* Category */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-surface-raised flex items-center justify-center">
              <Shield size={18} className="text-muted" />
            </div>
            <div>
              <p className="text-muted text-xs font-medium">Категория</p>
              <span
                className={`inline-block px-2 py-0.5 rounded-md text-sm border capitalize ${categoryColorClass}`}
              >
                {categoryName || 'Общее'}
              </span>
            </div>
          </div>

          {/* Recurrence */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-surface-raised flex items-center justify-center">
              <RefreshCw size={18} className="text-muted" />
            </div>
            <div>
              <p className="text-muted text-xs font-medium">Повторяемость</p>
              <p className="text-cream text-sm capitalize">
                {chore.recurrence || 'Один раз'}
                {chore.recurrence === 'custom' &&
                  chore.custom_days?.length > 0 && (
                    <span className="text-muted text-xs ml-1">
                      ({chore.custom_days.map((d) => DAY_NAMES[d] || d).join(', ')})
                    </span>
                  )}
              </p>
            </div>
          </div>
        </div>

        {/* Photo requirement */}
        {chore.requires_photo && (
          <div className="flex items-center gap-2 px-3 py-2 rounded bg-purple/10 border border-purple/30">
            <Camera size={16} className="text-purple" />
            <span className="text-purple text-xs">
              При выполнении требуется фото-подтверждение
            </span>
          </div>
        )}
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div
          className={`p-3 rounded border text-sm text-center ${
            actionMessage.toLowerCase().includes('fail') || actionMessage.toLowerCase().includes('could not')
              ? 'border-crimson/40 bg-crimson/10 text-crimson'
              : 'border-emerald/40 bg-emerald/10 text-emerald'
          }`}
        >
          {actionMessage}
        </div>
      )}

      {/* Actions for kids */}
      {isKid && hasPendingToday && (
        <div className="game-panel p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cream text-sm font-semibold mb-1">Сегодняшнее задание</p>
            </div>
            <button
              onClick={handleComplete}
              disabled={!!actionLoading}
              className={`game-btn game-btn-blue flex items-center gap-2 ${
                actionLoading === 'complete' ? 'opacity-60 cursor-wait' : ''
              }`}
            >
              <CheckCircle2 size={16} />
              {actionLoading === 'complete' ? 'Выполнение...' : 'Выполнить задание'}
            </button>
          </div>
        </div>
      )}


      {/* Assignment Rules Panel (parent only) */}
      {isParent && assignmentRules.length > 0 && (
        <div className="game-panel p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-accent" />
            <h2 className="text-cream text-sm font-semibold">Назначено</h2>
          </div>
          <div className="space-y-2">
            {assignmentRules.map((rule) => {
              const kid = allKids.find((k) => k.id === rule.user_id);
              return (
                <div
                  key={rule.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-border bg-surface-raised/20"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-cream text-sm font-medium truncate">
                      {kid?.display_name || rule.user?.display_name || `Ребёнок #${rule.user_id}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-muted text-xs capitalize flex items-center gap-1">
                      <RefreshCw size={10} />
                      {rule.recurrence}
                    </span>
                    {rule.requires_photo && (
                      <span className="text-muted text-xs flex items-center gap-1">
                        <Camera size={10} />
                        Фото
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rotation Panel (parent only, recurring chores) */}
      {isParent && chore.recurrence && chore.recurrence !== 'once' && (
        <div className="game-panel p-5 space-y-3">
          <div className="flex items-center gap-2">
            <RotateCw size={18} className="text-purple" />
            <h2 className="text-cream text-sm font-semibold">Ротация детей</h2>
          </div>

          {rotation ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted">Частота:</span>
                <select
                  value={rotation.cadence}
                  onChange={(e) => handleUpdateCadence(e.target.value)}
                  disabled={actionLoading === 'rotation'}
                  className="bg-surface-raised text-cream text-sm rounded-md border border-border px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple"
                >
                  <option value="daily">Ежедневно</option>
                  <option value="weekly">Еженедельно</option>
                  <option value="fortnightly">Раз в две недели</option>
                  <option value="monthly">Ежемесячно</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                {(rotation.kid_ids || []).map((kidId, idx) => {
                  const kid = allKids.find((k) => k.id === kidId);
                  const isCurrent = idx === rotation.current_index;
                  return (
                    <span
                      key={kidId}
                      className={`px-3 py-1 rounded-md text-xs font-medium border ${
                        isCurrent
                          ? 'border-purple bg-purple/20 text-purple'
                          : 'border-border text-muted'
                      }`}
                    >
                      {kid?.display_name || `Ребёнок #${kidId}`}
                      {isCurrent && ' (текущий)'}
                    </span>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleAdvanceRotation}
                  disabled={actionLoading === 'rotation'}
                  className="game-btn game-btn-purple flex items-center gap-1.5 !py-1.5 !px-3 !text-[11px]"
                >
                  <ChevronRight size={14} />
                  Сдвинуть
                </button>
                <button
                  onClick={handleDeleteRotation}
                  disabled={actionLoading === 'rotation'}
                  className="game-btn game-btn-red flex items-center gap-1.5 !py-1.5 !px-3 !text-[11px]"
                >
                  <Trash2 size={14} />
                  Удалить ротацию
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-muted text-xs">
                Ротация не настроена. Создайте её, чтобы автоматически чередовать это задание между детьми.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted">Частота:</span>
                <select
                  value={selectedCadence}
                  onChange={(e) => setSelectedCadence(e.target.value)}
                  className="bg-surface-raised text-cream text-sm rounded-md border border-border px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple"
                >
                  <option value="daily">Ежедневно</option>
                  <option value="weekly">Еженедельно</option>
                  <option value="fortnightly">Раз в две недели</option>
                  <option value="monthly">Ежемесячно</option>
                </select>
              </div>
              <button
                onClick={handleCreateRotation}
                disabled={actionLoading === 'rotation' || allKids.length < 2}
                className="game-btn game-btn-purple flex items-center gap-1.5 !py-1.5 !px-3 !text-[11px]"
              >
                <RotateCw size={14} />
                {allKids.length < 2 ? 'Нужно 2+ детей' : 'Создать ротацию'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Assignment History */}
      {recentAssignments.length > 0 && (
        <div className="game-panel p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-accent" />
            <h2 className="text-cream text-sm font-semibold">История</h2>
          </div>

          <div className="space-y-2">
            {recentAssignments.map((assignment, idx) => (
              <div
                key={assignment.id || idx}
                className="flex items-center justify-between p-3 rounded bg-surface-raised/30 border border-border"
              >
                <div className="flex items-center gap-3">
                  <Clock size={14} className="text-cream/30" />
                  <span className="text-muted text-xs">
                    {assignment.date || assignment.assigned_date || assignment.due_date || '—'}
                  </span>
                  {assignment.assigned_to_name && (
                    <span className="text-muted text-xs">
                      - {assignment.assigned_to_name}
                    </span>
                  )}
                </div>
                <StatusBadge status={assignment.status} />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
