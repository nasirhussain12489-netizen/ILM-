import React, { useState, useMemo } from 'react';
import {
  Download,
  Maximize2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Send,
} from 'lucide-react';
import { PosterRecord } from '../types.ts';
import { IlmLogo, downloadPosterAsPng } from './IlmLogo.tsx';
import { buildIlmPosterSvg, svgToDataUrl, CATEGORY_ORDER } from '../lib/posterSvg.ts';

interface PosterStageCardProps {
  poster: PosterRecord;
  isHero?: boolean;
  onChangePoster?: () => void;
  onPrevPoster?: () => void;
  totalPostersCount?: number;
  currentPosterIndex?: number;
  onInspectPoster?: (poster: PosterRecord) => void;
  onEditStudio?: (poster: PosterRecord) => void;
  onOpenStudio?: (poster: PosterRecord) => void;
  onRegenerate?: () => void;
  onPostToFeed?: (poster: PosterRecord) => void;
}

export const PosterStageCard: React.FC<PosterStageCardProps> = ({
  poster,
  isHero = false,
  onChangePoster,
  onPrevPoster,
  totalPostersCount = 1,
  currentPosterIndex = 0,
  onInspectPoster,
  onEditStudio,
  onOpenStudio,
  onRegenerate,
  onPostToFeed,
}) => {
  const studioHandler = onEditStudio || onOpenStudio;
  const [downloading, setDownloading] = useState(false);

  const parsedParticipants = useMemo(() => {
    try {
      return JSON.parse(poster.participantsSnapshot || '[]');
    } catch {
      return [];
    }
  }, [poster.participantsSnapshot]);

  const isCustomStudioPng = poster.posterImageUrl?.startsWith('data:image/png');

  // Always render the fresh botanical blush-cream compartmentalized SVG poster from participantsSnapshot unless customized in Photoshop Studio
  const renderedPosterUrl = useMemo(() => {
    if (isCustomStudioPng) {
      return poster.posterImageUrl;
    }
    const svg = buildIlmPosterSvg({
      classCode: poster.classCode,
      categoryName: poster.categoryName,
      title: poster.title,
      subtitle: poster.subtitle,
      participants: parsedParticipants,
    });
    return svgToDataUrl(svg);
  }, [
    isCustomStudioPng,
    poster.posterImageUrl,
    poster.classCode,
    poster.categoryName,
    poster.title,
    poster.subtitle,
    parsedParticipants,
  ]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      if (isCustomStudioPng) {
        const link = document.createElement('a');
        link.href = poster.posterImageUrl;
        link.download = `ILM_${poster.classCode}_Custom_Studio_Poster.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        await downloadPosterAsPng(poster);
      }
    } finally {
      setDownloading(false);
    }
  };

  const count = parsedParticipants.length;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0E1118] via-[#090B10] to-[#07080C] border-2 border-[#D4AF37]/55 shadow-2xl ${
        isHero ? 'p-5 sm:p-8 lg:p-10' : 'p-4 sm:p-6'
      }`}
    >
      {/* Top Row: Brand Lockup + Actions */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          <IlmLogo size={isHero ? 'md' : 'sm'} showSubtitle={isHero} />
        </div>

        <div className="flex items-center gap-2.5 text-xs text-neutral-300">
          <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 font-bold text-[#F3D068] tracking-widest uppercase">
            Class {poster.classCode}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-medium text-neutral-200">
            Official Designer Class Poster
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular text-[#F3D068] font-semibold">
            {count} / 24 Candidates
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {studioHandler && (
            <button
              type="button"
              onClick={() => studioHandler(poster)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#C89D2E] via-[#E8C55B] to-[#C89D2E] hover:brightness-110 text-neutral-950 font-bold text-xs transition-all whitespace-nowrap shrink-0 cursor-pointer shadow"
              title="Edit poster in Full Photoshop Studio"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit in Photoshop Studio</span>
            </button>
          )}

          {onPostToFeed && (
            <button
              type="button"
              onClick={() => onPostToFeed(poster)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-600/50 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Post this class poster directly to the Class Feed"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>Post to Feed</span>
            </button>
          )}

          {onInspectPoster && (
            <button
              type="button"
              onClick={() => onInspectPoster(poster)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Open poster in full view"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Full View</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#161922] hover:bg-[#1E2230] text-[#F3D068] border border-[#D4AF37]/40 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Exporting...' : 'Download Poster'}</span>
          </button>
        </div>
      </div>

      {/* Category Summary Chips */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 my-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORY_ORDER.map((cat) => {
            const catCount = parsedParticipants.filter(
              (p: { categoryName: string }) => p.categoryName === cat
            ).length;
            return (
              <span
                key={cat}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                  catCount > 0
                    ? 'bg-[#151926] text-[#F3D068] border-[#D4AF37]/40'
                    : 'bg-neutral-950/60 text-neutral-500 border-neutral-800/80'
                }`}
              >
                {cat}: {catCount}
              </span>
            );
          })}
        </div>
      </div>

      {/* Main Botanical Blush-Cream Compartmentalized Poster Image (Matches Reference Image 100%) */}
      <div
        onClick={() => onInspectPoster && onInspectPoster(poster)}
        className="relative z-10 my-2 rounded-xl overflow-hidden border-2 border-[#D4AF37]/50 shadow-2xl bg-[#FFF5F5] cursor-pointer group"
      >
        <img
          src={renderedPosterUrl}
          alt={`Class ${poster.classCode} Official Competition Poster`}
          className="w-full h-auto block object-contain"
        />
      </div>

      {/* Poster Footer & Change Poster Controls */}
      <div className="relative z-10 mt-5 pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-neutral-400 tracking-wider uppercase text-center sm:text-left">
          <span className="text-[#D4AF37] font-display font-semibold">
            Class {poster.classCode} Unified Competition Poster
          </span>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <span>Marshal · Best Speaker · Qirath · Timer · Grammarian · Ah Counter · Speakers · Singers · Evaluators</span>
        </div>

        {isHero && onChangePoster && (
          <div className="flex items-center gap-3">
            {onPrevPoster && totalPostersCount > 1 && (
              <button
                type="button"
                onClick={onPrevPoster}
                aria-label="Previous poster"
                className="p-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onChangePoster}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#C89D2E] via-[#E8C55B] to-[#C89D2E] hover:brightness-110 text-neutral-950 font-semibold text-sm shadow-lg transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Change Class Poster</span>
            </button>

            {totalPostersCount > 1 && (
              <button
                type="button"
                onClick={onChangePoster}
                aria-label="Next poster"
                className="p-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <span className="text-xs font-mono-tabular text-neutral-400 ml-1">
              {currentPosterIndex + 1} / {Math.max(1, totalPostersCount)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
