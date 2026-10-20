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
