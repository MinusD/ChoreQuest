import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import {
  Lock,
  Star,
  Flame,
  ShoppingBag,
  Sparkles,
  Loader2,
  Check,
  Coins,
} from 'lucide-react';

const RARITY_COLORS = {
  common: 'border-border text-muted',
  uncommon: 'border-accent/40 text-accent',
  rare: 'border-purple/40 text-purple',
  epic: 'border-gold/40 text-gold',
  legendary: 'border-crimson/40 text-crimson',
};

const RARITY_BG = {
  common: 'bg-surface-raised/30',
  uncommon: 'bg-accent/5',
  rare: 'bg-purple/5',
  epic: 'bg-gold/5',
  legendary: 'bg-crimson/5',
};

const RARITY_BADGE = {
  common: 'bg-border text-muted',
  uncommon: 'bg-accent/20 text-accent',
  rare: 'bg-purple/20 text-purple',
  epic: 'bg-gold/20 text-gold',
  legendary: 'bg-crimson/20 text-crimson',
};

const CATEGORY_LABELS = {
  head: 'Голова',
  hair: 'Волосы',
  eyes: 'Глаза',
  mouth: 'Рот',
  hat: 'Шляпы',
  accessory: 'Снаряжение',
  face_extra: 'Лицо',
  outfit_pattern: 'Узор',
  pet: 'Питомцы',
};

const CATEGORY_ORDER = ['hat', 'pet', 'accessory', 'hair', 'eyes', 'mouth', 'face_extra', 'outfit_pattern', 'head'];

function unlockLabel(item) {
  switch (item.unlock_method) {
    case 'shop':
      return `${item.unlock_value} XP`;
    case 'xp':
      return `Наберите ${item.unlock_value} XP`;
    case 'streak':
      return `${item.unlock_value}-дневная серия`;
    case 'quest_drop':
      return 'Выпадает в заданиях';
    default:
      return 'Бесплатно';
  }
}

function UnlockIcon({ method }) {
  switch (method) {
    case 'shop':
      return <Coins size={12} />;
    case 'xp':
      return <Star size={12} />;
    case 'streak':
      return <Flame size={12} />;
    case 'quest_drop':
      return <Sparkles size={12} />;
    default:
      return null;
  }
}

export default function AvatarShop() {
  const { user, updateUser } = useAuth();
  const isParent = user?.role === 'parent' || user?.role === 'admin';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchItems = useCallback(async () => {
    try {
      const data = await api('/api/avatar/items');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    fetchItems().finally(() => setLoading(false));
  }, [fetchItems]);

  useEffect(() => {
    const handler = () => fetchItems();
    window.addEventListener('ws:message', handler);
    return () => window.removeEventListener('ws:message', handler);
  }, [fetchItems]);

  const handlePurchase = async (item) => {
    setPurchasing(item.id);
    setMessage('');
    try {
      const res = await api(`/api/avatar/items/${item.id}/purchase`, { method: 'POST' });
      updateUser({ points_balance: res.points_balance });
      setMessage(`Открыто: ${item.display_name}!`);
      await fetchItems();
    } catch (err) {
      setMessage(err.message || 'Покупка не удалась');
    } finally {
      setPurchasing(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Only show non-default items (things you can actually unlock)
  const unlockableItems = items.filter((i) => !i.is_default);

  // Group by category
  const grouped = {};
  for (const item of unlockableItems) {
    if (filter !== 'all' && item.category !== filter) continue;
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  const userXp = user?.points_balance ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* XP balance (kids) or parent info banner */}
      {isParent ? (
        <div className="game-panel p-3 flex items-center gap-2 text-emerald text-sm">
          <Check size={16} />
          <span className="font-medium">Для родителей все предметы аватара открыты.</span>
        </div>
      ) : (
        <div className="game-panel p-3 flex items-center justify-between">
          <span className="text-cream text-sm font-medium">Ваш XP</span>
          <span className="flex items-center gap-1 text-gold text-sm font-bold">
            <Coins size={14} />
            {userXp}
          </span>
        </div>
      )}

      {message && (
        <div className={`p-2 rounded border text-sm ${
          message.includes('Открыто') ? 'border-emerald/40 bg-emerald/10 text-emerald' : 'border-crimson/40 bg-crimson/10 text-crimson'
        }`}>
          {message}
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${
            filter === 'all' ? 'border-accent bg-accent/15 text-accent' : 'border-border text-muted hover:text-cream'
          }`}
        >
          Все
        </button>
        {CATEGORY_ORDER.map((cat) => {
          const hasItems = unlockableItems.some((i) => i.category === cat);
          if (!hasItems) return null;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${
                filter === cat ? 'border-accent bg-accent/15 text-accent' : 'border-border text-muted hover:text-cream'
              }`}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          );
        })}
      </div>

      {/* Items by category */}
      {CATEGORY_ORDER.map((cat) => {
        const catItems = grouped[cat];
        if (!catItems || catItems.length === 0) return null;

        return (
          <div key={cat}>
            <h3 className="text-cream text-sm font-semibold mb-2">
              {CATEGORY_LABELS[cat] || cat}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {catItems.map((item) => {
                const owned = item.unlocked;
                const canBuy = item.unlock_method === 'shop' && !owned && userXp >= (item.unlock_value || 0);
                const isBuying = purchasing === item.id;

                return (
                  <div
                    key={item.id}
                    className={`rounded-md border p-3 transition-all ${RARITY_COLORS[item.rarity]} ${RARITY_BG[item.rarity]} ${
                      owned ? 'opacity-70' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="text-cream text-xs font-medium leading-tight">
                        {item.display_name}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${RARITY_BADGE[item.rarity]}`}>
                        {item.rarity}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-muted text-[11px] mb-2">
                      <UnlockIcon method={item.unlock_method} />
                      {unlockLabel(item)}
                    </div>

                    {owned ? (
                      <div className="flex items-center gap-1 text-emerald text-xs font-medium">
                        <Check size={12} />
                        Куплено
                      </div>
                    ) : item.unlock_method === 'shop' ? (
                      <button
                        onClick={() => handlePurchase(item)}
                        disabled={!canBuy || isBuying}
                        className={`w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded border text-xs font-medium transition-all ${
                          canBuy
                            ? 'border-gold/40 bg-gold/10 text-gold hover:bg-gold/20'
                            : 'border-border text-muted cursor-not-allowed opacity-50'
                        }`}
                      >
                        {isBuying ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <ShoppingBag size={12} />
                        )}
                        {isBuying ? 'Покупка...' : `Купить · ${item.unlock_value} XP`}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-muted text-xs">
                        <Lock size={12} />
                        {item.unlock_method === 'quest_drop' ? 'Найдите в заданиях' :
                         item.unlock_method === 'xp' ? `Наберите всего ${item.unlock_value} XP` :
                         item.unlock_method === 'streak' ? `${item.unlock_value}-дневная серия` :
                         'Заблокировано'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-12 text-muted">
          <Sparkles size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">В этой категории нет предметов.</p>
        </div>
      )}
    </div>
  );
}
