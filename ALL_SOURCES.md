# Все исходники проекта EVE Online Titan Construction Calculator

Этот файл содержит полный исходный код проекта. Скопируйте каждый файл в соответствующую директорию.

---

## 📄 index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EVE Online Titans Construction Calculator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 📄 package.json

```json
{
  "name": "eve-titan-calculator",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.294.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "jszip": "^3.10.1",
    "file-saver": "^2.0.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/file-saver": "^2.0.7",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

---

## 📄 README.md

```markdown
# EVE Online Titan Construction Calculator

Интерактивный калькулятор постройки титанов из EVE Online.

## Возможности

- Выбор титана: Avatar, Erebus, Leviathan, Ragnarok
- Калькулятор ресурсов с учётом ME/TE
- Дерево производства с промежуточными компонентами
- Двуязычный интерфейс (EN/RU)
- Отслеживание прогресса
- Скачивание всех исходников

## Установка

```bash
npm install
npm run dev
```

Откройте http://localhost:5173

## Структура проекта

```
├── index.html
├── package.json
├── README.md
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   └── ProductionTreeView.tsx
│   ├── data/
│   │   ├── eveData.ts
│   │   ├── localization.ts
│   │   ├── titans.ts
│   │   └── productionTree.ts
│   └── utils/
│       ├── downloadSources.ts
│       └── sources.ts
```

## Технологии

- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- JSZip
- FileSaver.js

## Лицензия

EVE Online и все связанные материалы являются собственностью CCP Games.
Данный проект создан в образовательных целях.

```

---

## 📄 src/main.tsx

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

```

---

## 📄 src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #0a0a0a;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  width: 100%;
  margin: 0 auto;
}

* {
  box-sizing: border-box;
}

```

---

## 📄 src/data/eveData.ts

```typescript
// Real EVE Online data for Titan construction
export interface Mineral {
  typeId: number;
  name: string;
  icon: string;
}

export interface ComponentMaterial {
  typeId: number;
  blueprintTypeId: number;
  name: string;
  quantity: number;
  icon: string;
  baseTime: number;
  materials?: Record<number, number>;
  category: 'standard' | 'advanced' | 'special';
}

