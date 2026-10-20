import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  createContext,
  useContext,
  memo,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Download,
  GitBranch,
  Globe,
  Layers,
  Package,
  RotateCcw,
  Ship,
  Star,
} from 'lucide-react';

import { SKILLS, EVE_ICON, formatTime, formatNumber } from './data/eveData';
import {
  UI,
  type Language,
  getMineralName,
  getSkillName,
  getSkillDescription,
} from './data/localization';
import { TITANS, TITAN_LIST } from './data/titans';
import { ALL_COMPONENTS_TREE, type ProductionNode } from './data/productionTree';
import { ProductionTreeView } from './components/ProductionTreeView';
import { downloadAllSources } from './utils/downloadSources';

type Tab = 'overview' | 'components' | 'minerals' | 'time' | 'tree' | 'progress';
type ComponentCategory = 'standard' | 'advanced' | 'special';

interface ComponentRequirement {
  categoryId: ComponentCategory;
  typeId: number;
  quantity: number;
  node: ProductionNode;
}

interface TimeJob {
  typeId: number;
  name: string;
  unitTime: number;
  count: number;
  total: number;
  category: ComponentCategory;
}

const STORAGE_KEY = 'eve-titan-calc:v2';
const CATEGORY_ORDER: ComponentCategory[] = ['standard', 'advanced', 'special'];
const IMPORTANT_SKILL_IDS = [3386, 3388, 20533];
const VALID_TABS: Tab[] = ['overview', 'components', 'minerals', 'time', 'tree', 'progress'];

const LanguageContext = createContext<{
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof UI.en;
}>({
  lang: 'en',
  setLang: () => {},
  t: UI.en,
});

function useLang() {
  return useContext(LanguageContext);
}

const X: Record<Language, Record<string, string>> = {
  en: {
    overview: 'Overview',
    progress: 'Progress',
    settings: 'Settings',
    parallelSlots: 'Parallel production slots',
    completed: 'Completed',
    resetProgress: 'Reset progress',
    search: 'Search component...',
    noResults: 'No components found',
    totalUnits: 'Total units',
    timePerUnit: 'Time / unit',
    totalTime: 'Total time',
    markDone: 'Mark produced',
    markUndone: 'Mark not produced',
    downloadSources: 'Download sources',
    downloading: 'Packing...',
    blueprintHint: 'ME lowers material use. TE and industry skills lower production time.',
    finalAssembly: 'Final Titan assembly',
    componentWork: 'Component work',
    lowerBound: 'Theoretical lower bound',
    scheduleEstimate: 'Greedy schedule estimate',
    bonuses: 'Bonuses',
    resources: 'Resources',
    timeEstimates: 'Time estimates',
    productionTree: 'Production tree',
    quantity: 'Qty',
    share: 'Share',
    percentComplete: '{percent}% complete',
    topConsumers: 'Top time consumers',
    standard: 'Standard',
    advanced: 'Advanced',
    special: 'Special',
    language: 'Language',
    titan: 'Titan',
    info: 'Information',
    required: 'Required',
  },
  ru: {
    overview: 'Обзор',
    progress: 'Прогресс',
    settings: 'Настройки',
    parallelSlots: 'Параллельные производственные линии',
    completed: 'Выполнено',
    resetProgress: 'Сбросить прогресс',
    search: 'Поиск компонента...',
    noResults: 'Компоненты не найдены',
    totalUnits: 'Всего единиц',
    timePerUnit: 'Время / шт',
    totalTime: 'Общее время',
    markDone: 'Отметить произведённым',
    markUndone: 'Отметить не произведённым',
    downloadSources: 'Скачать исходники',
    downloading: 'Упаковка...',
    blueprintHint: 'ME снижает расход материалов. TE и промышленные навыки снижают время производства.',
    finalAssembly: 'Финальная сборка титана',
    componentWork: 'Производство компонентов',
    lowerBound: 'Теоретический минимум',
    scheduleEstimate: 'Оценка очередности',
    bonuses: 'Бонусы',
    resources: 'Ресурсы',
    timeEstimates: 'Оценка времени',
    productionTree: 'Дерево производства',
    quantity: 'Кол-во',
    share: 'Доля',
    percentComplete: '{percent}% выполнено',
    topConsumers: 'Основные потребители времени',
    standard: 'Стандартные',
    advanced: 'Продвинутые',
    special: 'Специальные',
    language: 'Язык',
    titan: 'Титан',
    info: 'Информация',
    required: 'Требуется',
  },
};

