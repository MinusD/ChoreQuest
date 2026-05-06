import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Swords } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('kid');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Введите имя пользователя');
      return;
    }
    if (!password) {
      setError('Введите пароль');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов');
      return;
    }
    if (!displayName.trim()) {
      setError('Введите отображаемое имя');
      return;
    }
    if (displayName.trim().length > 10) {
      setError('Отображаемое имя не более 10 символов');
      return;
    }

    setSubmitting(true);
    try {
      await register(
        username.trim(),
        password,
        displayName.trim(),
        role,
        inviteCode.trim() || undefined
      );
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Ошибка регистрации. Попробуйте снова.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-navy">
      <form
        onSubmit={handleSubmit}
        className="game-panel w-full max-w-sm p-6"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center">
            <Swords size={16} className="text-navy" />
          </div>
          <h1 className="text-cream text-lg font-semibold">
            Создать аккаунт
          </h1>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-2.5 rounded-md border border-crimson/30 bg-crimson/10 text-crimson text-sm">
            {error}
          </div>
        )}

        {/* Username */}
        <div className="mb-3">
          <label className="block text-cream text-sm font-medium mb-1">
            Имя пользователя
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Выберите имя пользователя"
            autoComplete="username"
            className="field-input"
          />
        </div>

        {/* Password */}
        <div className="mb-3">
          <label className="block text-cream text-sm font-medium mb-1">
            Пароль
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 6 символов"
            autoComplete="new-password"
            className="field-input"
          />
        </div>

        {/* Display Name */}
        <div className="mb-3">
          <label className="block text-cream text-sm font-medium mb-1">
            Отображаемое имя
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={10}
            placeholder="Как вас будут видеть другие"
            autoComplete="off"
            className="field-input"
          />
        </div>

        {/* Role */}
        <div className="mb-3">
          <label className="block text-cream text-sm font-medium mb-1">
            Роль
          </label>
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="field-input appearance-none cursor-pointer pr-10"
            >
              <option value="kid">Искатель приключений (Ребёнок)</option>
              <option value="parent">Предводитель (Родитель)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
                <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Invite Code */}
        <div className="mb-5">
          <label className="block text-cream text-sm font-medium mb-1">
            Код приглашения
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Введите код приглашения"
            autoComplete="off"
            className="field-input"
          />
          <p className="text-muted text-xs mt-1">
            Обязателен, если вы не первый пользователь
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className={`game-btn game-btn-blue w-full text-sm ${submitting ? 'opacity-60 cursor-wait' : ''}`}
        >
          {submitting ? 'Создание аккаунта...' : 'Создать аккаунт'}
        </button>

        {/* Login link */}
        <p className="text-center mt-5 text-muted text-sm">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-accent hover:text-accent-light font-medium transition-colors">
            Войти
          </Link>
        </p>
      </form>
    </div>
  );
}