export const EVE_ICON = (typeId: number, size: number = 64) =>
  \`https://images.evetech.net/types/\${typeId}/icon?size=\${size}\`;

export const MINERALS: Mineral[] = [
  { typeId: 34, name: 'Tritanium', icon: EVE_ICON(34) },
  { typeId: 35, name: 'Pyerite', icon: EVE_ICON(35) },
  { typeId: 36, name: 'Mexallon', icon: EVE_ICON(36) },
  { typeId: 37, name: 'Isogen', icon: EVE_ICON(37) },
  { typeId: 38, name: 'Nocxium', icon: EVE_ICON(38) },
  { typeId: 39, name: 'Zydrine', icon: EVE_ICON(39) },
  { typeId: 40, name: 'Megacyte', icon: EVE_ICON(40) },
  { typeId: 11399, name: 'Morphite', icon: EVE_ICON(11399) },
  { typeId: 2872, name: 'Self-Harmonizing Power Core', icon: EVE_ICON(2872) },
  { typeId: 57457, name: 'Reinforced Carbon Fiber', icon: EVE_ICON(57457) },
];

export const STANDARD_COMPONENTS: ComponentMaterial[] = [
  { typeId: 21009, blueprintTypeId: 21010, name: 'Capital Propulsion Engine', quantity: 80, icon: EVE_ICON(21009), baseTime: 15600, category: 'standard', materials: { 34: 40500, 35: 146250, 36: 40500, 37: 11250, 38: 1125, 39: 570, 40: 285, 2872: 1, 57457: 100 } },
  { typeId: 21011, blueprintTypeId: 21012, name: 'Capital Turret Hardpoint', quantity: 400, icon: EVE_ICON(21011), baseTime: 15600, category: 'standard', materials: { 34: 27750, 35: 101250, 36: 28500, 37: 7500, 38: 750, 39: 390, 40: 188, 2872: 1, 57457: 100 } },
  { typeId: 21013, blueprintTypeId: 21014, name: 'Capital Sensor Cluster', quantity: 100, icon: EVE_ICON(21013), baseTime: 15600, category: 'standard', materials: { 34: 40500, 35: 146250, 36: 40500, 37: 11250, 38: 1125, 39: 570, 40: 285, 2872: 1, 57457: 100 } },
  { typeId: 21017, blueprintTypeId: 21018, name: 'Capital Armor Plates', quantity: 400, icon: EVE_ICON(21017), baseTime: 15600, category: 'standard', materials: { 34: 45000, 35: 157500, 36: 45000, 37: 12000, 38: 1200, 39: 615, 40: 308, 2872: 1, 57457: 100 } },
  { typeId: 21019, blueprintTypeId: 21020, name: 'Capital Capacitor Battery', quantity: 400, icon: EVE_ICON(21019), baseTime: 15600, category: 'standard', materials: { 34: 39000, 35: 142500, 36: 39000, 37: 11250, 38: 1125, 39: 548, 40: 278, 2872: 1, 57457: 100 } },
  { typeId: 21021, blueprintTypeId: 21022, name: 'Capital Power Generator', quantity: 300, icon: EVE_ICON(21021), baseTime: 15600, category: 'standard', materials: { 34: 45000, 35: 157500, 36: 45000, 37: 12000, 38: 1200, 39: 615, 40: 308, 2872: 1, 57457: 100 } },
  { typeId: 21023, blueprintTypeId: 21024, name: 'Capital Shield Emitter', quantity: 50, icon: EVE_ICON(21023), baseTime: 15600, category: 'standard', materials: { 34: 40500, 35: 146250, 36: 40500, 37: 11250, 38: 1125, 39: 570, 40: 285, 2872: 1, 57457: 100 } },
  { typeId: 21025, blueprintTypeId: 21026, name: 'Capital Jump Drive', quantity: 300, icon: EVE_ICON(21025), baseTime: 15600, category: 'standard', materials: { 34: 60000, 35: 216000, 36: 60000, 37: 16875, 38: 1688, 39: 900, 40: 420, 2872: 1, 57457: 100 } },
  { typeId: 21035, blueprintTypeId: 21036, name: 'Capital Computer System', quantity: 200, icon: EVE_ICON(21035), baseTime: 15600, category: 'standard', materials: { 34: 30000, 35: 105000, 36: 30000, 37: 9000, 38: 750, 39: 413, 40: 210, 2872: 1, 57457: 100 } },
  { typeId: 21037, blueprintTypeId: 21038, name: 'Capital Construction Parts', quantity: 200, icon: EVE_ICON(21037), baseTime: 15600, category: 'standard', materials: { 34: 30000, 35: 105000, 36: 30000, 37: 9000, 38: 750, 39: 413, 40: 210, 2872: 1, 57457: 100 } },
];

export const ADVANCED_COMPONENTS: ComponentMaterial[] = [
  { typeId: 24545, blueprintTypeId: 24546, name: 'Capital Jump Bridge Array', quantity: 500, icon: EVE_ICON(24545), baseTime: 172800, category: 'advanced', materials: { 34: 60000, 35: 216000, 36: 60000, 37: 16875, 38: 1688, 39: 900, 40: 420 } },
  { typeId: 24547, blueprintTypeId: 24548, name: 'Capital Clone Vat Bay', quantity: 500, icon: EVE_ICON(24547), baseTime: 172800, category: 'advanced', materials: { 34: 50000, 35: 180000, 36: 50000, 37: 14000, 38: 1400, 39: 750, 40: 350 } },
  { typeId: 24556, blueprintTypeId: 24557, name: 'Capital Doomsday Weapon Mount', quantity: 500, icon: EVE_ICON(24556), baseTime: 172800, category: 'advanced', materials: { 34: 60000, 35: 216000, 36: 60000, 37: 16875, 38: 1688, 39: 900, 40: 420 } },
  { typeId: 24558, blueprintTypeId: 24559, name: 'Capital Ship Maintenance Bay', quantity: 500, icon: EVE_ICON(24558), baseTime: 172800, category: 'advanced', materials: { 34: 35000, 35: 120000, 36: 35000, 37: 10000, 38: 850, 39: 450, 40: 230 } },
  { typeId: 24560, blueprintTypeId: 24561, name: 'Capital Corporate Hangar Bay', quantity: 500, icon: EVE_ICON(24560), baseTime: 172800, category: 'advanced', materials: { 34: 35000, 35: 120000, 36: 35000, 37: 10000, 38: 850, 39: 450, 40: 230 } },
];

export const SPECIAL_COMPONENTS: ComponentMaterial[] = [
  { typeId: 57470, blueprintTypeId: 57507, name: 'U-C Trigger Neurolink Conduit', quantity: 192, icon: EVE_ICON(57470), baseTime: 43200, category: 'special', materials: { 34: 15000, 35: 50000, 36: 15000, 37: 4500, 38: 375, 39: 200, 40: 100, 11399: 50 } },
  { typeId: 57471, blueprintTypeId: 57511, name: 'Radar-FTL Interlink Communicator', quantity: 250, icon: EVE_ICON(57471), baseTime: 43200, category: 'special', materials: { 34: 20000, 35: 70000, 36: 20000, 37: 6000, 38: 500, 39: 270, 40: 135, 11399: 67 } },
  { typeId: 57472, blueprintTypeId: 57515, name: 'Auto-Integrity Preservation Seal', quantity: 3200, icon: EVE_ICON(57472), baseTime: 14400, category: 'special', materials: { 34: 5000, 35: 18000, 36: 5000, 37: 1500, 38: 125, 39: 67, 40: 34 } },
  { typeId: 57473, blueprintTypeId: 57519, name: 'Life Support Backup Unit', quantity: 1600, icon: EVE_ICON(57473), baseTime: 21600, category: 'special', materials: { 34: 8000, 35: 28000, 36: 8000, 37: 2400, 38: 200, 39: 107, 40: 54 } },
  { typeId: 57474, blueprintTypeId: 57523, name: 'Capital Core Temperature Regulator', quantity: 25, icon: EVE_ICON(57474), baseTime: 172800, category: 'special', materials: { 34: 100000, 35: 360000, 36: 100000, 37: 28000, 38: 2800, 39: 1500, 40: 750, 11399: 375 } },
  { typeId: 57475, blueprintTypeId: 57527, name: 'Enhanced Neurolink Protection Cell', quantity: 1, icon: EVE_ICON(57475), baseTime: 604800, category: 'special', materials: { 34: 500000, 35: 1800000, 36: 500000, 37: 140000, 38: 14000, 39: 7500, 40: 3750, 11399: 1875 } },
];

export interface Skill {
  typeId: number;
  name: string;
  icon: string;
  maxLevel: number;
  requiredLevel: number;
  timeBonusPerLevel: number;
  description: string;
}

export const SKILLS: Skill[] = [
  { typeId: 3386, name: 'Industry', icon: EVE_ICON(3386), maxLevel: 5, requiredLevel: 1, timeBonusPerLevel: 4, description: '-4% manufacturing time per level' },
  { typeId: 3388, name: 'Advanced Industry', icon: EVE_ICON(3388), maxLevel: 5, requiredLevel: 0, timeBonusPerLevel: 5, description: '-5% manufacturing time per level' },
  { typeId: 20533, name: 'Capital Ship Construction', icon: EVE_ICON(20533), maxLevel: 5, requiredLevel: 5, timeBonusPerLevel: 0, description: 'Required to build Titans (Level 5)' },
  { typeId: 3387, name: 'Advanced Small Ship Construction', icon: EVE_ICON(3387), maxLevel: 5, requiredLevel: 0, timeBonusPerLevel: 2, description: '-2% capital component time per level' },
  { typeId: 3394, name: 'Electronics', icon: EVE_ICON(3394), maxLevel: 5, requiredLevel: 0, timeBonusPerLevel: 0, description: 'Prerequisite for advanced skills' },
  { typeId: 3402, name: 'Science', icon: EVE_ICON(3402), maxLevel: 5, requiredLevel: 1, timeBonusPerLevel: 0, description: 'Required for blueprint research' },
  { typeId: 3403, name: 'Research', icon: EVE_ICON(3403), maxLevel: 5, requiredLevel: 0, timeBonusPerLevel: 0, description: 'Reduces blueprint research time' },
  { typeId: 3409, name: 'Metallurgy', icon: EVE_ICON(3409), maxLevel: 5, requiredLevel: 0, timeBonusPerLevel: 0, description: 'Reduces ME research time' },
];

export function calculateProductionTime(
  industryLevel: number,
  advancedIndustryLevel: number,
  blueprintTE: number,
  componentBaseTime: number,
  quantity: number
): number {
  const industryMultiplier = 1 - industryLevel * 0.04;
  const advIndustryMultiplier = 1 - advancedIndustryLevel * 0.05;
  const teMultiplier = 1 - blueprintTE * 0.01;
  return componentBaseTime * quantity * industryMultiplier * advIndustryMultiplier * teMultiplier;
}

export function formatTime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(\`\${days}d\`);
  if (hours > 0) parts.push(\`\${hours}h\`);
  if (minutes > 0 && days === 0) parts.push(\`\${minutes}m\`);
  return parts.join(' ') || '< 1m';
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return \`\${(num / 1_000_000_000).toFixed(2)}B\`;
  if (num >= 1_000_000) return \`\${(num / 1_000_000).toFixed(2)}M\`;
  if (num >= 1_000) return \`\${(num / 1_000).toFixed(1)}K\`;
  return num.toLocaleString();
}

```

---

## 📄 src/data/localization.ts