function loadPersisted(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function estimateParallelTime(jobs: TimeJob[], slots: number): number {
  const totalUnits = jobs.reduce((sum, job) => sum + job.count, 0);
  if (totalUnits === 0) return 0;

  const machineCount = clampNumber(slots, 1, totalUnits);

  if (machineCount === 1) {
    return jobs.reduce((sum, job) => sum + job.total, 0);
  }

  if (machineCount >= totalUnits) {
    return jobs.reduce((max, job) => Math.max(max, job.unitTime), 0);
  }

  const ends = new Array(machineCount).fill(0) as number[];
  const sorted = [...jobs].sort((a, b) => b.unitTime - a.unitTime);

  for (const job of sorted) {
    for (let i = 0; i < job.count; i += 1) {
      let minIndex = 0;
      for (let machine = 1; machine < ends.length; machine += 1) {
        if (ends[machine] < ends[minIndex]) {
          minIndex = machine;
        }
      }
      ends[minIndex] += job.unitTime;
    }
  }

  return ends.reduce((max, value) => Math.max(max, value), 0);
}

function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
      <Globe className="ml-1 h-3.5 w-3.5 text-gray-400" />
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`rounded px-2 py-1 text-xs font-bold transition-all ${
          lang === 'en'
            ? 'border border-amber-500/30 bg-amber-500/20 text-amber-300'
            : 'text-gray-400 hover:text-white'
        }`}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang('ru')}
        className={`rounded px-2 py-1 text-xs font-bold transition-all ${
          lang === 'ru'
            ? 'border border-amber-500/30 bg-amber-500/20 text-amber-300'
            : 'text-gray-400 hover:text-white'
        }`}
        aria-pressed={lang === 'ru'}
      >
        RU
      </button>
    </div>
  );
}

