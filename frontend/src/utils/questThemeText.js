/**
 * Maps seed quest titles to enchanted (princess/fairy-tale) alternate
 * titles and descriptions, used when a "girl" colour theme is active.
 */

import { COLOR_THEMES } from '../hooks/useTheme';

/** Girl theme IDs derived from the single source of truth in COLOR_THEMES */
const GIRL_THEME_IDS = new Set(
  COLOR_THEMES.filter((t) => t.group === 'girl').map((t) => t.id)
);

const ENCHANTED_MAP = {
  'The Chamber of Rest': {
    title: 'Королевские покои',
    description:
      'Войди в королевские покои и верни им блеск. Расправь подушки, поправь шелковые одеяла и создай уют, достойный принцессы.',
  },
  "Dishwasher's Oath": {
    title: 'Церемония хрустальных кубков',
    description:
      'Хрустальные кубки и волшебные тарелки после королевского пира ждут твоей заботы. Начисти каждую драгоценность и верни на место в дворцовый шкаф.',
  },
  "The Scholar's Burden": {
    title: 'Свитки академии',
    description:
      'Королевская академия прислала свитки мудрости. Сядь за волшебный стол, открой учебные книги заклинаний и освой магические уроки.',
  },
  'Cauldron Duty': {
    title: 'Королевский пир',
    description:
      'Дворцовый пир нужно подготовить. Помоги королевскому повару разложить ингредиенты, помешай волшебный бульон и накрой большой стол для двора.',
  },
  'The Folding Ritual': {
    title: 'Зачарованный гардероб',
    description:
      'От феи-прачки прибыли свежие зачарованные наряды. Разбери их по цветам, аккуратно сложи и разнеси по королевским шкафам.',
  },
  "Beast Keeper's Round": {
    title: 'Забота о королевских питомцах',
    description:
      'Королевским питомцам и волшебным существам нужна твоя забота. Наполни их хрустальные миски, обнови воду и приведи в порядок уютные лежанки.',
  },
  'Garden of the Ancients': {
    title: 'Зачарованные сады',
    description:
      'Зачарованные дворцовые сады ждут заботливых рук. Ухаживай за розами фей, полей цветы желаний и подмети сверкающие дорожки.',
  },
  'The Porcelain Throne': {
    title: 'Королевская купальня',
    description:
      'Королевской купальне нужна твоя помощь. Отполируй волшебные зеркала, отмой хрустальный умывальник и доведи всё до сияния.',
  },
  'Sweeping the Great Hall': {
    title: 'Сияние бального зала',
    description:
      'Фейская и звездная пыль осела в большом бальном зале. Возьми волшебную метлу и верни полу прежний блеск.',
  },
  "Merchant's Errand": {
    title: 'Приключение на рыночный день',
    description:
      'Дворцу нужны припасы из деревни. Отправляйся с королевским управляющим в увлекательный путь по волшебному рынку.',
  },
  'The Royal Table': {
    title: 'Большое чаепитие',
    description:
      'Волшебное чаепитие уже близко, а стол пуст. Расставь изящную посуду, разложи хрустальные кубки и подготовь зал к королевскому приему.',
  },
  'Bin Banishment': {
    title: 'Заклинание исчезновения',
    description:
      'Ненужные вещи захламляют дворец. Собери их в волшебные мешки и вынеси за ворота замка, пока они не привлекли озорных пикси.',
  },
  'The Dawn Ritual': {
    title: 'Утренняя звездная улыбка',
    description:
      'Когда над королевством поднимается утренняя звезда, загляни к зачарованному умывальнику и почисти зубы. Две минуты сияния поддержат волшебный блеск на весь день.',
  },
  'The Twilight Ritual': {
    title: 'Лунное сияние',
    description:
      'Перед сном вернись к зачарованному умывальнику. Сотри щеткой следы дневных приключений и дай улыбке засиять под луной.',
  },
  "The Warrior's Cleanse": {
    title: 'Хрустальный водопад',
    description:
      'Встань под хрустальный водопад, смой усталость дня и выйди свежей и сияющей, готовой к волшебным снам.',
  },
  'Armour Up': {
    title: 'Королевский наряд',
    description:
      'Принцесса всегда готова. Выбери лучший наряд из зачарованного гардероба, оденься с изяществом и покажись королевскому двору.',
  },
  "The Scholar's Pack": {
    title: 'Сумка принцессы',
    description:
      'До звонка в академии собери волшебные перья, тетради со звездной пылью и книги заклинаний. Сложи всё в сумку для магического учебного дня.',
  },
  "The Hound's March": {
    title: 'Прогулка с волшебным существом',
    description:
      'Твой верный спутник мечтает о прогулке по зачарованным тропам. Пристегни поводок и отправляйтесь исследовать сказочные дорожки вместе.',
  },
  "Dragon's Den Duty": {
    title: 'Уютный уголок питомца',
    description:
      'Зачарованному уголку твоего питомца нужна уборка. Взбей подстилку, наведи порядок и сделай место уютным для любимого спутника.',
  },
  'The Sacred Water Bowl': {
    title: 'Хрустальный фонтан',
    description:
      'Хрустальный фонтанчик питомца опустел. Промой его, налей свежую воду и порадуйся, как довольный друг пьет.',
  },
  "Tome Reader's Quest": {
    title: 'Чтение в башне',
    description:
      'В библиотеке башни хранятся волшебные сказки и истории. Найди уютный уголок, открой книгу и читай двадцать магических минут.',
  },
  "Bard's Practice": {
    title: 'Репетиция песни фей',
    description:
      'Цветы фей распускаются только под красивую мелодию. Возьми инструмент, потренируй волшебные песни и наполни дворец музыкой.',
  },
  'Spell Studies': {
    title: 'Уроки чар',
    description:
      'Королевская академия ждет, что ты выучишь чары этой недели. Повтори свитки правописания и отработай каждое волшебное слово.',
  },
  'The Lawn Guardian': {
    title: 'Задание садовой феи',
    description:
      'Зачарованные луга вокруг дворца заросли травой фей. Возьми волшебную косилку и верни сверкающим полянам порядок.',
  },
};

/**
 * Return a themed title for a chore.
 * Falls back to the original title if no override exists.
 */
export function themedTitle(originalTitle, colorTheme) {
  if (!GIRL_THEME_IDS.has(colorTheme)) return originalTitle;
  return ENCHANTED_MAP[originalTitle]?.title || originalTitle;
}

/**
 * Return a themed description for a chore.
 * Falls back to the original description if no override exists.
 */
export function themedDescription(originalTitle, originalDescription, colorTheme) {
  if (!GIRL_THEME_IDS.has(colorTheme)) return originalDescription;
  return ENCHANTED_MAP[originalTitle]?.description || originalDescription;
}