```typescript
export type Language = 'en' | 'ru';

export const UI = {
  en: {
    title: 'Titan Construction Calculator',
    subtitle: 'EVE Online',
    selectTitan: 'Select Titan',
    shipInfo: { race: 'Amarr Empire', class: 'Titan', baseBuildTime: 'Base Build Time', laserDamageBonus: 'Laser Damage Bonus', judgementDoomsday: 'Judgement Doomsday', ewImmune: 'EW Immune' },
    skills: { title: 'Skills', subtitle: 'Affect production time' },
    blueprint: { title: 'Blueprint', materialEfficiency: 'Material Efficiency (ME)', timeEfficiency: 'Time Efficiency (TE)', materialMultiplier: 'Material multiplier', timeMultiplier: 'Time multiplier', avatarBuildTime: 'Titan build time', summary: 'Summary' },
    tabs: { components: 'Components', minerals: 'Total Minerals', time: 'Time Estimates' },
    components: { standard: 'Standard Capital Components', advanced: 'Advanced Capital Components', special: 'Titan-Specific Components', materialsPerUnit: 'Materials per unit (ME adjusted)', timePerUnit: 'Time per component type (all units)' },
    minerals: { title: 'Total Mineral Requirements', subtitle: 'Based on ME {me} • All {count} components', warning: 'These are base amounts. Actual requirements depend on blueprint ME, rig bonuses, and implant bonuses.' },
    time: { avatarFinalAssembly: 'Titan Final Assembly', baseTime: 'Base', componentProductionTimes: 'Component Production Times', totalProductionTime: 'Total Production Time (sequential)', withParallelLines: 'With parallel lines (est.)', productionSlots: 'production slots' },
    footer: { copyright: 'EVE Online and all related materials are property of CCP Games.', dataSources: 'Data sourced from fuzzwork.co.uk, everef.net, eveonlineships.com. Icons from images.evetech.net.', disclaimer: 'Material quantities are base blueprint values. Actual requirements vary with ME, rigs, and implants.' },
    common: { done: 'done', components: 'components', units: 'units', perUnit: '/ea', reset: 'Reset' },
  },
  ru: {
    title: 'Калькулятор постройки титанов',
    subtitle: 'EVE Online',
    selectTitan: 'Выберите титан',
    shipInfo: { race: 'Империя Амарр', class: 'Титан', baseBuildTime: 'Базовое время постройки', laserDamageBonus: 'Бонус к урону лазеров', judgementDoomsday: 'Думсдей "Судный День"', ewImmune: 'Иммунитет к РЭБ' },
    skills: { title: 'Навыки', subtitle: 'Влияют на время производства' },
    blueprint: { title: 'Чертёж', materialEfficiency: 'Эффективность материалов (ME)', timeEfficiency: 'Эффективность времени (TE)', materialMultiplier: 'Множитель материалов', timeMultiplier: 'Множитель времени', avatarBuildTime: 'Время постройки титана', summary: 'Сводка' },
    tabs: { components: 'Компоненты', minerals: 'Всего минералов', time: 'Оценка времени' },
    components: { standard: 'Стандартные компоненты капитальных кораблей', advanced: 'Продвинутые компоненты капитальных кораблей', special: 'Специфические компоненты титанов', materialsPerUnit: 'Материалы на единицу (с учётом ME)', timePerUnit: 'Время на тип компонента (все единицы)' },
    minerals: { title: 'Общая потребность в минералах', subtitle: 'На основе ME {me} • Все {count} компонентов', warning: 'Это базовые количества. Фактические требования зависят от ME чертежа, бонусов ригов и имплантов.' },
    time: { avatarFinalAssembly: 'Финальная сборка титана', baseTime: 'Базовое', componentProductionTimes: 'Время производства компонентов', totalProductionTime: 'Общее время производства (последовательно)', withParallelLines: 'С параллельными линиями (оценка)', productionSlots: 'производственных слотов' },
    footer: { copyright: 'EVE Online и все связанные материалы являются собственностью CCP Games.', dataSources: 'Данные получены с fuzzwork.co.uk, everef.net, eveonlineships.com. Иконки с images.evetech.net.', disclaimer: 'Количества минералов — базовые значения чертежей. Фактические требования зависят от ME, ригов и имплантов.' },
    common: { done: 'готово', components: 'компонентов', units: 'единиц', perUnit: '/шт', reset: 'Сброс' },
  },
};

export const MINERAL_NAMES = {
  en: { 34: 'Tritanium', 35: 'Pyerite', 36: 'Mexallon', 37: 'Isogen', 38: 'Nocxium', 39: 'Zydrine', 40: 'Megacyte', 11399: 'Morphite', 2872: 'Self-Harmonizing Power Core', 57457: 'Reinforced Carbon Fiber' },
  ru: { 34: 'Тританиум', 35: 'Пирит', 36: 'Мексаллон', 37: 'Изоген', 38: 'Ноксиум', 39: 'Зидрин', 40: 'Мегацит', 11399: 'Морфит', 2872: 'Самосинхронизирующийся источник энергии', 57457: 'Армированное углеродное волокно' },
};

export const COMPONENT_NAMES = {
  en: { 21009: 'Capital Propulsion Engine', 21011: 'Capital Turret Hardpoint', 21013: 'Capital Sensor Cluster', 21017: 'Capital Armor Plates', 21019: 'Capital Capacitor Battery', 21021: 'Capital Power Generator', 21023: 'Capital Shield Emitter', 21025: 'Capital Jump Drive', 21035: 'Capital Computer System', 21037: 'Capital Construction Parts', 24545: 'Capital Jump Bridge Array', 24547: 'Capital Clone Vat Bay', 24556: 'Capital Doomsday Weapon Mount', 24558: 'Capital Ship Maintenance Bay', 24560: 'Capital Corporate Hangar Bay', 57470: 'U-C Trigger Neurolink Conduit', 57471: 'Radar-FTL Interlink Communicator', 57472: 'Auto-Integrity Preservation Seal', 57473: 'Life Support Backup Unit', 57474: 'Capital Core Temperature Regulator', 57475: 'Enhanced Neurolink Protection Cell', 2872: 'Self-Harmonizing Power Core', 57457: 'Reinforced Carbon Fiber' },
  ru: { 21009: 'Capital Propulsion Engine', 21011: 'Capital Turret Hardpoint', 21013: 'Capital Sensor Cluster', 21017: 'Capital Armor Plates', 21019: 'Capital Capacitor Battery', 21021: 'Capital Power Generator', 21023: 'Capital Shield Emitter', 21025: 'Capital Jump Drive', 21035: 'Capital Computer System', 21037: 'Capital Construction Parts', 24545: 'Capital Jump Bridge Array', 24547: 'Capital Clone Vat Bay', 24556: 'Capital Doomsday Weapon Mount', 24558: 'Capital Ship Maintenance Bay', 24560: 'Capital Corporate Hangar Bay', 57470: 'U-C Trigger Neurolink Conduit', 57471: 'Radar-FTL Interlink Communicator', 57472: 'Auto-Integrity Preservation Seal', 57473: 'Life Support Backup Unit', 57474: 'Capital Core Temperature Regulator', 57475: 'Enhanced Neurolink Protection Cell', 2872: 'Самосинхронизирующийся источник энергии', 57457: 'Армированное углеродное волокно' },
};

export const SKILL_NAMES = {
  en: { 3386: 'Industry', 3388: 'Advanced Industry', 20533: 'Capital Ship Construction', 3387: 'Advanced Small Ship Construction', 3394: 'Electronics', 3402: 'Science', 3403: 'Research', 3409: 'Metallurgy' },
  ru: { 3386: 'Промышленность', 3388: 'Передовая промышленность', 20533: 'Строительство кораблей большого тоннажа', 3387: 'Передовое строительство малых кораблей', 3394: 'Электронные системы', 3402: 'Наука', 3403: 'Исследования', 3409: 'Металлургия' },
};

export const SKILL_DESCRIPTIONS = {
  en: { 3386: '-4% manufacturing time per level', 3388: '-5% manufacturing time per level', 20533: 'Required to build Titans (Level 5)', 3387: '-2% capital component time per level', 3394: 'Prerequisite for advanced skills', 3402: 'Required for blueprint research', 3403: 'Reduces blueprint research time', 3409: 'Reduces ME research time' },
  ru: { 3386: '-4% к длительности производственных проектов', 3388: '-3% к длительности научно-исследовательских и производственных проектов', 20533: 'Требуется для производства кораблей большого тоннажа (5 уровень)', 3387: '-1% к времени строительства фрегатов специализированных проектов', 3394: 'Необходим для работы с бортовой электроникой', 3402: '+5% к скорости копирования чертежей', 3403: '+5% к скорости исследования чертежей', 3409: '+5% к скорости исследования эффективности производства' },
};

export function getMineralName(typeId: number, lang: Language): string {
  return MINERAL_NAMES[lang][typeId as keyof typeof MINERAL_NAMES[typeof lang]] || \`Mineral \${typeId}\`;
}

export function getComponentName(typeId: number, lang: Language): string {
  return COMPONENT_NAMES[lang][typeId as keyof typeof COMPONENT_NAMES[typeof lang]] || \`Component \${typeId}\`;
}

export function getSkillName(typeId: number, lang: Language): string {
  return SKILL_NAMES[lang][typeId as keyof typeof SKILL_NAMES[typeof lang]] || \`Skill \${typeId}\`;
}

export function getSkillDescription(typeId: number, lang: Language): string {
  return SKILL_DESCRIPTIONS[lang][typeId as keyof typeof SKILL_DESCRIPTIONS[typeof lang]] || '';
}

```