function TitanSelector({
  selectedTitan,
  onSelect,
  lang,
}: {
  selectedTitan: string;
  onSelect: (key: string) => void;
  lang: Language;
}) {
  const isRussian = lang === 'ru';

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-2">
      {TITAN_LIST.map((titan) => {
        const isSelected = selectedTitan === titan.key;

        return (
          <button
            key={titan.key}
            type="button"
            onClick={() => onSelect(titan.key)}
            className={`relative rounded-xl border p-3 text-left transition-all ${
              isSelected
                ? 'border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
            }`}
            aria-pressed={isSelected}
          >
            <div className="flex flex-col items-center gap-2">
              <img
                src={titan.icon}
                alt={titan.name}
                className="h-14 w-14 rounded-lg bg-black/30 object-contain"
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.style.visibility = 'hidden';
                }}
              />
              <div className="text-center">
                <p className="text-sm font-bold text-white">{titan.name}</p>
                <p className="text-xs text-gray-400">
                  {isRussian ? titan.raceRu : titan.race}
                </p>
              </div>
            </div>

            {isSelected ? (
              <CheckCircle2 className="absolute right-2 top-2 h-5 w-5 text-amber-400" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function SkillSlider({
  skill,
  value,
  onChange,
  lang,
}: {
  skill: (typeof SKILLS)[number];
  value: number;
  onChange: (value: number) => void;
  lang: Language;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-all hover:border-white/20">
      <div className="flex items-start gap-3">
        <img
          src={skill.icon}
          alt={getSkillName(skill.typeId, lang)}
          className="h-10 w-10 rounded-lg bg-black/30 object-contain"
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.src = EVE_ICON(skill.typeId, 32);
          }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-white">
              {getSkillName(skill.typeId, lang)}
            </span>

            {skill.requiredLevel > 0 ? (
              <span className="rounded border border-red-800/30 bg-red-900/20 px-1.5 py-0.5 text-[10px] text-red-300">
                {lang === 'ru' ? 'ТРБ' : 'REQ'} L{skill.requiredLevel}
              </span>
            ) : null}
          </div>

          <p className="mt-0.5 text-[11px] text-gray-400">
            {getSkillDescription(skill.typeId, lang)}
          </p>

          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={skill.maxLevel}
              value={value}
              onChange={(event) => onChange(clampNumber(Number(event.target.value), 0, skill.maxLevel))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-700"
              aria-label={getSkillName(skill.typeId, lang)}
            />
            <span className="w-8 text-right font-mono text-sm text-indigo-300">
              {value}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  accent = 'text-amber-300',
}: {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-gray-400">{title}</p>
          <p className="mt-1 truncate text-xl font-bold text-white">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
        </div>
        <div className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-white/5 ${accent}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

const categoryStyles: Record<ComponentCategory, string> = {
  standard: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
  advanced: 'border-violet-500/30 bg-violet-500/15 text-violet-300',
  special: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
};

const ComponentRow = memo(function ComponentRow({
  req,
  lang,
  materialMultiplier,
  timeMultiplier,
  completed,
  onToggle,
}: {
  req: ComponentRequirement;
  lang: Language;
  materialMultiplier: number;
  timeMultiplier: number;
  completed: boolean;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isRussian = lang === 'ru';
  const x = X[lang];

  const name = isRussian ? req.node.nameRu : req.node.name;
  const unitTime = (req.node.productionTime ?? 0) * timeMultiplier;
  const total = unitTime * req.quantity;
  const materials = req.node.materials ?? [];
  const visibleMaterials = open ? materials : materials.slice(0, 4);

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3 transition-all hover:border-white/20">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={completed}
          aria-label={completed ? x.markUndone : x.markDone}
          className="mt-1 shrink-0 rounded text-gray-500 transition-colors hover:text-amber-300"
        >
          {completed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>

        <img
          src={req.node.icon}
          alt={name}
          className="h-11 w-11 flex-shrink-0 rounded-lg bg-black/30 object-contain"
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.style.visibility = 'hidden';
          }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">{name}</span>

            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] ${categoryStyles[req.categoryId]}`}
            >
              {x[req.categoryId]}
            </span>

            <span className="font-mono text-[10px] text-gray-500">ID {req.typeId}</span>
          </div>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            <span className="font-mono font-semibold text-cyan-300">
              ×{req.quantity.toLocaleString()}
            </span>
            <span>
              {x.timePerUnit}: <span className="font-mono text-gray-300">{formatTime(unitTime)}</span>
            </span>
            <span>
              {x.totalTime}: <span className="font-mono text-gray-300">{formatTime(total)}</span>
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {visibleMaterials.map((material) => {
              const adjusted = Math.ceil(material.quantity * materialMultiplier);

              return (
                <span
                  key={material.typeId}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-300"
                >
                  <img
                    src={EVE_ICON(material.typeId, 16)}
                    alt=""
                    className="h-4 w-4 object-contain"
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                      event.currentTarget.style.visibility = 'hidden';
                    }}
                  />
                  <span className="max-w-[140px] truncate">
                    {isRussian ? material.nameRu : material.name}
                  </span>
                  <b className="font-mono text-yellow-300">×{adjusted.toLocaleString()}</b>
                </span>
              );
            })}

            {materials.length > 4 ? (
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-white/10"
                aria-expanded={open}
              >
                {open ? (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    {isRussian ? 'Свернуть' : 'Collapse'}
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    +{materials.length - 4}
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
});

export default function App() {
  const persisted = useMemo(loadPersisted, []);

  const [lang, setLang] = useState<Language>(persisted?.lang === 'ru' ? 'ru' : 'en');
  const [selectedTitan, setSelectedTitan] = useState<string>(
    persisted?.selectedTitan && TITANS[persisted.selectedTitan] ? persisted.selectedTitan : 'avatar'
  );
  const [skills, setSkills] = useState<Record<number, number>>(() => {
    const base: Record<number, number> = {};
    SKILLS.forEach((skill) => {
      base[skill.typeId] = skill.typeId === 20533 ? 5 : 0;
    });
    return { ...base, ...(persisted?.skills ?? {}) };
  });
  const [blueprintME, setBlueprintME] = useState<number>(clampNumber(persisted?.blueprintME ?? 0, 0, 10));
  const [blueprintTE, setBlueprintTE] = useState<number>(clampNumber(persisted?.blueprintTE ?? 0, 0, 10));
  const [slots, setSlots] = useState<number>(clampNumber(persisted?.slots ?? 5, 1, 100));
  const [progress, setProgress] = useState<Record<string, boolean>>(persisted?.progress ?? {});
  const [activeTab, setActiveTab] = useState<Tab>(
    VALID_TABS.includes(persisted?.activeTab) ? persisted.activeTab : 'overview'
  );
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lang,
          selectedTitan,
          skills,
          blueprintME,
          blueprintTE,
          slots,
          progress,
          activeTab,
        })
      );
    } catch {
      // Ignore storage errors.
    }
  }, [lang, selectedTitan, skills, blueprintME, blueprintTE, slots, progress, activeTab]);

  const t = UI[lang];
  const x = X[lang];
  const isRussian = lang === 'ru';

  const contextValue = useMemo(
    () => ({
      lang,
      setLang,
      t,
    }),
    [lang, t]
  );

  const componentMap = useMemo(() => {
    const map = new Map<number, ProductionNode>();
    ALL_COMPONENTS_TREE.forEach((node) => map.set(node.typeId, node));
    return map;
  }, []);

  const titan = TITANS[selectedTitan] ?? TITANS.avatar;

  const requirements = useMemo<ComponentRequirement[]>(() => {
    const list: ComponentRequirement[] = [];

    CATEGORY_ORDER.forEach((category) => {
      const record = titan.components[category] as Record<number, number>;

      Object.entries(record).forEach(([idString, quantity]) => {
        const typeId = Number(idString);
        const node = componentMap.get(typeId);

        if (node && quantity > 0) {
          list.push({
            categoryId: category,
            typeId,
            quantity,
            node,
          });
        }
      });
    });

    return list;
  }, [titan, componentMap]);

  const filteredRequirements = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requirements;

    return requirements.filter((req) => {
      const name = (isRussian ? req.node.nameRu : req.node.name).toLowerCase();
      return name.includes(query) || String(req.typeId).includes(query);
    });
  }, [requirements, search, isRussian]);

  const materialMultiplier = Math.max(0.01, 1 - blueprintME / 100);

  const timeMultiplier = useMemo(() => {
    const industry = skills[3386] ?? 0;
    const advancedIndustry = skills[3388] ?? 0;

    return Math.max(
      0.01,
      (1 - blueprintTE / 100) * (1 - industry * 0.04) * (1 - advancedIndustry * 0.05)
    );
  }, [skills, blueprintTE]);

  const mineralTotals = useMemo(() => {
    const map = new Map<number, number>();

    for (const req of requirements) {
      for (const material of req.node.materials ?? []) {
        const value = material.quantity * req.quantity * materialMultiplier;
        map.set(material.typeId, (map.get(material.typeId) ?? 0) + value);
      }
    }

    const list = Array.from(map, ([typeId, raw]) => ({
      typeId,
      quantity: Math.ceil(raw),
    }));

    const totalUnits = list.reduce((sum, item) => sum + item.quantity, 0);
    list.sort((a, b) => b.quantity - a.quantity);

    return { list, totalUnits };
  }, [requirements, materialMultiplier]);

  const timeJobs = useMemo<TimeJob[]>(() => {
    return requirements
      .map((req) => {
        const unitTime = (req.node.productionTime ?? 0) * timeMultiplier;

        return {
          typeId: req.typeId,
          name: isRussian ? req.node.nameRu : req.node.name,
          unitTime,
          count: req.quantity,
          total: unitTime * req.quantity,
          category: req.categoryId,
        };
      })
      .filter((job) => job.unitTime > 0 && job.count > 0)
      .sort((a, b) => b.total - a.total);
  }, [requirements, timeMultiplier, isRussian]);

  const sequentialComponentTime = useMemo(
    () => timeJobs.reduce((sum, job) => sum + job.total, 0),
    [timeJobs]
  );

  const parallelComponentTime = useMemo(
    () => estimateParallelTime(timeJobs, slots),
    [timeJobs, slots]
  );

  const finalAssemblyTime = useMemo(() => titan.baseTime * timeMultiplier, [titan.baseTime, timeMultiplier]);

  const totalSequentialTime = sequentialComponentTime + finalAssemblyTime;
  const totalParallelTime = parallelComponentTime + finalAssemblyTime;

  const maxUnitTime = useMemo(
    () => timeJobs.reduce((max, job) => Math.max(max, job.unitTime), 0),
    [timeJobs]
  );

  const theoreticalLowerBound = useMemo(
    () => Math.max(maxUnitTime, sequentialComponentTime / Math.max(1, slots)),
    [maxUnitTime, sequentialComponentTime, slots]
  );

  const totalComponentUnits = useMemo(
    () => requirements.reduce((sum, req) => sum + req.quantity, 0),
    [requirements]
  );

  const completedCount = useMemo(
    () =>
      requirements.reduce(
        (count, req) => (progress[`${selectedTitan}:${req.typeId}`] ? count + 1 : count),
        0
      ),
    [requirements, progress, selectedTitan]
  );

  const progressPercent = requirements.length
    ? Math.round((completedCount / requirements.length) * 100)
    : 0;

  const toggleProgress = useCallback(
    (typeId: number) => {
      const key = `${selectedTitan}:${typeId}`;
      setProgress((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    },
    [selectedTitan]
  );

  const resetProgress = useCallback(() => {
    setProgress((prev) => {
      const next = { ...prev };
      requirements.forEach((req) => {
        delete next[`${selectedTitan}:${req.typeId}`];
      });
      return next;
    });
  }, [requirements, selectedTitan]);

  const setSkill = useCallback((typeId: number, value: number) => {
    setSkills((prev) => ({
      ...prev,
      [typeId]: value,
    }));
  }, []);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      await downloadAllSources();
    } catch (error) {
      console.error(error);
      alert(isRussian ? 'Не удалось собрать архив исходников.' : 'Failed to create source archive.');
    } finally {
      setDownloading(false);
    }
  }, [isRussian]);

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'overview', label: x.overview, icon: <Ship className="h-4 w-4" /> },
    { id: 'components', label: t.tabs.components, icon: <Package className="h-4 w-4" /> },
    { id: 'minerals', label: t.tabs.minerals, icon: <Layers className="h-4 w-4" /> },
    { id: 'time', label: t.tabs.time, icon: <Clock className="h-4 w-4" /> },
    { id: 'tree', label: x.productionTree, icon: <GitBranch className="h-4 w-4" /> },
    { id: 'progress', label: x.progress, icon: <CheckCircle2 className="h-4 w-4" /> },
  ];

  const card = 'rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-lg shadow-black/20';

  return (
    <LanguageContext.Provider value={contextValue}>
      <div className="min-h-screen text-gray-100">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#05070d]/85 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-300">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">{t.title}</h1>
                <p className="text-xs text-gray-400">{t.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-200 transition-all hover:bg-white/10 disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {downloading ? x.downloading : x.downloadSources}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className={card}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-300">
                {x.titan}
              </h2>
              <TitanSelector
                selectedTitan={selectedTitan}
                onSelect={setSelectedTitan}
                lang={lang}
              />
            </section>

            <section className={card}>
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-300">
                {t.blueprint.title}
              </h2>
              <p className="mb-4 text-xs text-gray-500">{x.blueprintHint}</p>

              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-gray-300">{t.blueprint.materialEfficiency}</span>
                    <span className="font-mono text-amber-300">{blueprintME}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={blueprintME}
                    onChange={(event) =>
                      setBlueprintME(clampNumber(Number(event.target.value), 0, 10))
                    }
                    className="h-1.5 cursor-pointer appearance-none rounded-full bg-gray-700"
                    aria-label={t.blueprint.materialEfficiency}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {t.blueprint.materialMultiplier}:{' '}
                    <span className="font-mono text-gray-300">
                      {(materialMultiplier * 100).toFixed(0)}%
                    </span>
                  </p>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-gray-300">{t.blueprint.timeEfficiency}</span>
                    <span className="font-mono text-amber-300">{blueprintTE}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={blueprintTE}
                    onChange={(event) =>
                      setBlueprintTE(clampNumber(Number(event.target.value), 0, 10))
                    }
                    className="h-1.5 cursor-pointer appearance-none rounded-full bg-gray-700"
                    aria-label={t.blueprint.timeEfficiency}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {t.blueprint.timeMultiplier}:{' '}
                    <span className="font-mono text-gray-300">
                      {(timeMultiplier * 100).toFixed(1)}%
                    </span>
                  </p>
                </div>
              </div>
            </section>

            <section className={card}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
                {t.skills.title}
              </h2>
              <p className="mb-3 text-xs text-gray-500">{t.skills.subtitle}</p>

              <div className="space-y-2">
                {IMPORTANT_SKILL_IDS.map((skillId) => {
                  const skill = SKILLS.find((item) => item.typeId === skillId);
                  if (!skill) return null;

                  return (
                    <SkillSlider
                      key={skill.typeId}
                      skill={skill}
                      value={skills[skill.typeId] ?? 0}
                      onChange={(value) => setSkill(skill.typeId, value)}
                      lang={lang}
                    />
                  );
                })}
              </div>
            </section>

            <section className={card}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-300">
                {x.parallelSlots}
              </h2>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={slots}
                  onChange={(event) => setSlots(clampNumber(Number(event.target.value), 1, 100))}
                  className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm outline-none focus:border-amber-500/50"
                  aria-label={x.parallelSlots}
                />
                <p className="text-xs text-gray-500">{x.scheduleEstimate}</p>
              </div>
            </section>
          </aside>

          <section className="min-w-0">
            <div
              role="tablist"
              aria-label="Calculator sections"
              className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/5 p-1"
            >
              {tabs.map((tab) => {
                const active = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                      active
                        ? 'border-amber-500/30 bg-amber-500/20 text-amber-200'
                        : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="mt-4 space-y-4"
              >
                {activeTab === 'overview' ? (
                  <>
                    <div className={`${card} flex flex-col gap-4 sm:flex-row`}>
                      <img
                        src={titan.render}
                        alt={titan.name}
                        className="h-44 w-full rounded-xl bg-black/40 object-contain sm:h-52 sm:w-72"
                        loading="lazy"
                        decoding="async"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-bold text-white">{titan.name}</h2>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-gray-300">
                            {isRussian ? titan.raceRu : titan.race}
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-relaxed text-gray-300">
                          {isRussian ? titan.descriptionRu : titan.description}
                        </p>

                        <h3 className="mt-4 text-sm font-semibold text-amber-300">{x.bonuses}</h3>
                        <ul className="mt-2 grid gap-1 text-sm text-gray-300 sm:grid-cols-2">
                          {(isRussian ? titan.bonusesRu : titan.bonuses).map((bonus) => (
                            <li key={bonus} className="flex gap-2">
                              <Star className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                              <span>{bonus}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard
                        icon={<Layers className="h-5 w-5" />}
                        title={x.resources}
                        value={formatNumber(mineralTotals.totalUnits)}
                        subtitle={t.minerals.title}
                        accent="text-sky-300"
                      />

                      <StatCard
                        icon={<Package className="h-5 w-5" />}
                        title={x.totalUnits}
                        value={totalComponentUnits.toLocaleString()}
                        subtitle={t.tabs.components}
                        accent="text-emerald-300"
                      />

                      <StatCard
                        icon={<Clock className="h-5 w-5" />}
                        title={x.timeEstimates}
                        value={formatTime(totalSequentialTime)}
                        subtitle={t.time.totalProductionTime}
                        accent="text-violet-300"
                      />

                      <StatCard
                        icon={<CheckCircle2 className="h-5 w-5" />}
                        title={x.progress}
                        value={x.percentComplete.replace('{percent}', String(progressPercent))}
                        subtitle={`${completedCount}/${requirements.length}`}
                        accent="text-amber-300"
                      />
                    </div>
                  </>
                ) : null}

                {activeTab === 'components' ? (
                  <>
                    <div className={card}>
                      <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={x.search}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition-colors focus:border-amber-500/50"
                        aria-label={x.search}
                      />
                    </div>

                    {filteredRequirements.length === 0 ? (
                      <div className={card}>
                        <p className="text-sm text-gray-400">{x.noResults}</p>
                      </div>
                    ) : (
                      CATEGORY_ORDER.map((category) => {
                        const items = filteredRequirements.filter(
                          (req) => req.categoryId === category
                        );

                        if (items.length === 0) return null;

                        return (
                          <section key={category} className={card}>
                            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-300">
                              {x[category]}
                            </h2>

                            <div className="space-y-2">
                              {items.map((req) => (
                                <ComponentRow
                                  key={req.typeId}
                                  req={req}
                                  lang={lang}
                                  materialMultiplier={materialMultiplier}
                                  timeMultiplier={timeMultiplier}
                                  completed={Boolean(progress[`${selectedTitan}:${req.typeId}`])}
                                  onToggle={() => toggleProgress(req.typeId)}
                                />
                              ))}
                            </div>
                          </section>
                        );
                      })
                    )}
                  </>
                ) : null}

                {activeTab === 'minerals' ? (
                  <section className={card}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-white">{t.minerals.title}</h2>
                        <p className="mt-1 text-sm text-gray-400">
                          {t.minerals.subtitle
                            .replace('{me}', String(blueprintME))
                            .replace('{count}', String(requirements.length))}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-right">
                        <p className="text-xs text-gray-400">{x.totalUnits}</p>
                        <p className="font-mono text-lg font-bold text-amber-300">
                          {formatNumber(mineralTotals.totalUnits)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full min-w-[520px] text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                            <th className="pb-2">{isRussian ? 'Минерал' : 'Mineral'}</th>
                            <th className="pb-2 text-right">{x.quantity}</th>
                            <th className="pb-2 text-right">{x.share}</th>
                          </tr>
                        </thead>

                        <tbody>
                          {mineralTotals.list.map((mineral) => {
                            const share = mineralTotals.totalUnits
                              ? (mineral.quantity / mineralTotals.totalUnits) * 100
                              : 0;

                            return (
                              <tr key={mineral.typeId} className="border-t border-white/5">
                                <td className="py-2">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={EVE_ICON(mineral.typeId, 24)}
                                      alt=""
                                      className="h-6 w-6 object-contain"
                                      loading="lazy"
                                      decoding="async"
                                      onError={(event) => {
                                        event.currentTarget.style.visibility = 'hidden';
                                      }}
                                    />
                                    <span className="text-gray-200">
                                      {getMineralName(mineral.typeId, lang)}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-2 text-right font-mono text-yellow-300">
                                  {mineral.quantity.toLocaleString()}
                                </td>

                                <td className="py-2 text-right font-mono text-gray-400">
                                  {share.toFixed(1)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/90">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <p>{t.minerals.warning}</p>
                    </div>
                  </section>
                ) : null}

                {activeTab === 'time' ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard
                        icon={<Ship className="h-5 w-5" />}
                        title={x.finalAssembly}
                        value={formatTime(finalAssemblyTime)}
                        subtitle={`${t.blueprint.avatarBuildTime}: ${formatTime(titan.baseTime)}`}
                        accent="text-rose-300"
                      />

                      <StatCard
                        icon={<Package className="h-5 w-5" />}
                        title={x.componentWork}
                        value={formatTime(sequentialComponentTime)}
                        subtitle={t.time.totalProductionTime}
                        accent="text-sky-300"
                      />

                      <StatCard
                        icon={<Layers className="h-5 w-5" />}
                        title={t.time.withParallelLines}
                        value={formatTime(parallelComponentTime)}
                        subtitle={`${slots} ${t.time.productionSlots}`}
                        accent="text-emerald-300"
                      />

                      <StatCard
                        icon={<Clock className="h-5 w-5" />}
                        title={x.lowerBound}
                        value={formatTime(theoreticalLowerBound)}
                        subtitle={x.scheduleEstimate}
                        accent="text-violet-300"
                      />
                    </div>

                    <section className={card}>
                      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-300">
                        {x.topConsumers}
                      </h2>

                      <div className="space-y-3">
                        {timeJobs.slice(0, 8).map((job) => {
                          const maxTotal = timeJobs[0]?.total || 1;
                          const width = Math.max(2, (job.total / maxTotal) * 100);

                          return (
                            <div key={job.typeId}>
                              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                <span className="truncate text-gray-200">{job.name}</span>
                                <span className="flex-shrink-0 font-mono text-gray-400">
                                  {formatTime(job.total)}
                                </span>
                              </div>

                              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
                                  style={{ width: `${width}%` }}
                                />
                              </div>

                              <p className="mt-1 text-xs text-gray-500">
                                {formatTime(job.unitTime)} × {job.count.toLocaleString()}
                              </p>
                            </div>
                          );
                        })}

                        {timeJobs.length === 0 ? (
                          <p className="text-sm text-gray-400">{x.noResults}</p>
                        ) : null}
                      </div>
                    </section>
                  </>
                ) : null}

                {activeTab === 'tree' ? (
                  CATEGORY_ORDER.map((category) => {
                    const items = requirements.filter((req) => req.categoryId === category);

                    if (items.length === 0) return null;

                    return (
                      <section key={category} className={card}>
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-300">
                          {x[category]}
                        </h2>

                        <div className="space-y-2">
                          {items.map((req) => (
                            <ProductionTreeView
                              key={req.typeId}
                              node={{ ...req.node, quantity: req.quantity }}
                              blueprintME={blueprintME}
                              lang={lang}
                            />
                          ))}
                        </div>
                      </section>
                    );
                  })
                ) : null}

                {activeTab === 'progress' ? (
                  <section className={card}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-white">{x.progress}</h2>
                        <p className="mt-1 text-sm text-gray-400">
                          {completedCount}/{requirements.length} {t.common.components}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={resetProgress}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-200 transition-colors hover:bg-white/10"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {t.common.reset}
                      </button>
                    </div>

                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <p className="mt-2 text-right text-xs text-gray-400">
                      {x.percentComplete.replace('{percent}', String(progressPercent))}
                    </p>

                    <div className="mt-4 space-y-2">
                      {requirements.map((req) => (
                        <ComponentRow
                          key={req.typeId}
                          req={req}
                          lang={lang}
                          materialMultiplier={materialMultiplier}
                          timeMultiplier={timeMultiplier}
                          completed={Boolean(progress[`${selectedTitan}:${req.typeId}`])}
                          onToggle={() => toggleProgress(req.typeId)}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </section>
        </main>

        <footer className="border-t border-white/10 px-4 py-6 text-center text-xs text-gray-500">
          <p>{t.footer.copyright}</p>
          <p className="mt-1">{t.footer.dataSources}</p>
          <p className="mt-1">{t.footer.disclaimer}</p>
        </footer>
      </div>
    </LanguageContext.Provider>
  );
}