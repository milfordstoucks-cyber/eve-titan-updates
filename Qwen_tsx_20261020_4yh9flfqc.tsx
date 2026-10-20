import { useState, memo } from 'react';
import { ChevronDown, ChevronRight, Package, FlaskConical, Factory, Atom } from 'lucide-react';
import {
  MATERIAL_CATEGORIES,
  formatProductionTime,
  type Material,
  type ProductionNode,
} from '../data/productionTree';
import type { Language } from '../data/localization';

interface ProductionTreeViewProps {
  node: ProductionNode;
  level?: number;
  blueprintME?: number;
  lang?: Language;
}

export const ProductionTreeView = memo(function ProductionTreeView({
  node,
  level = 0,
  blueprintME = 0,
  lang = 'en',
}: ProductionTreeViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isRussian = lang === 'ru';

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mineral':
        return <Atom className="h-4 w-4 text-blue-400" />;
      case 'pi':
        return <Factory className="h-4 w-4 text-green-400" />;
      case 'reaction':
        return <FlaskConical className="h-4 w-4 text-purple-400" />;
      case 'component':
        return <Package className="h-4 w-4 text-orange-400" />;
      default:
        return <Package className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = MATERIAL_CATEGORIES[category as keyof typeof MATERIAL_CATEGORIES];
    if (!cat) return category;
    return isRussian ? cat.nameRu : cat.name;
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

    return (
      styles[category] || {
        bg: 'bg-gray-500/20',
        text: 'text-gray-300',
        border: 'border-gray-500/30',
      }
    );
  };

  const hasMaterials = Boolean(node.materials && node.materials.length > 0);

  return (
    <div className="select-none">
      <div
        className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-all hover:bg-white/5 ${
          level === 0
            ? 'border border-white/10 bg-gradient-to-r from-white/[0.04] to-white/[0.02] shadow-lg shadow-black/20'
            : ''
        }`}
        onClick={() => hasMaterials && setIsExpanded((value) => !value)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            hasMaterials && setIsExpanded((value) => !value);
          }
        }}
        aria-expanded={isExpanded}
      >
        {hasMaterials ? (
          isExpanded ? (
            <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
          )
        ) : (
          <div className="h-5 w-5 flex-shrink-0" />
        )}

        <div className="relative flex-shrink-0">
          <img
            src={node.icon}
            alt={isRussian ? node.nameRu : node.name}
            className="h-12 w-12 rounded-lg bg-gray-800 object-contain shadow-md"
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.style.visibility = 'hidden';
            }}
          />
          {node.blueprintTypeId && (
            <div className="absolute -bottom-1 -right-1 rounded bg-blue-500 px-1 text-[8px] font-bold text-white shadow-sm">
              BP
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-white">
              {isRussian ? node.nameRu : node.name}
            </span>

            {node.category !== 'mineral' && (
              <span
                className={`rounded-full border px-2 py-0.5 text-xs ${
                  getCategoryStyle(node.category).bg
                } ${getCategoryStyle(node.category).text} ${getCategoryStyle(node.category).border}`}
              >
                {getCategoryLabel(node.category)}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-4">
            <span className="font-mono text-sm font-semibold text-cyan-300">
              ×{node.quantity.toLocaleString()}
            </span>

            {node.productionTime ? (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <span className="text-sm">⏱</span>
                <span className="font-mono">{formatProductionTime(node.productionTime)}</span>
              </span>
            ) : null}

            {node.blueprintTypeId ? (
              <span className="font-mono text-xs text-gray-500">ID: {node.blueprintTypeId}</span>
            ) : null}
          </div>
        </div>
      </div>

      {isExpanded && hasMaterials ? (
        <div className="mb-2 ml-8 mt-2 space-y-1 border-l-2 border-white/10 pl-4">
          {node.materials.map((material, index) => (
            <MaterialRow
              key={`${material.typeId}-${index}`}
              material={material}
              blueprintME={blueprintME}
              lang={lang}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
});

interface MaterialRowProps {
  material: Material;
  blueprintME: number;
  lang: Language;
}

const MaterialRow = memo(function MaterialRow({
  material,
  blueprintME,
  lang,
}: MaterialRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isRussian = lang === 'ru';

  const meMultiplier = Math.max(0.01, 1 - blueprintME / 100);
  const adjustedQuantity = Math.ceil(material.quantity * meMultiplier);

  const hasSubMaterials = material.category === 'pi' || material.category === 'reaction';

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mineral':
        return <Atom className="h-3.5 w-3.5 text-blue-400" />;
      case 'pi':
        return <Factory className="h-3.5 w-3.5 text-green-400" />;
      case 'reaction':
        return <FlaskConical className="h-3.5 w-3.5 text-purple-400" />;
      default:
        return <Package className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = MATERIAL_CATEGORIES[category as keyof typeof MATERIAL_CATEGORIES];
    if (!cat) return category;
    return isRussian ? cat.nameRu : cat.name;
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

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-lg p-2 transition-all hover:bg-white/5 ${
          hasSubMaterials ? 'cursor-pointer' : ''
        }`}
        onClick={() => hasSubMaterials && setIsExpanded((value) => !value)}
        role={hasSubMaterials ? 'button' : undefined}
        tabIndex={hasSubMaterials ? 0 : undefined}
        onKeyDown={(event) => {
          if (!hasSubMaterials) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsExpanded((value) => !value);
          }
        }}
        aria-expanded={hasSubMaterials ? isExpanded : undefined}
      >
        {hasSubMaterials ? (
          isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          )
        ) : (
          <div className="h-3.5 w-3.5 flex-shrink-0" />
        )}

        {getCategoryIcon(material.category)}

        <img
          src={material.icon}
          alt={isRussian ? material.nameRu : material.name}
          className="h-8 w-8 flex-shrink-0 rounded bg-gray-800 object-contain shadow-sm"
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.style.visibility = 'hidden';
          }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm text-gray-200">
              {isRussian ? material.nameRu : material.name}
            </span>

            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                getCategoryStyle(material.category).bg
              } ${getCategoryStyle(material.category).text}`}
            >
              {getCategoryLabel(material.category)}
            </span>
          </div>
        </div>

        <span className="flex-shrink-0 font-mono text-sm font-semibold text-yellow-300">
          ×{adjustedQuantity.toLocaleString()}
        </span>
      </div>

      {isExpanded && hasSubMaterials ? (
        <div className="mb-1 ml-6 mt-1 space-y-1 border-l border-white/10 pl-3">
          {material.category === 'pi' && material.schematicId ? (
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2 text-xs text-green-300/90">
              <div className="mb-1 flex items-center gap-2">
                <Factory className="h-4 w-4" />
                <span className="font-semibold">
                  {isRussian ? 'Планетарное производство' : 'Planetary Interaction'}
                </span>
                <span className="font-mono text-[10px] text-green-300/60">
                  Schematic {material.schematicId}
                </span>
              </div>
              <div className="mt-1 space-y-0.5 text-[11px] text-gray-400">
                <div>• {isRussian ? 'Камерные дроны ×6' : 'Camera Drones ×6'}</div>
                <div>• {isRussian ? 'Ядерные реакторы ×6' : 'Nuclear Reactors ×6'}</div>
                <div>• {isRussian ? 'Герметичные мембраны ×6' : 'Hermetic Membranes ×6'}</div>
              </div>
            </div>
          ) : null}

          {material.category === 'reaction' && material.formulaTypeId ? (
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-xs text-purple-300/90">
              <div className="mb-1 flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                <span className="font-semibold">{isRussian ? 'Реакция' : 'Reaction'}</span>
                <span className="font-mono text-[10px] text-purple-300/60">
                  Formula {material.formulaTypeId}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-gray-400">
                {isRussian
                  ? 'Требуются лунные материалы и газы.'
                  : 'Requires moon materials and gases.'}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});