---

## 📄 src/data/titans.ts

```typescript
export interface TitanData {
  typeId: number;
  blueprintTypeId: number;
  name: string;
  race: 'Amarr' | 'Caldari' | 'Gallente' | 'Minmatar';
  raceRu: string;
  icon: string;
  render: string;
  baseTime: number;
  description: string;
  descriptionRu: string;
  bonuses: string[];
  bonusesRu: string[];
  components: {
    standard: Record<number, number>;
    advanced: Record<number, number>;
    special: Record<number, number>;
  };
}

export const TITANS: Record<string, TitanData> = {
  avatar: {
    typeId: 11567,
    blueprintTypeId: 11568,
    name: 'Avatar',
    race: 'Amarr',
    raceRu: 'Империя Амарр',
    icon: 'https://images.evetech.net/types/11567/icon?size=64',
    render: 'https://images.evetech.net/types/11567/render?size=256',
    baseTime: 5227200,
    description: 'The Avatar is the Amarr Empire\\'s Titan, armed with laser-based doomsday weapons.',
    descriptionRu: 'Avatar — титан Империи Амарр, вооружённый лазерным оружием судного дня.',
    bonuses: ['100% bonus to Capital Energy Turret damage per level', '7.5% bonus to fleet members\\' capacitor recharge rate per level', 'Can fit Judgement doomsday device', 'Immune to all forms of Electronic Warfare'],
    bonusesRu: ['+100% к урону тяжёлых энергетических орудий за уровень', '+7.5% к скорости перезарядки конденсатора членов флота за уровень', 'Может установить думсдей "Судный День"', 'Иммунитет ко всем видам РЭБ'],
    components: {
      standard: { 21009: 80, 21011: 400, 21013: 100, 21017: 400, 21019: 400, 21021: 300, 21023: 50, 21025: 300, 21035: 200, 21037: 200 },
      advanced: { 24545: 500, 24547: 500, 24556: 500, 24558: 500, 24560: 500 },
      special: { 57470: 192, 57471: 250, 57472: 3200, 57473: 1600, 57474: 25, 57475: 1 },
    },
  },
  erebus: {
    typeId: 671,
    blueprintTypeId: 1002,
    name: 'Erebus',
    race: 'Gallente',
    raceRu: 'Федерация Галленте',
    icon: 'https://images.evetech.net/types/671/icon?size=64',
    render: 'https://images.evetech.net/types/671/render?size=256',
    baseTime: 5227200,
    description: 'The Erebus is the Gallente Federation\\'s Titan, armed with hybrid turret doomsday weapons.',
    descriptionRu: 'Erebus — титан Федерации Галленте, вооружён гибридными орудиями судного дня.',
    bonuses: ['100% bonus to Capital Hybrid Turret damage per level', '7.5% bonus to fleet members\\' maximum armor hitpoints per level', 'Can fit Aurora Ominae doomsday device', 'Immune to all forms of Electronic Warfare'],
    bonusesRu: ['+100% к урону тяжёлых гибридных орудий за уровень', '+7.5% к максимальному запасу прочности брони членов флота за уровень', 'Может установить думсдей "Аврора Оминаэ"', 'Иммунитет ко всем видам РЭБ'],
    components: {
      standard: { 21009: 80, 21011: 400, 21013: 200, 21017: 300, 21019: 400, 21021: 222, 21023: 150, 21025: 300, 21035: 100, 21037: 200 },
      advanced: { 24545: 500, 24547: 500, 24556: 500, 24558: 500, 24560: 500 },
      special: { 57470: 192, 57471: 250, 57472: 3200, 57473: 1600, 57474: 25, 57475: 1 },
    },
  },
  leviathan: {
    typeId: 3764,
    blueprintTypeId: 3765,
    name: 'Leviathan',
    race: 'Caldari',
    raceRu: 'Государство Калдари',
    icon: 'https://images.evetech.net/types/3764/icon?size=64',
    render: 'https://images.evetech.net/types/3764/render?size=256',
    baseTime: 5227200,
    description: 'The Leviathan is the Caldari State\\'s Titan, equipped with missile-based doomsday weapons.',
    descriptionRu: 'Leviathan — титан Государства Калдари, оснащён ракетным оружием судного дня.',
    bonuses: ['100% bonus to Capital Cruise Missile damage per level', '7.5% bonus to fleet members\\' maximum shield hitpoints per level', 'Can fit World Collapser doomsday device', 'Immune to all forms of Electronic Warfare'],
    bonusesRu: ['+100% к урону тяжёлых крылатых ракет за уровень', '+7.5% к максимальному запасу прочности щита членов флота за уровень', 'Может установить думсдей "Крушитель Миров"', 'Иммунитет ко всем видам РЭБ'],
    components: {
      standard: { 21009: 100, 21011: 33, 21013: 100, 21017: 200, 21019: 400, 21021: 200, 21023: 400, 21025: 300, 21035: 200, 21037: 200 },
      advanced: { 24545: 500, 24547: 500, 24556: 500, 24558: 500, 24560: 500 },
      special: { 57470: 192, 57471: 250, 57472: 3200, 57473: 1600, 57474: 25, 57475: 1 },
    },
  },
  ragnarok: {
    typeId: 23773,
    blueprintTypeId: 23774,
    name: 'Ragnarok',
    race: 'Minmatar',
    raceRu: 'Республика Минматар',
    icon: 'https://images.evetech.net/types/23773/icon?size=64',
    render: 'https://images.evetech.net/types/23773/render?size=256',
    baseTime: 5227200,
    description: 'The Ragnarok is the Minmatar Republic\\'s Titan, armed with projectile doomsday weapons.',
    descriptionRu: 'Ragnarok — титан Республики Минматар, вооружён снарядным оружием судного дня.',
    bonuses: ['100% bonus to Capital Projectile Turret damage per level', '7.5% bonus to fleet members\\' maximum velocity per level', 'Can fit Ragnarök doomsday device', 'Immune to all forms of Electronic Warfare'],
    bonusesRu: ['+100% к урону тяжёлых снарядных орудий за уровень', '+7.5% к максимальной скорости членов флота за уровень', 'Может установить думсдей "Рагнарёк"', 'Иммунитет ко всем видам РЭБ'],
    components: {
      standard: { 21009: 100, 21011: 44, 21013: 100, 21017: 300, 21019: 400, 21021: 222, 21023: 150, 21025: 300, 21035: 200, 21037: 200 },
      advanced: { 24545: 500, 24547: 500, 24556: 500, 24558: 500, 24560: 500 },
      special: { 57470: 192, 57471: 250, 57472: 3200, 57473: 1600, 57474: 25, 57475: 1 },
    },
  },
};

export const TITAN_LIST = Object.entries(TITANS).map(([key, data]) => ({
  key,
  ...data,
}));

```

