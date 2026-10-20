import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Calculator, CheckCircle2, Circle, Clock, Download,
  Globe, Layers, Package, RotateCcw, Ship, Star
} from 'lucide-react';
import { SKILLS, EVE_ICON, formatTime, formatNumber } from './data/eveData';
import { UI, type Language, getMineralName, getSkillName, getSkillDescription } from './data/localization';
import { TITANS, TITAN_LIST } from './data/titans';
import { ALL_COMPONENTS_TREE, type ProductionNode } from './data/productionTree';
import { ProductionTreeView } from './components/ProductionTreeView';
import { downloadAllSources } from './utils/downloadSources';
import { loadState, saveState } from './lib/storage';
import {
  clampNumber, materialMultiplier, timeMultiplier, aggregateMinerals,
  buildTimeJobs, estimateParallelTime, sequentialTime, theoreticalLowerBound,
  type ComponentRequirement
} from './lib/calculations';

type Tab = 'overview' | 'components' | 'minerals' | 'time' | 'tree' | 'progress';
const TABS: Tab[] = ['overview', 'components', 'minerals', 'time', 'tree', 'progress'];
const CATS = ['standard', 'advanced', 'special'] as const;
const KEY_SKILLS = [3386, 3388, 20533];

export default function App() {
  const saved = useMemo(loadState, []);
  const [lang, setLang] = useState<Language>(saved?.lang === 'ru' ? 'ru' : 'en');
  const [titanKey, setTitanKey] = useState(saved?.selectedTitan && TITANS[saved.selectedTitan] ? saved.selectedTitan : 'avatar');
  const [skills, setSkills] = useState<Record<number, number>>(() => {
    const base: Record<number, number> = {};
    SKILLS.forEach((s) => { base[s.typeId] = s.typeId === 20533 ? 5 : 0; });
    return { ...base, ...(saved?.skills ?? {}) };
  });
  const [me, setMe] = useState(clampNumber(saved?.blueprintME ?? 0, 0, 10));
  const [te, setTe] = useState(clampNumber(saved?.blueprintTE ?? 0, 0, 10));
  const [slots, setSlots] = useState(clampNumber(saved?.slots ?? 5, 1, 100));
  const [progress, setProgress] = useState<Record<string, boolean>>(saved?.progress ?? {});
  const [tab, setTab] = useState<Tab>(TABS.includes(saved?.activeTab as Tab) ? (saved?.activeTab as Tab) : 'overview');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  const t = UI[lang];
  const ru = lang === 'ru';
  const titan = TITANS[titanKey];

  useEffect(() => {
    saveState({ lang, selectedTitan: titanKey, skills, blueprintME: me, blueprintTE: te, slots, progress, activeTab: tab });
  }, [lang, titanKey, skills, me, te, slots, progress, tab]);

  const nodeMap = useMemo(() => new Map<number, ProductionNode>(ALL_COMPONENTS_TREE.map((n) => [n.typeId, n])), []);

  const reqs = useMemo<ComponentRequirement[]>(() => {
    const out: ComponentRequirement[] = [];
    for (const c of CATS) {
      for (const [id, qty] of Object.entries(titan.components[c])) {
        const n = nodeMap.get(Number(id));
        if (n && qty > 0) {
          out.push({
            categoryId: c,
            typeId: Number(id),
            quantity: qty,
            name: n.name,
            nameRu: n.nameRu,
            productionTime: n.productionTime ?? 0,
            materials: Object.fromEntries(n.materials.map((m) => [m.typeId, m.quantity])) as Record<number, number>,
          });
        }
      }
    }
    return out;
  }, [titan, nodeMap]);

  const mm = materialMultiplier(me);
  const tm = timeMultiplier(te, skills[3386] ?? 0, skills[3388] ?? 0);
  const minerals = useMemo(() => aggregateMinerals(reqs, mm), [reqs, mm]);
  const jobs = useMemo(() => buildTimeJobs(reqs, tm, lang), [reqs, tm, lang]);
  const seq = sequentialTime(jobs);
  const par = estimateParallelTime(jobs, slots);
  const final = titan.baseTime * tm;
  const lower = theoreticalLowerBound(jobs, slots);
  const totalUnits = reqs.reduce((s, r) => s + r.quantity, 0);
  const done = reqs.filter((r) => progress[`${titanKey}:${r.typeId}`]).length;
  const pct = reqs.length ? Math.round((done / reqs.length) * 100) : 0;
  const filtered = q.trim()
    ? reqs.filter((r) => (ru ? r.nameRu : r.name).toLowerCase().includes(q.trim().toLowerCase()) || String(r.typeId).includes(q.trim()))
    : reqs;

  const labels: Record<Tab, string> = {
    overview: ru ? 'Обзор' : 'Overview',
    components: t.tabs.components,
    minerals: t.tabs.minerals,
    time: t.tabs.time,
    tree: ru ? 'Дерево' : 'Tree',
    progress: ru ? 'Прогресс' : 'Progress',
  };

  const toggle = (id: number) => setProgress((p) => ({ ...p, [`${titanKey}:${id}`]: !p[`${titanKey}:${id}`] }));
  const reset = () => setProgress((p) => {
    const n = { ...p };
    reqs.forEach((r) => delete n[`${titanKey}:${r.typeId}`]);
    return n;
  });
  const dl = async () => { setBusy(true); try { await downloadAllSources(); } finally { setBusy(false); } };

  const card = 'rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-lg shadow-black/20';
  const Stat = ({ icon, title, value, sub }: { icon: ReactNode; title: string; value: string; sub?: string }) => (
    <div className={card}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-gray-400">{title}</p>
          <p className="mt-1 truncate text-xl font-bold text-white">{value}</p>
          {sub ? <p className="mt-1 text-xs text-gray-500">{sub}</p> : null}
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-amber-300">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-gray-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#05070d]/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-300"><Calculator className="h-5 w-5" /></div>
            <div><h1 className="text-lg font-bold leading-tight">{t.title}</h1><p className="text-xs text-gray-400">{t.subtitle}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
              <Globe className="ml-1 h-3.5 w-3.5 text-gray-400" />
              {(['en', 'ru'] as Language[]).map((l) => (
                <button key={l} onClick={() => setLang(l)} className={`rounded px-2 py-1 text-xs font-bold ${lang === l ? 'bg-amber-500/20 text-amber-300' : 'text-gray-400 hover:text-white'}`}>{l.toUpperCase()}</button>
              ))}
            </div>
            <button onClick={dl} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-60">
              <Download className="h-4 w-4" />{busy ? (ru ? 'Упаковка...' : 'Packing...') : (ru ? 'Скачать исходники' : 'Download sources')}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className={card}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-300">{ru ? 'Титан' : 'Titan'}</h2>
            <div className="grid grid-cols-2 gap-2">
              {TITAN_LIST.map((x) => (
                <button key={x.key} onClick={() => setTitanKey(x.key)} className={`rounded-xl border p-2 text-center transition-all ${titanKey === x.key ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}>
                  <img src={x.icon} alt={x.name} className="mx-auto h-12 w-12 object-contain" loading="lazy" />
                  <p className="mt-1 text-xs font-bold">{x.name}</p>
                </button>
              ))}
            </div>
          </section>

          <section className={card}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-300">{t.blueprint.title}</h2>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-sm"><span>{t.blueprint.materialEfficiency}</span><span className="font-mono text-amber-300">{me}</span></div>
                <input type="range" min={0} max={10} value={me} onChange={(e) => setMe(clampNumber(Number(e.target.value), 0, 10))} className="w-full" />
                <p className="mt-1 text-xs text-gray-500">{t.blueprint.materialMultiplier}: <span className="font-mono">{Math.round(mm * 100)}%</span></p>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm"><span>{t.blueprint.timeEfficiency}</span><span className="font-mono text-amber-300">{te}</span></div>
                <input type="range" min={0} max={10} value={te} onChange={(e) => setTe(clampNumber(Number(e.target.value), 0, 10))} className="w-full" />
                <p className="mt-1 text-xs text-gray-500">{t.blueprint.timeMultiplier}: <span className="font-mono">{(tm * 100).toFixed(1)}%</span></p>
              </div>
            </div>
          </section>

          <section className={card}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-300">{t.skills.title}</h2>
            <div className="space-y-2">
              {KEY_SKILLS.map((id) => {
                const s = SKILLS.find((x) => x.typeId === id);
                if (!s) return null;
                const v = skills[id] ?? 0;
                return (
                  <div key={id} className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                    <div className="flex items-center gap-2">
                      <img src={s.icon} alt="" className="h-8 w-8 object-contain" loading="lazy" />
                      <span className="min-w-0 flex-1 truncate text-sm">{getSkillName(id, lang)}</span>
                      <span className="font-mono text-indigo-300">{v}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">{getSkillDescription(id, lang)}</p>
                    <input type="range" min={0} max={s.maxLevel} value={v} onChange={(e) => setSkills((p) => ({ ...p, [id]: clampNumber(Number(e.target.value), 0, s.maxLevel) }))} className="mt-2 w-full" />
                  </div>
                );
              })}
            </div>
          </section>

          <section className={card}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-300">{ru ? 'Параллельные линии' : 'Parallel slots'}</h2>
            <input type="number" min={1} max={100} value={slots} onChange={(e) => setSlots(clampNumber(Number(e.target.value), 1, 100))} className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono" />
          </section>
        </aside>

        <section className="min-w-0">
          <div role="tablist" className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            {TABS.map((x) => (
              <button key={x} role="tab" aria-selected={tab === x} onClick={() => setTab(x)} className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${tab === x ? 'bg-amber-500/20 text-amber-200' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                {labels[x]}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="mt-4 space-y-4">
              {tab === 'overview' ? (
                <>
                  <div className={`${card} flex flex-col gap-4 sm:flex-row`}>
                    <img src={titan.render} alt={titan.name} className="h-44 w-full rounded-xl bg-black/40 object-contain sm:h-52 sm:w-72" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl font-bold">{titan.name}</h2>
                      <p className="mt-2 text-sm text-gray-300">{ru ? titan.descriptionRu : titan.description}</p>
                      <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                        {(ru ? titan.bonusesRu : titan.bonuses).map((b) => (
                          <li key={b} className="flex gap-2"><Star className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" /><span>{b}</span></li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Stat icon={<Layers className="h-5 w-5" />} title={ru ? 'Минералы' : 'Minerals'} value={formatNumber(minerals.totalUnits)} sub={t.minerals.title} />
                    <Stat icon={<Package className="h-5 w-5" />} title={ru ? 'Единицы' : 'Units'} value={totalUnits.toLocaleString()} sub={t.tabs.components} />
                    <Stat icon={<Clock className="h-5 w-5" />} title={ru ? 'Время' : 'Time'} value={formatTime(seq + final)} sub={t.time.totalProductionTime} />
                    <Stat icon={<CheckCircle2 className="h-5 w-5" />} title={ru ? 'Прогресс' : 'Progress'} value={`${pct}%`} sub={`${done}/${reqs.length}`} />
                  </div>
                </>
              ) : null}

              {tab === 'components' || tab === 'tree' ? (
                <>
                  <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={ru ? 'Поиск компонента...' : 'Search component...'} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-amber-500/50" />
                  {CATS.map((c) => {
                    const items = filtered.filter((r) => r.categoryId === c);
                    if (!items.length) return null;
                    return (
                      <section key={c} className={card}>
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-300">{t.components[c]}</h2>
                        <div className="space-y-2">
                          {items.map((r) => {
                            const n = nodeMap.get(r.typeId);
                            if (!n) return null;
                            return <ProductionTreeView key={r.typeId} node={{ ...n, quantity: r.quantity }} blueprintME={me} lang={lang} />;
                          })}
                        </div>
                      </section>
                    );
                  })}
                </>
              ) : null}

              {tab === 'minerals' ? (
                <section className={card}>
                  <h2 className="text-lg font-bold">{t.minerals.title}</h2>
                  <p className="mt-1 text-sm text-gray-400">{t.minerals.subtitle.replace('{me}', String(me)).replace('{count}', String(reqs.length))}</p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead><tr className="text-left text-xs uppercase text-gray-500"><th className="pb-2">{ru ? 'Материал' : 'Material'}</th><th className="pb-2 text-right">{ru ? 'Кол-во' : 'Qty'}</th><th className="pb-2 text-right">{ru ? 'Доля' : 'Share'}</th></tr></thead>
                      <tbody>
                        {minerals.list.map((m) => (
                          <tr key={m.typeId} className="border-t border-white/5">
                            <td className="py-2"><div className="flex items-center gap-2"><img src={EVE_ICON(m.typeId, 24)} alt="" className="h-6 w-6 object-contain" loading="lazy" /><span>{getMineralName(m.typeId, lang)}</span></div></td>
                            <td className="py-2 text-right font-mono text-yellow-300">{m.quantity.toLocaleString()}</td>
                            <td className="py-2 text-right font-mono text-gray-400">{minerals.totalUnits ? ((m.quantity / minerals.totalUnits) * 100).toFixed(1) : '0.0'}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/90"><AlertTriangle className="h-4 w-4 flex-shrink-0" /><p>{t.minerals.warning}</p></div>
                </section>
              ) : null}

              {tab === 'time' ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Stat icon={<Ship className="h-5 w-5" />} title={t.time.avatarFinalAssembly} value={formatTime(final)} sub={`${t.blueprint.avatarBuildTime}: ${formatTime(titan.baseTime)}`} />
                    <Stat icon={<Package className="h-5 w-5" />} title={ru ? 'Компоненты' : 'Components'} value={formatTime(seq)} sub={t.time.totalProductionTime} />
                    <Stat icon={<Layers className="h-5 w-5" />} title={t.time.withParallelLines} value={formatTime(par)} sub={`${slots} ${t.time.productionSlots}`} />
                    <Stat icon={<Clock className="h-5 w-5" />} title={ru ? 'Минимум' : 'Lower bound'} value={formatTime(lower)} sub={ru ? 'Оценка расписания' : 'Schedule estimate'} />
                  </div>
                  <section className={card}>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-300">{ru ? 'Топ по времени' : 'Top time consumers'}</h2>
                    <div className="space-y-3">
                      {jobs.slice(0, 8).map((job) => (
                        <div key={job.typeId}>
                          <div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate">{job.name}</span><span className="font-mono text-gray-400">{formatTime(job.total)}</span></div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500" style={{ width: `${jobs[0]?.total ? Math.max(2, (job.total / jobs[0].total) * 100) : 0}%` }} /></div>
                          <p className="mt-1 text-xs text-gray-500">{formatTime(job.unitTime)} × {job.count.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              ) : null}

              {tab === 'progress' ? (
                <section className={card}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><h2 className="text-lg font-bold">{labels.progress}</h2><p className="mt-1 text-sm text-gray-400">{done}/{reqs.length} {t.common.components}</p></div>
                    <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"><RotateCcw className="h-4 w-4" />{t.common.reset}</button>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all" style={{ width: `${pct}%` }} /></div>
                  <div className="mt-4 space-y-2">
                    {reqs.map((r) => {
                      const ok = !!progress[`${titanKey}:${r.typeId}`];
                      return (
                        <button key={r.typeId} onClick={() => toggle(r.typeId)} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2 text-left hover:bg-white/5">
                          {ok ? <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" /> : <Circle className="h-5 w-5 flex-shrink-0 text-gray-500" />}
                          <img src={EVE_ICON(r.typeId, 32)} alt="" className="h-8 w-8 flex-shrink-0 object-contain" loading="lazy" />
                          <span className="min-w-0 flex-1 truncate">{ru ? r.nameRu : r.name}</span>
                          <span className="font-mono text-cyan-300">×{r.quantity.toLocaleString()}</span>
                          <span className="hidden font-mono text-gray-400 sm:block">{formatTime(r.productionTime * tm * r.quantity)}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      <footer className="border-t border-white/10 px-4 py-6 text-center text-xs text-gray-500">
        <p>{t.footer.copyright}</p><p className="mt-1">{t.footer.dataSources}</p><p className="mt-1">{t.footer.disclaimer}</p>
      </footer>
    </div>
  );
}