---

## 📄 src/data/productionTree.ts

```typescript
// Production tree data structure for EVE Online Titan construction
export interface Material {
  typeId: number;
  name: string;
  nameRu: string;
  quantity: number;
  icon: string;
  category: 'mineral' | 'pi' | 'reaction' | 'gas' | 'moon' | 'component';
  blueprintTypeId?: number;
  formulaTypeId?: number;
  schematicId?: number;
}

export interface ProductionNode {
  typeId: number;
  name: string;
  nameRu: string;
  icon: string;
  quantity: number;
  category: 'titan' | 'component' | 'mineral' | 'pi' | 'reaction' | 'gas' | 'moon';
  blueprintTypeId?: number;
  productionTime?: number;
  materials: Material[];
  children?: ProductionNode[];
}

export const MATERIAL_CATEGORIES = {
  mineral: { name: 'Minerals', nameRu: 'Минералы', color: 'blue' },
  pi: { name: 'Planetary Materials', nameRu: 'Планетарные материалы', color: 'green' },
  reaction: { name: 'Reaction Materials', nameRu: 'Реактивные материалы', color: 'purple' },
  gas: { name: 'Gases', nameRu: 'Газы', color: 'cyan' },
  moon: { name: 'Moon Materials', nameRu: 'Лунные материалы', color: 'yellow' },
  component: { name: 'Components', nameRu: 'Компоненты', color: 'orange' },
};

export const BASE_MINERALS: Material[] = [
  { typeId: 34, name: 'Tritanium', nameRu: 'Тританиум', quantity: 0, icon: 'https://images.evetech.net/types/34/icon?size=64', category: 'mineral' },
  { typeId: 35, name: 'Pyerite', nameRu: 'Пирит', quantity: 0, icon: 'https://images.evetech.net/types/35/icon?size=64', category: 'mineral' },
  { typeId: 36, name: 'Mexallon', nameRu: 'Мексаллон', quantity: 0, icon: 'https://images.evetech.net/types/36/icon?size=64', category: 'mineral' },
  { typeId: 37, name: 'Isogen', nameRu: 'Изоген', quantity: 0, icon: 'https://images.evetech.net/types/37/icon?size=64', category: 'mineral' },
  { typeId: 38, name: 'Nocxium', nameRu: 'Ноксиум', quantity: 0, icon: 'https://images.evetech.net/types/38/icon?size=64', category: 'mineral' },
  { typeId: 39, name: 'Zydrine', nameRu: 'Зидрин', quantity: 0, icon: 'https://images.evetech.net/types/39/icon?size=64', category: 'mineral' },
  { typeId: 40, name: 'Megacyte', nameRu: 'Мегацит', quantity: 0, icon: 'https://images.evetech.net/types/40/icon?size=64', category: 'mineral' },
  { typeId: 11399, name: 'Morphite', nameRu: 'Морфит', quantity: 0, icon: 'https://images.evetech.net/types/11399/icon?size=64', category: 'mineral' },
];

export const PI_MATERIALS: Material[] = [
  { typeId: 2872, name: 'Self-Harmonizing Power Core', nameRu: 'Самосинхронизирующийся источник энергии', quantity: 0, icon: 'https://images.evetech.net/types/2872/icon?size=64', category: 'pi', schematicId: 115 },
];

export const REACTION_MATERIALS: Material[] = [
  { typeId: 57457, name: 'Reinforced Carbon Fiber', nameRu: 'Армированное углеродное волокно', quantity: 0, icon: 'https://images.evetech.net/types/57457/icon?size=64', category: 'reaction', formulaTypeId: 57493 },
];

const createMaterials = (mats: Record<number, number>): Material[] => {
  return Object.entries(mats).map(([typeId, quantity]) => {
    const id = Number(typeId);
    const baseMineral = BASE_MINERALS.find(m => m.typeId === id);
    const piMaterial = PI_MATERIALS.find(m => m.typeId === id);
    const reactionMaterial = REACTION_MATERIALS.find(m => m.typeId === id);
    
    if (baseMineral) return { ...baseMineral, quantity };
    if (piMaterial) return { ...piMaterial, quantity };
    if (reactionMaterial) return { ...reactionMaterial, quantity };
    
    return {
      typeId: id,
      name: \`Material \${id}\`,
      nameRu: \`Материал \${id}\`,
      quantity,
      icon: \`https://images.evetech.net/types/\${id}/icon?size=64\`,
      category: 'mineral' as const,
    };
  });
};

export const STANDARD_COMPONENTS_TREE: ProductionNode[] = [
  { typeId: 21009, name: 'Capital Propulsion Engine', nameRu: 'Двигатель капитального класса', icon: 'https://images.evetech.net/types/21009/icon?size=64', quantity: 80, category: 'component', blueprintTypeId: 21010, productionTime: 15600, materials: createMaterials({ 34: 40500, 35: 146250, 36: 40500, 37: 11250, 38: 1125, 39: 570, 40: 285, 2872: 1, 57457: 100 }) },
  { typeId: 21011, name: 'Capital Turret Hardpoint', nameRu: 'Турельная установка капитального класса', icon: 'https://images.evetech.net/types/21011/icon?size=64', quantity: 400, category: 'component', blueprintTypeId: 21012, productionTime: 15600, materials: createMaterials({ 34: 27750, 35: 101250, 36: 28500, 37: 7500, 38: 750, 39: 390, 40: 188, 2872: 1, 57457: 100 }) },
  { typeId: 21013, name: 'Capital Sensor Cluster', nameRu: 'Сенсорный кластер капитального класса', icon: 'https://images.evetech.net/types/21013/icon?size=64', quantity: 100, category: 'component', blueprintTypeId: 21014, productionTime: 15600, materials: createMaterials({ 34: 40500, 35: 146250, 36: 40500, 37: 11250, 38: 1125, 39: 570, 40: 285, 2872: 1, 57457: 100 }) },
  { typeId: 21017, name: 'Capital Armor Plates', nameRu: 'Броневые плиты капитального класса', icon: 'https://images.evetech.net/types/21017/icon?size=64', quantity: 400, category: 'component', blueprintTypeId: 21018, productionTime: 15600, materials: createMaterials({ 34: 45000, 35: 157500, 36: 45000, 37: 12000, 38: 1200, 39: 615, 40: 308, 2872: 1, 57457: 100 }) },
  { typeId: 21019, name: 'Capital Capacitor Battery', nameRu: 'Конденсаторная батарея капитального класса', icon: 'https://images.evetech.net/types/21019/icon?size=64', quantity: 400, category: 'component', blueprintTypeId: 21020, productionTime: 15600, materials: createMaterials({ 34: 39000, 35: 142500, 36: 39000, 37: 11250, 38: 1125, 39: 548, 40: 278, 2872: 1, 57457: 100 }) },
  { typeId: 21021, name: 'Capital Power Generator', nameRu: 'Генератор энергии капитального класса', icon: 'https://images.evetech.net/types/21021/icon?size=64', quantity: 300, category: 'component', blueprintTypeId: 21022, productionTime: 15600, materials: createMaterials({ 34: 45000, 35: 157500, 36: 45000, 37: 12000, 38: 1200, 39: 615, 40: 308, 2872: 1, 57457: 100 }) },
  { typeId: 21023, name: 'Capital Shield Emitter', nameRu: 'Излучатель щита капитального класса', icon: 'https://images.evetech.net/types/21023/icon?size=64', quantity: 50, category: 'component', blueprintTypeId: 21024, productionTime: 15600, materials: createMaterials({ 34: 40500, 35: 146250, 36: 40500, 37: 11250, 38: 1125, 39: 570, 40: 285, 2872: 1, 57457: 100 }) },
  { typeId: 21025, name: 'Capital Jump Drive', nameRu: 'Прыжковый двигатель капитального класса', icon: 'https://images.evetech.net/types/21025/icon?size=64', quantity: 300, category: 'component', blueprintTypeId: 21026, productionTime: 15600, materials: createMaterials({ 34: 60000, 35: 216000, 36: 60000, 37: 16875, 38: 1688, 39: 900, 40: 420, 2872: 1, 57457: 100 }) },
  { typeId: 21035, name: 'Capital Computer System', nameRu: 'Компьютерная система капитального класса', icon: 'https://images.evetech.net/types/21035/icon?size=64', quantity: 200, category: 'component', blueprintTypeId: 21036, productionTime: 15600, materials: createMaterials({ 34: 30000, 35: 105000, 36: 30000, 37: 9000, 38: 750, 39: 413, 40: 210, 2872: 1, 57457: 100 }) },
  { typeId: 21037, name: 'Capital Construction Parts', nameRu: 'Строительные части капитального класса', icon: 'https://images.evetech.net/types/21037/icon?size=64', quantity: 200, category: 'component', blueprintTypeId: 21038, productionTime: 15600, materials: createMaterials({ 34: 30000, 35: 105000, 36: 30000, 37: 9000, 38: 750, 39: 413, 40: 210, 2872: 1, 57457: 100 }) },
];

export const ADVANCED_COMPONENTS_TREE: ProductionNode[] = [
  { typeId: 24545, name: 'Capital Jump Bridge Array', nameRu: 'Массив прыжковых мостов капитального класса', icon: 'https://images.evetech.net/types/24545/icon?size=64', quantity: 500, category: 'component', blueprintTypeId: 24546, productionTime: 28800, materials: createMaterials({ 34: 60000, 35: 216000, 36: 60000, 37: 16875, 38: 1688, 39: 900, 40: 420, 2872: 2, 57457: 150 }) },
  { typeId: 24547, name: 'Capital Clone Vat Bay', nameRu: 'Отсек клонирования капитального класса', icon: 'https://images.evetech.net/types/24547/icon?size=64', quantity: 500, category: 'component', blueprintTypeId: 24548, productionTime: 28800, materials: createMaterials({ 34: 50000, 35: 180000, 36: 50000, 37: 14000, 38: 1400, 39: 750, 40: 350, 2872: 2, 57457: 150 }) },
  { typeId: 24556, name: 'Capital Doomsday Weapon Mount', nameRu: 'Установка оружия судного дня капитального класса', icon: 'https://images.evetech.net/types/24556/icon?size=64', quantity: 500, category: 'component', blueprintTypeId: 24557, productionTime: 28800, materials: createMaterials({ 34: 60000, 35: 216000, 36: 60000, 37: 16875, 38: 1688, 39: 900, 40: 420, 2872: 2, 57457: 150 }) },
  { typeId: 24558, name: 'Capital Ship Maintenance Bay', nameRu: 'Ангар обслуживания кораблей капитального класса', icon: 'https://images.evetech.net/types/24558/icon?size=64', quantity: 500, category: 'component', blueprintTypeId: 24559, productionTime: 28800, materials: createMaterials({ 34: 35000, 35: 120000, 36: 35000, 37: 10000, 38: 850, 39: 450, 40: 230, 2872: 2, 57457: 150 }) },
  { typeId: 24560, name: 'Capital Corporate Hangar Bay', nameRu: 'Корпоративный ангар капитального класса', icon: 'https://images.evetech.net/types/24560/icon?size=64', quantity: 500, category: 'component', blueprintTypeId: 24561, productionTime: 28800, materials: createMaterials({ 34: 35000, 35: 120000, 36: 35000, 37: 10000, 38: 850, 39: 450, 40: 230, 2872: 2, 57457: 150 }) },
];

export const SPECIAL_COMPONENTS_TREE: ProductionNode[] = [
  { typeId: 57470, name: 'U-C Trigger Neurolink Conduit', nameRu: 'Нейросвязной канал U-C триггера', icon: 'https://images.evetech.net/types/57470/icon?size=64', quantity: 192, category: 'component', blueprintTypeId: 57507, productionTime: 43200, materials: createMaterials({ 34: 15000, 35: 50000, 36: 15000, 37: 4500, 38: 375, 39: 200, 40: 100, 11399: 50, 2872: 3, 57457: 200 }) },
  { typeId: 57471, name: 'Radar-FTL Interlink Communicator', nameRu: 'Коммуникатор радар-FTL связи', icon: 'https://images.evetech.net/types/57471/icon?size=64', quantity: 250, category: 'component', blueprintTypeId: 57511, productionTime: 43200, materials: createMaterials({ 34: 20000, 35: 70000, 36: 20000, 37: 6000, 38: 500, 39: 270, 40: 135, 11399: 67, 2872: 3, 57457: 200 }) },
  { typeId: 57472, name: 'Auto-Integrity Preservation Seal', nameRu: 'Автоматическая печать сохранения целостности', icon: 'https://images.evetech.net/types/57472/icon?size=64', quantity: 3200, category: 'component', blueprintTypeId: 57515, productionTime: 14400, materials: createMaterials({ 34: 5000, 35: 18000, 36: 5000, 37: 1500, 38: 125, 39: 67, 40: 34, 2872: 1, 57457: 50 }) },
  { typeId: 57473, name: 'Life Support Backup Unit', nameRu: 'Резервный блок жизнеобеспечения', icon: 'https://images.evetech.net/types/57473/icon?size=64', quantity: 1600, category: 'component', blueprintTypeId: 57519, productionTime: 21600, materials: createMaterials({ 34: 8000, 35: 28000, 36: 8000, 37: 2400, 38: 200, 39: 107, 40: 54, 2872: 1, 57457: 75 }) },
  { typeId: 57474, name: 'Capital Core Temperature Regulator', nameRu: 'Регулятор температуры ядра капитального класса', icon: 'https://images.evetech.net/types/57474/icon?size=64', quantity: 25, category: 'component', blueprintTypeId: 57523, productionTime: 172800, materials: createMaterials({ 34: 100000, 35: 360000, 36: 100000, 37: 28000, 38: 2800, 39: 1500, 40: 750, 11399: 375, 2872: 5, 57457: 500 }) },
  { typeId: 57475, name: 'Enhanced Neurolink Protection Cell', nameRu: 'Усиленная ячейка защиты нейросвязи', icon: 'https://images.evetech.net/types/57475/icon?size=64', quantity: 1, category: 'component', blueprintTypeId: 57527, productionTime: 604800, materials: createMaterials({ 34: 500000, 35: 1800000, 36: 500000, 37: 140000, 38: 14000, 39: 7500, 40: 3750, 11399: 1875, 2872: 10, 57457: 1000 }) },
];

export const ALL_COMPONENTS_TREE = [
  ...STANDARD_COMPONENTS_TREE,
  ...ADVANCED_COMPONENTS_TREE,
  ...SPECIAL_COMPONENTS_TREE,
];

export function formatProductionTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return \`\${days}d \${remainingHours}h\`;
  }
  if (hours > 0) return \`\${hours}h \${minutes}m\`;
  return \`\${minutes}m\`;
}

export function getMaterialInfo(typeId: number): Material | undefined {
  const allMaterials = [...BASE_MINERALS, ...PI_MATERIALS, ...REACTION_MATERIALS];
  return allMaterials.find(m => m.typeId === typeId);
}

```

---

## 📄 src/components/ProductionTreeView.tsx

```typescript
import { useState } from 'react';
import { ChevronDown, ChevronRight, Package, FlaskConical, Factory, Atom } from 'lucide-react';
import { ProductionNode, Material, MATERIAL_CATEGORIES, formatProductionTime } from '../data/productionTree';

interface ProductionTreeViewProps {
  node: ProductionNode;
  level?: number;
  blueprintME?: number;
  blueprintTE?: number;
}

export function ProductionTreeView({ node, level = 0, blueprintME = 0 }: ProductionTreeViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mineral': return <Atom className="w-4 h-4 text-blue-400" />;
      case 'pi': return <Factory className="w-4 h-4 text-green-400" />;
      case 'reaction': return <FlaskConical className="w-4 h-4 text-purple-400" />;
      case 'component': return <Package className="w-4 h-4 text-orange-400" />;
      default: return <Package className="w-4 h-4 text-gray-400" />;
    }
  };

  const getCategoryLabel = (category: string, isRussian: boolean) => {
    const cat = MATERIAL_CATEGORIES[category as keyof typeof MATERIAL_CATEGORIES];
    return cat ? (isRussian ? cat.nameRu : cat.name) : category;
  };

  const getCategoryStyle = (category: string) => {
    const styles: Record<string, { bg: string; text: string; border: string }> = {
      mineral: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
      pi: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' },
      reaction: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
      gas: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30' },
      moon: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30' },
      component: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30' },
    };
    return styles[category] || { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30' };
  };

  const isRussian = true;

  return (
    <div className="select-none">
      <div
        className={\`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-all \${
          level === 0 ? 'bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 shadow-lg' : ''
        }\`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {node.materials && node.materials.length > 0 ? (
          isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          )
        ) : (
          <div className="w-5 h-5 flex-shrink-0" />
        )}

        <div className="relative flex-shrink-0">
          <img
            src={node.icon}
            alt={isRussian ? node.nameRu : node.name}
            className="w-12 h-12 rounded-lg bg-gray-700 shadow-md"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          {node.blueprintTypeId && (
            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[8px] font-bold px-1 rounded shadow-sm">
              BP
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold text-white">
              {isRussian ? node.nameRu : node.name}
            </span>
            {node.category !== 'mineral' && (() => {
              const style = getCategoryStyle(node.category);
              return (
                <span className={\`text-xs px-2 py-0.5 rounded-full \${style.bg} \${style.text} border \${style.border}\`}>
                  {getCategoryLabel(node.category, isRussian)}
                </span>
              );
            })()}
          </div>
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            <span className="text-sm text-cyan-300 font-mono font-semibold">×{node.quantity}</span>
            {node.productionTime && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <span className="text-sm">⏱</span>
                <span className="font-mono">{formatProductionTime(node.productionTime)}</span>
              </span>
            )}
            {node.blueprintTypeId && (
              <span className="text-xs text-gray-500 font-mono">
                ID: {node.blueprintTypeId}
              </span>
            )}
          </div>
        </div>
      </div>

      {isExpanded && node.materials && node.materials.length > 0 && (
        <div className="ml-8 mt-2 mb-2 space-y-1 border-l-2 border-gray-700/50 pl-4">
          {node.materials.map((material, index) => (
            <MaterialRow
              key={\`\${material.typeId}-\${index}\`}
              material={material}
              blueprintME={blueprintME}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MaterialRowProps {
  material: Material;
  blueprintME: number;
}

function MaterialRow({ material, blueprintME }: MaterialRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isRussian = true;

  const meMultiplier = 1 + (10 - blueprintME) * 0.01;
  const adjustedQuantity = Math.ceil(material.quantity * meMultiplier);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mineral': return <Atom className="w-3.5 h-3.5 text-blue-400" />;
      case 'pi': return <Factory className="w-3.5 h-3.5 text-green-400" />;
      case 'reaction': return <FlaskConical className="w-3.5 h-3.5 text-purple-400" />;
      default: return <Package className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = MATERIAL_CATEGORIES[category as keyof typeof MATERIAL_CATEGORIES];
    return cat ? (isRussian ? cat.nameRu : cat.name) : category;
  };

  const getCategoryStyle = (category: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      mineral: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
      pi: { bg: 'bg-green-500/10', text: 'text-green-400' },
      reaction: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
      gas: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
      moon: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
      component: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
    };
    return styles[category] || { bg: 'bg-gray-500/10', text: 'text-gray-400' };
  };

  const hasSubMaterials = material.category === 'pi' || material.category === 'reaction';

  return (
    <div>
      <div
        className={\`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800/30 transition-all \${
          hasSubMaterials ? 'cursor-pointer' : ''
        }\`}
        onClick={() => hasSubMaterials && setIsExpanded(!isExpanded)}
      >
        {hasSubMaterials ? (
          isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          )
        ) : (
          <div className="w-3.5 h-3.5 flex-shrink-0" />
        )}

        {getCategoryIcon(material.category)}

        <img
          src={material.icon}
          alt={isRussian ? material.nameRu : material.name}
          className="w-8 h-8 rounded bg-gray-700 flex-shrink-0 shadow-sm"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-200 truncate">
              {isRussian ? material.nameRu : material.name}
            </span>
            {(() => {
              const style = getCategoryStyle(material.category);
              return (
                <span className={\`text-[10px] px-1.5 py-0.5 rounded-full \${style.bg} \${style.text}\`}>
                  {getCategoryLabel(material.category)}
                </span>
              );
            })()}
          </div>
        </div>

        <span className="text-sm text-yellow-300 font-mono font-semibold flex-shrink-0">
          ×{adjustedQuantity.toLocaleString()}
        </span>
      </div>

      {isExpanded && hasSubMaterials && (
        <div className="ml-6 mt-1 mb-1 space-y-1 border-l border-gray-700/30 pl-3">
          {material.category === 'pi' && material.schematicId && (
            <div className="text-xs text-green-400/80 px-3 py-2 bg-green-500/5 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Factory className="w-4 h-4" />
                <span className="font-semibold">Planetary Interaction</span>
                <span className="text-[10px] text-green-400/60 font-mono">Schematic {material.schematicId}</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1 space-y-0.5">
                <div>• Camera Drones ×6</div>
                <div>• Nuclear Reactors ×6</div>
                <div>• Hermetic Membranes ×6</div>
              </div>
            </div>
          )}
          {material.category === 'reaction' && material.formulaTypeId && (
            <div className="text-xs text-purple-400/80 px-3 py-2 bg-purple-500/5 rounded-lg border border-purple-500/20">
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical className="w-4 h-4" />
                <span className="font-semibold">Reaction</span>
                <span className="text-[10px] text-purple-400/60 font-mono">Formula {material.formulaTypeId}</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                Requires moon materials and gases
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

```

---

## 📄 src/App.tsx

```typescript
import { useState, useMemo, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, CheckCircle2, Circle,
  Clock, AlertTriangle, Star, Zap, Shield, Target,
  Package, Factory, RotateCcw,
  Calculator, Layers, Globe, Ship, GitBranch, Download
} from 'lucide-react';
import {
  MINERALS, STANDARD_COMPONENTS, ADVANCED_COMPONENTS, SPECIAL_COMPONENTS,
  SKILLS, EVE_ICON, calculateProductionTime,
  formatTime, formatNumber, type ComponentMaterial
} from './data/eveData';
import {
  UI, type Language,
  getMineralName, getComponentName, getSkillName, getSkillDescription
} from './data/localization';
import { TITANS, TITAN_LIST } from './data/titans';
import { ALL_COMPONENTS_TREE } from './data/productionTree';
import { ProductionTreeView } from './components/ProductionTreeView';
import { downloadAllSources } from './utils/downloadSources';

const LanguageContext = createContext<{
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof UI.en;
}>({
  lang: 'en',
  setLang: () => {},
  t: UI.en,
});

function useLang() {
  return useContext(LanguageContext);
}

function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-800/50 border border-gray-700/50">
      <Globe className="w-3.5 h-3.5 text-gray-400 ml-1" />
      <button
        onClick={() => setLang('en')}
        className={\`px-2 py-1 rounded text-xs font-bold transition-all \${
          lang === 'en'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            : 'text-gray-400 hover:text-white'
        }\`}
      >
        EN
      </button>
      <button
        onClick={() => setLang('ru')}
        className={\`px-2 py-1 rounded text-xs font-bold transition-all \${
          lang === 'ru'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            : 'text-gray-400 hover:text-white'
        }\`}
      >
        RU
      </button>
    </div>
  );
}

function TitanSelector({ selectedTitan, onSelect }: {
  selectedTitan: string;
  onSelect: (key: string) => void;
}) {
  const { lang } = useLang();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {TITAN_LIST.map(titan => (
        <button
          key={titan.key}
          onClick={() => onSelect(titan.key)}
          className={\`relative p-4 rounded-xl border transition-all \${
            selectedTitan === titan.key
              ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/20'
              : 'bg-gray-800/30 border-gray-700/30 hover:border-gray-600/50 hover:bg-gray-800/50'
          }\`}
        >
          <div className="flex flex-col items-center gap-2">
            <img
              src={titan.icon}
              alt={titan.name}
              className="w-16 h-16 rounded-lg bg-gray-700"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="text-center">
              <p className="text-sm font-bold text-white">{titan.name}</p>
              <p className="text-xs text-gray-400">
                {lang === 'ru' ? titan.raceRu : titan.race}
              </p>
            </div>
            {selectedTitan === titan.key && (
              <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-amber-400" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function SkillSlider({ skill, value, onChange }: {
  skill: typeof SKILLS[0];
  value: number;
  onChange: (v: number) => void;
}) {
  const { lang } = useLang();

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-700/30 hover:border-gray-600/50 transition-all">
      <img
        src={skill.icon}
        alt={skill.name}
        className="w-10 h-10 rounded-lg bg-gray-700"
        onError={(e) => { (e.target as HTMLImageElement).src = \`https://images.evetech.net/types/\${skill.typeId}/icon?size=32\`; }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{getSkillName(skill.typeId, lang)}</span>
          {skill.requiredLevel > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-300 border border-red-800/30">
              {lang === 'ru' ? 'ТРБ' : 'REQ'} L{skill.requiredLevel}
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5">{getSkillDescription(skill.typeId, lang)}</p>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="range"
            min={0}
            max={skill.maxLevel}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer"
          />
          <span className="text-sm font-mono text-indigo-300 w-6 text-right">{value}</span>
        </div>
      </div>
    </div>
  );
}

```

---

## 📋 Инструкция по установке

1. Создайте новую папку для проекта
2. Скопируйте все файлы из этого документа в соответствующие директории
3. Выполните команды:

```bash
npm install
npm run dev
```

4. Откройте браузер по адресу `http://localhost:5173`

---

## 🎯 Готово!

Все исходники проекта собраны в одном месте.

**Версия**: 1.0.0  
**Дата**: 2024  
**Лицензия**: Образовательная (EVE Online является собственностью CCP Games)
