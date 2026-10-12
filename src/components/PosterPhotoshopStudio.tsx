import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Brush,
  Check,
  Download,
  Eraser,
  Eye,
  EyeOff,
  Grid,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Move,
  Palette,
  Plus,
  Redo2,
  RefreshCw,
  Save,
  Send,
  Sliders,
  Sparkles,
  Trash2,
  Type,
  Undo2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { PosterRecord } from '../types.ts';

interface StudioParticipantCard {
  id: number;
  fullName: string;
  photoUrl: string;
  classCode: string;
  categoryName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  photoScale: number;
}

interface CustomOverlayLayer {
  id: string;
  type: 'TEXT' | 'BADGE';
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  visible: boolean;
}

interface BrushStroke {
  points: Array<{ x: number; y: number }>;
  color: string;
  size: number;
  opacity: number;
}

interface StudioStateSnapshot {
  title: string;
  subtitle: string;
  motto: string;
  bgTheme: 'OBSIDIAN_GOLD' | 'ROYAL_NAVY' | 'IMPERIAL_EMERALD' | 'VELVET_CRIMSON' | 'CUSTOM';
  customBgUrl: string | null;
  frameShape: 'ROUNDED' | 'CIRCLE' | 'ARCH' | 'SQUARE';
  borderThickness: number;
  goldGlow: number;
  vignette: number;
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  hueRotate: number;
  titleFont: string;
  titleSize: number;
  titleColor: string;
  cards: StudioParticipantCard[];
  overlays: CustomOverlayLayer[];
  strokes: BrushStroke[];
}

interface PosterPhotoshopStudioProps {
  poster: PosterRecord;
  onClose: () => void;
  onSavePoster: (
    posterId: number,
    updatedDataUrl: string,
    title: string,
    subtitle: string,
    participantsSnapshot: string
  ) => Promise<void>;
  onPostToFeed: (
    poster: PosterRecord,
    renderedDataUrl: string,
    caption: string
  ) => Promise<void>;
}

const CATEGORY_ORDER = [
  'Qirat',
  'Naat',
  'Speech',
  'Table Topic',
  'Evolution',
  'Aah Counter',
  'Marshal',
  'Grammarian',
];

function computeGridCards(
  rawParticipants: Array<{
    id: number;
    fullName: string;
    photoUrl: string;
    classCode: string;
    categoryName: string;
  }>,
  forcedCols?: number
): StudioParticipantCard[] {
  const sorted = [...rawParticipants].sort((a, b) => {
    const idxA = CATEGORY_ORDER.indexOf(a.categoryName);
    const idxB = CATEGORY_ORDER.indexOf(b.categoryName);
    const orderA = idxA === -1 ? 99 : idxA;
    const orderB = idxB === -1 ? 99 : idxB;
    if (orderA !== orderB) return orderA - orderB;
    return a.id - b.id;
  });

  const count = sorted.length;
  const cols =
    forcedCols ||
    (count <= 1
      ? 1
      : count === 2
      ? 2
      : count <= 4
      ? 2
      : count <= 9
      ? 3
      : count <= 12
      ? 4
      : 5);

  const cardWidth =
    cols === 1
      ? 330
      : cols === 2
      ? 300
      : cols === 3
      ? 275
      : cols === 4
      ? 232
      : 194;
  const cardHeight =
    cols === 1
      ? 380
      : cols === 2
      ? 315
      : cols === 3
      ? 280
      : cols === 4
      ? 245
      : 214;
  const gapX =
    cols === 1 ? 0 : cols === 2 ? 60 : cols === 3 ? 40 : cols === 4 ? 26 : 18;
  const gapY = cols <= 3 ? 26 : 18;
  const rows = Math.ceil(Math.max(count, 1) / cols);
  const startY = 390;

  return sorted.map((p, idx) => {
    const row = Math.floor(idx / cols);
    const itemsInRow =
      row === rows - 1 && count % cols !== 0 ? count % cols : cols;
    const col = idx % cols;
    const totalRowW = itemsInRow * cardWidth + (itemsInRow - 1) * gapX;
    const startX = (1200 - totalRowW) / 2;
    return {
      ...p,
      x: Math.round(startX + col * (cardWidth + gapX)),
      y: Math.round(startY + row * (cardHeight + gapY)),
      width: cardWidth,
      height: cardHeight,
      visible: true,
      photoScale: 1,
    };
  });
}

export const PosterPhotoshopStudio: React.FC<PosterPhotoshopStudioProps> = ({
  poster,
  onClose,
  onSavePoster,
  onPostToFeed,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const [activeTool, setActiveTool] = useState<
    'MOVE' | 'TEXT' | 'BRUSH' | 'ERASER'
  >('MOVE');
  const [rightTab, setRightTab] = useState<
    'LAYERS' | 'ADJUSTMENTS' | 'LAYOUT'
  >('LAYERS');
  const [zoom, setZoom] = useState(0.58);
  const [showGrid, setShowGrid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [postingFeed, setPostingFeed] = useState(false);
  const [feedCaption, setFeedCaption] = useState(
    `Official ${poster.classCode} Class Competition Poster — Speech, Naat, Evolution, Aah Counter, Marshal & Grammarian Lineup.`
  );
  const [showFeedPrompt, setShowFeedPrompt] = useState(false);

  // Brush settings
  const [brushColor, setBrushColor] = useState('#F3D068');
  const [brushSize, setBrushSize] = useState(6);
  const [brushOpacity, setBrushOpacity] = useState(0.9);

  // Selection state
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(
    null
  );

  // Dragging / Drawing refs
  const dragRef = useRef<{
    type: 'CARD' | 'OVERLAY' | 'BRUSH';
    id?: number | string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const initialParticipants = (() => {
    try {
      return JSON.parse(poster.participantsSnapshot || '[]');
    } catch {
      return [];
    }
  })();

  const [studio, setStudio] = useState<StudioStateSnapshot>(() => ({
    title: poster.title || `${poster.classCode} Class Competition Lineup`,
    subtitle:
      poster.subtitle ||
      `Class ${poster.classCode} Official Competition Roster`,
    motto: 'Together We Build Better Learners · Learn · Compete · Grow',
    bgTheme: 'OBSIDIAN_GOLD',
    customBgUrl: null,
    frameShape: 'ROUNDED',
    borderThickness: 2.5,
    goldGlow: 45,
    vignette: 35,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sepia: 0,
    hueRotate: 0,
    titleFont: 'Cinzel',
    titleSize: 38,
    titleColor: '#FFFFFF',
    cards: computeGridCards(initialParticipants),
    overlays: [],
    strokes: [],
  }));

  const [history, setHistory] = useState<StudioStateSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<StudioStateSnapshot[]>([]);

  const pushHistory = useCallback((nextState: StudioStateSnapshot) => {
    setStudio((prev) => {
      setHistory((h) => [...h.slice(-19), prev]);
      setRedoStack([]);
      return nextState;
    });
  }, []);

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack((r) => [studio, ...r]);
    setHistory((h) => h.slice(0, -1));
    setStudio(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory((h) => [...h, studio]);
    setRedoStack((r) => r.slice(1));
    setStudio(next);
  };

  // Preload images into cache and trigger redraw
  const [imagesTick, setImagesTick] = useState(0);
  const ensureImageLoaded = useCallback((url: string) => {
    if (!url) return null;
    const cached = imageCacheRef.current.get(url);
    if (cached && cached.complete) return cached;
    if (!cached) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setImagesTick((t) => t + 1);
      img.src = url;
      imageCacheRef.current.set(url, img);
    }
    return null;
  }, []);

  // Compute dynamic canvas height based on lowest card
  const canvasWidth = 1200;
  const maxCardBottom = studio.cards.reduce(
    (max, c) => (c.visible ? Math.max(max, c.y + c.height) : max),
    950
  );
  const canvasHeight = Math.max(1380, maxCardBottom + 210);

  // Main Canvas Render Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Apply global Photoshop adjustment filters
    ctx.filter = `brightness(${studio.brightness}%) contrast(${studio.contrast}%) saturate(${studio.saturation}%) sepia(${studio.sepia}%) hue-rotate(${studio.hueRotate}deg)`;

    // 1. Background Theme
    const bgGrad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    if (studio.bgTheme === 'ROYAL_NAVY') {
      bgGrad.addColorStop(0, '#050B1A');
      bgGrad.addColorStop(0.5, '#0B1938');
      bgGrad.addColorStop(1, '#040812');
    } else if (studio.bgTheme === 'IMPERIAL_EMERALD') {
      bgGrad.addColorStop(0, '#04120E');
      bgGrad.addColorStop(0.5, '#09261E');
      bgGrad.addColorStop(1, '#030C09');
    } else if (studio.bgTheme === 'VELVET_CRIMSON') {
      bgGrad.addColorStop(0, '#160508');
      bgGrad.addColorStop(0.5, '#290A10');
      bgGrad.addColorStop(1, '#0D0305');
    } else {
      bgGrad.addColorStop(0, '#07080C');
      bgGrad.addColorStop(0.45, '#0E1118');
      bgGrad.addColorStop(1, '#060709');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (studio.customBgUrl) {
      const customBg = ensureImageLoaded(studio.customBgUrl);
      if (customBg) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.drawImage(customBg, 0, 0, canvasWidth, canvasHeight);
        ctx.restore();
      }
    }

    // 2. Ambient Gold Glow
    if (studio.goldGlow > 0) {
      const glow = ctx.createRadialGradient(600, 290, 20, 600, 290, 580);
      glow.addColorStop(
        0,
        `rgba(212, 175, 55, ${(studio.goldGlow / 100) * 0.32})`
      );
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // 3. Outer Double Gold Frame
    const goldGrad = ctx.createLinearGradient(0, 0, canvasWidth, 0);
    goldGrad.addColorStop(0, '#9A7422');
    goldGrad.addColorStop(0.3, '#F3D068');
    goldGrad.addColorStop(0.5, '#FFF2B2');
    goldGrad.addColorStop(0.7, '#D4AF37');
    goldGrad.addColorStop(1, '#8C6516');

    if (studio.borderThickness > 0) {
      ctx.strokeStyle = goldGrad;
      ctx.lineWidth = studio.borderThickness;
      ctx.beginPath();
      ctx.roundRect(34, 34, canvasWidth - 68, canvasHeight - 68, 20);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.32)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(46, 46, canvasWidth - 92, canvasHeight - 92, 14);
      ctx.stroke();
    }

    // 4. Official Transparent ILM Soundwave Logo at Top Center
    ctx.save();
    ctx.translate(455, 62);
    ctx.scale(0.8, 0.8);

    // Lower tail fold
    const tailGrad = ctx.createLinearGradient(70, 110, 175, 160);
    tailGrad.addColorStop(0, '#00C6FF');
    tailGrad.addColorStop(0.55, '#0948DB');
    tailGrad.addColorStop(1, '#4A0D80');
    ctx.fillStyle = tailGrad;
    ctx.beginPath();
    ctx.moveTo(74, 114);
    ctx.bezierCurveTo(72, 138, 78, 158, 92, 162);
    ctx.bezierCurveTo(110, 166, 152, 128, 174, 96);
    ctx.closePath();
    ctx.fill();

    // Main organic pebble
    const blobGrad = ctx.createLinearGradient(14, 14, 188, 134);
    blobGrad.addColorStop(0, '#00D4FF');
    blobGrad.addColorStop(0.48, '#0A58FF');
    blobGrad.addColorStop(1, '#6A11CB');
    ctx.fillStyle = blobGrad;
    ctx.beginPath();
    ctx.moveTo(88, 14);
    ctx.bezierCurveTo(142, 14, 188, 46, 188, 82);
    ctx.bezierCurveTo(188, 118, 138, 134, 84, 134);
    ctx.bezierCurveTo(36, 134, 14, 106, 14, 70);
    ctx.bezierCurveTo(14, 34, 42, 14, 88, 14);
    ctx.closePath();
    ctx.fill();

    // 7 White Soundwave Pill Bars & Arch
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    const pills = [
      [44, 68, 8, 22],
      [58, 58, 8, 38],
      [72, 48, 8, 54],
      [120, 48, 8, 54],
      [134, 58, 8, 38],
      [148, 68, 8, 22],
    ];
    for (const [px, py, pw, ph] of pills) {
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 4);
      ctx.stroke();
    }
    // Center Arch
    ctx.beginPath();
    ctx.moveTo(88, 104);
    ctx.lineTo(88, 52);
    ctx.bezierCurveTo(88, 38, 112, 38, 112, 52);
    ctx.lineTo(112, 104);
    ctx.moveTo(95, 104);
    ctx.lineTo(95, 53);
    ctx.bezierCurveTo(95, 45, 105, 45, 105, 53);
    ctx.lineTo(105, 104);
    ctx.stroke();

    // ILM Text
    ctx.fillStyle = '#2B7FFF';
    ctx.font = "800 72px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText('ILM', 210, 96);
    ctx.fillStyle = '#E5E7EB';
    ctx.font = "600 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText('Integrated Learning Master', 210, 122);
    ctx.restore();

    // 5. Header Banner & Title
    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(340, 214);
    ctx.lineTo(860, 214);
    ctx.stroke();

    ctx.fillStyle = '#171A24';
    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(370, 232, 460, 42, 21);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F3D068';
    ctx.font = "700 15px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(
      `CLASS ${poster.classCode} · OFFICIAL COMPETITION LINEUP`,
      600,
      259
    );

    // Main Headline
    ctx.fillStyle = studio.titleColor;
    ctx.font = `700 ${studio.titleSize}px '${studio.titleFont}', Georgia, serif`;
    ctx.fillText(studio.title, 600, 322);

    // Category Roster Breakdown Summary
    const breakdownText = CATEGORY_ORDER.map((cat) => {
      const n = studio.cards.filter(
        (c) => c.visible && c.categoryName === cat
      ).length;
      return `${cat}: ${n}`;
    }).join('   ·   ');
    ctx.fillStyle = '#D4AF37';
    ctx.font = "600 14px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(breakdownText, 600, 356);

    // 6. Participant Cards (All categories combined on 1 page)
    for (const card of studio.cards) {
      if (!card.visible) continue;
      const { x, y, width: cw, height: ch } = card;
      const imgH = ch - 76;

      ctx.save();
      // Card background & border
      ctx.fillStyle = '#111318';
      ctx.strokeStyle =
        selectedCardId === card.id ? '#00D4FF' : goldGrad;
      ctx.lineWidth = selectedCardId === card.id ? 3.5 : 2.2;

      const cardRadius =
        studio.frameShape === 'SQUARE'
          ? 2
          : studio.frameShape === 'CIRCLE'
          ? 24
          : 14;
      ctx.beginPath();
      ctx.roundRect(x, y, cw, ch, cardRadius);
      ctx.fill();
      ctx.stroke();

      // Photo clip region
      ctx.save();
      ctx.beginPath();
      if (studio.frameShape === 'CIRCLE') {
        const radius = Math.min(cw - 24, imgH - 12) / 2;
        ctx.arc(x + cw / 2, y + 10 + radius, radius, 0, Math.PI * 2);
      } else if (studio.frameShape === 'ARCH') {
        const r = (cw - 12) / 2;
        ctx.moveTo(x + 6, y + 6 + imgH);
        ctx.lineTo(x + 6, y + 6 + r);
        ctx.arc(x + cw / 2, y + 6 + r, r, Math.PI, 0, false);
        ctx.lineTo(x + cw - 6, y + 6 + imgH);
        ctx.closePath();
      } else {
        ctx.roundRect(
          x + 6,
          y + 6,
          cw - 12,
          imgH,
          studio.frameShape === 'SQUARE' ? 0 : 10
        );
      }
      ctx.clip();

      ctx.fillStyle = '#1A1D24';
      ctx.fillRect(x + 6, y + 6, cw - 12, imgH);

      const pImg = ensureImageLoaded(card.photoUrl);
      if (pImg) {
        const scale = card.photoScale || 1;
        const sw = (cw - 12) * scale;
        const sh = imgH * scale;
        const dx = x + 6 - (sw - (cw - 12)) / 2;
        const dy = y + 6 - (sh - imgH) / 2;
        ctx.drawImage(pImg, dx, dy, sw, sh);
      }
      ctx.restore();

      // Category Badge on top-left of card
      const badgeW = Math.min(cw - 24, 126);
      ctx.fillStyle = 'rgba(11, 13, 20, 0.9)';
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(x + 12, y + 12, badgeW, 24, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F3D068';
      ctx.font = "700 10.5px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(
        card.categoryName.toUpperCase(),
        x + 12 + badgeW / 2,
        y + 28
      );

      // Scholar Name & Role Plate
      const nameSize = cw < 210 ? 14 : cw < 250 ? 16 : 19;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `700 ${nameSize}px 'Cinzel', Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText(card.fullName, x + cw / 2, y + imgH + 32);

      ctx.fillStyle = '#D4AF37';
      ctx.font = "600 11.5px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(
        `${card.categoryName.toUpperCase()} · ${card.classCode}`,
        x + cw / 2,
        y + imgH + 55
      );
      ctx.restore();
    }

    // 7. Custom Text & Sticker Overlay Layers
    for (const ov of studio.overlays) {
      if (!ov.visible) continue;
      ctx.save();
      ctx.fillStyle = ov.color;
      ctx.font = `700 ${ov.fontSize}px '${ov.fontFamily}', sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.75)';
      ctx.shadowBlur = 8;
      ctx.fillText(ov.text, ov.x, ov.y);

      if (selectedOverlayId === ov.id) {
        const metrics = ctx.measureText(ov.text);
        const w = metrics.width + 24;
        const h = ov.fontSize + 16;
        ctx.strokeStyle = '#00D4FF';
        ctx.lineWidth = 2;
        ctx.strokeRect(ov.x - w / 2, ov.y - ov.fontSize, w, h);
      }
      ctx.restore();
    }

    // 8. Freehand Brush Strokes
    for (const stroke of studio.strokes) {
      if (stroke.points.length < 2) continue;
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = stroke.opacity;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 9. Footer Motto & Subtitle
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(250, canvasHeight - 125);
    ctx.lineTo(950, canvasHeight - 125);
    ctx.stroke();

    ctx.fillStyle = goldGrad;
    ctx.font = "700 20px 'Cinzel', Georgia, serif";
    ctx.textAlign = 'center';
    ctx.fillText(studio.motto, 600, canvasHeight - 88);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = "600 13px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(studio.subtitle, 600, canvasHeight - 60);

    // 10. Edge Vignette Overlay
    if (studio.vignette > 0) {
      const vig = ctx.createRadialGradient(
        600,
        canvasHeight / 2,
        canvasWidth * 0.35,
        600,
        canvasHeight / 2,
        canvasHeight * 0.65
      );
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, `rgba(0,0,0,${(studio.vignette / 100) * 0.78})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Optional alignment grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.18)';
      ctx.lineWidth = 1;
      for (let gx = 100; gx < canvasWidth; gx += 100) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, canvasHeight);
        ctx.stroke();
      }
      for (let gy = 100; gy < canvasHeight; gy += 100) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(canvasWidth, gy);
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [
    studio,
    canvasHeight,
    selectedCardId,
    selectedOverlayId,
    showGrid,
    imagesTick,
    poster.classCode,
    ensureImageLoaded,
  ]);

  // Convert pointer event to 1200px canvas coordinates
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasCoords(e);

    if (activeTool === 'BRUSH') {
      const newStroke: BrushStroke = {
        points: [pt],
        color: brushColor,
        size: brushSize,
        opacity: brushOpacity,
      };
      setStudio((prev) => ({
        ...prev,
        strokes: [...prev.strokes, newStroke],
      }));
      dragRef.current = {
        type: 'BRUSH',
        startX: pt.x,
        startY: pt.y,
        origX: 0,
        origY: 0,
      };
      return;
    }

    if (activeTool === 'ERASER') {
      // Remove strokes near pointer
      setStudio((prev) => ({
        ...prev,
        strokes: prev.strokes.filter(
          (s) =>
            !s.points.some(
              (p) => Math.hypot(p.x - pt.x, p.y - pt.y) < brushSize * 3
            )
        ),
      }));
      return;
    }

    if (activeTool === 'TEXT') {
      const newId = `ov-${Date.now()}`;
      const newLayer: CustomOverlayLayer = {
        id: newId,
        type: 'TEXT',
        text: 'Custom Gold Heading',
        x: Math.round(pt.x),
        y: Math.round(pt.y),
        fontSize: 28,
        color: '#F3D068',
        fontFamily: 'Cinzel',
        visible: true,
      };
      pushHistory({
        ...studio,
        overlays: [...studio.overlays, newLayer],
      });
      setSelectedOverlayId(newId);
      setSelectedCardId(null);
      setActiveTool('MOVE');
      return;
    }

    // MOVE tool: check overlays first
    for (let i = studio.overlays.length - 1; i >= 0; i--) {
      const ov = studio.overlays[i];
      if (!ov.visible) continue;
      if (
        Math.abs(pt.x - ov.x) <= 160 &&
        pt.y >= ov.y - ov.fontSize - 10 &&
        pt.y <= ov.y + 16
      ) {
        setSelectedOverlayId(ov.id);
        setSelectedCardId(null);
        dragRef.current = {
          type: 'OVERLAY',
          id: ov.id,
          startX: pt.x,
          startY: pt.y,
          origX: ov.x,
          origY: ov.y,
        };
        return;
      }
    }

    // Check participant cards
    for (let i = studio.cards.length - 1; i >= 0; i--) {
      const c = studio.cards[i];
      if (!c.visible) continue;
      if (
        pt.x >= c.x &&
        pt.x <= c.x + c.width &&
        pt.y >= c.y &&
        pt.y <= c.y + c.height
      ) {
        setSelectedCardId(c.id);
        setSelectedOverlayId(null);
        dragRef.current = {
          type: 'CARD',
          id: c.id,
          startX: pt.x,
          startY: pt.y,
          origX: c.x,
          origY: c.y,
        };
        return;
      }
    }

    setSelectedCardId(null);
    setSelectedOverlayId(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const pt = getCanvasCoords(e);
    const drag = dragRef.current;

    if (drag.type === 'BRUSH') {
      setStudio((prev) => {
        if (prev.strokes.length === 0) return prev;
        const updated = [...prev.strokes];
        const last = { ...updated[updated.length - 1] };
        last.points = [...last.points, pt];
        updated[updated.length - 1] = last;
        return { ...prev, strokes: updated };
      });
      return;
    }

    const dx = Math.round(pt.x - drag.startX);
    const dy = Math.round(pt.y - drag.startY);

    if (drag.type === 'CARD') {
      setStudio((prev) => ({
        ...prev,
        cards: prev.cards.map((c) =>
          c.id === drag.id
            ? { ...c, x: drag.origX + dx, y: drag.origY + dy }
            : c
        ),
      }));
    } else if (drag.type === 'OVERLAY') {
      setStudio((prev) => ({
        ...prev,
        overlays: prev.overlays.map((o) =>
          o.id === drag.id
            ? { ...o, x: drag.origX + dx, y: drag.origY + dy }
            : o
        ),
      }));
    }
  };

  const handleMouseUp = () => {
    dragRef.current = null;
  };

  const exportCanvasDataUrl = (mimeType: 'image/png' | 'image/jpeg' = 'image/png') => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL(mimeType, 0.95);
  };

  const handleDownloadEdited = (format: 'png' | 'jpg') => {
    const dataUrl = exportCanvasDataUrl(
      format === 'png' ? 'image/png' : 'image/jpeg'
    );
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `ILM_${poster.classCode}_Edited_Poster.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveToDatabase = async () => {
    setSaving(true);
    try {
      const prevCardId = selectedCardId;
      const prevOvId = selectedOverlayId;
      setSelectedCardId(null);
      setSelectedOverlayId(null);

      await new Promise((r) => setTimeout(r, 60));
      const dataUrl = exportCanvasDataUrl('image/png');
      const snapshotJson = JSON.stringify(
        studio.cards.map((c) => ({
          id: c.id,
          fullName: c.fullName,
          photoUrl: c.photoUrl,
          classCode: c.classCode,
          categoryName: c.categoryName,
        }))
      );
      await onSavePoster(
        poster.id,
        dataUrl,
        studio.title,
        studio.subtitle,
        snapshotJson
      );
      setSelectedCardId(prevCardId);
      setSelectedOverlayId(prevOvId);
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerPostToFeed = async () => {
    setPostingFeed(true);
    try {
      setSelectedCardId(null);
      setSelectedOverlayId(null);
      await new Promise((r) => setTimeout(r, 60));
      const dataUrl = exportCanvasDataUrl('image/png');
      await onPostToFeed(poster, dataUrl, feedCaption);
      setShowFeedPrompt(false);
    } finally {
      setPostingFeed(false);
    }
  };

  const addQuickBadge = (badgeText: string) => {
    const newId = `badge-${Date.now()}`;
    pushHistory({
      ...studio,
      overlays: [
        ...studio.overlays,
        {
          id: newId,
          type: 'BADGE',
          text: badgeText,
          x: 600,
          y: 380,
          fontSize: 28,
          color: '#F3D068',
          fontFamily: 'Cinzel',
          visible: true,
        },
      ],
    });
    setSelectedOverlayId(newId);
  };

  const selectedCard =
    studio.cards.find((c) => c.id === selectedCardId) || null;
  const selectedOverlay =
    studio.overlays.find((o) => o.id === selectedOverlayId) || null;

  return (
    <div className="fixed inset-0 z-50 bg-[#050609] text-neutral-100 flex flex-col overflow-hidden">
      {/* =====================================================================
          TOP STUDIO HEADER BAR
         ===================================================================== */}
      <header className="h-14 px-4 bg-[#0B0D14] border-b border-neutral-800 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#F3D068] font-display font-bold text-xs">
            ILM PRO POSTER STUDIO
          </span>
          <span className="text-xs text-neutral-300 font-semibold truncate">
            Class {poster.classCode} — Unified All-Category Poster Editor
          </span>
        </div>

        {/* Center Undo / Redo / Zoom Controls */}
        <div className="hidden md:flex items-center gap-1.5 bg-[#12151F] px-2.5 py-1 rounded-lg border border-neutral-800">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Undo"
            className="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-30 cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Redo"
            className="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-30 cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <span className="text-neutral-700 mx-1">|</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.35, +(z - 0.08).toFixed(2)))}
            className="p-1.5 rounded hover:bg-neutral-800 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono-tabular w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.2, +(z + 0.08).toFixed(2)))}
            className="p-1.5 rounded hover:bg-neutral-800 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-neutral-700 mx-1">|</span>
          <button
            type="button"
            onClick={() => setShowGrid((g) => !g)}
            className={`p-1.5 rounded cursor-pointer ${
              showGrid ? 'bg-[#D4AF37] text-neutral-950' : 'hover:bg-neutral-800'
            }`}
            title="Toggle Alignment Grid"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>

        {/* Right Save / Export / Post to Feed Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleDownloadEdited('png')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151924] hover:bg-[#1E2436] text-neutral-200 border border-neutral-700 text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFeedPrompt(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#162038] hover:bg-[#1E2C4D] text-[#60A5FA] border border-[#3B82F6]/50 text-xs font-semibold cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post to Feed</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToDatabase}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#C89D2E] via-[#E8C55B] to-[#C89D2E] text-neutral-950 font-semibold text-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Poster'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* =====================================================================
          3-PANE PHOTOSHOP WORKSPACE (Left Tools | Center Canvas | Right Inspector)
         ===================================================================== */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT PHOTOSHOP TOOLBOX */}
        <aside className="w-16 bg-[#0B0D14] border-r border-neutral-800 flex flex-col items-center py-4 gap-3 shrink-0">
          {(
            [
              { id: 'MOVE', label: 'Move & Select (V)', icon: Move },
              { id: 'TEXT', label: 'Add Text Layer (T)', icon: Type },
              { id: 'BRUSH', label: 'Retouch Brush (B)', icon: Brush },
              { id: 'ERASER', label: 'Stroke Eraser (E)', icon: Eraser },
            ] as const
          ).map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(tool.id)}
                title={tool.label}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#D4AF37] text-neutral-950 shadow-lg'
                    : 'bg-[#12151F] text-neutral-300 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}

          <div className="w-8 border-t border-neutral-800 my-1" />

          {/* Quick Badge / Trophy Stamp Buttons */}
          <button
            type="button"
            onClick={() => addQuickBadge('★ OFFICIAL ILM SELECTION ★')}
            title="Stamp Official Selection Ribbon"
            className="w-10 h-10 rounded-xl bg-[#12151F] hover:bg-neutral-800 text-[#F3D068] flex items-center justify-center text-xs font-bold cursor-pointer"
          >
            ★
          </button>
          <button
            type="button"
            onClick={() => addQuickBadge('🏆 WEEKLY COMPETITION LINEUP 🏆')}
            title="Stamp Trophy Header"
            className="w-10 h-10 rounded-xl bg-[#12151F] hover:bg-neutral-800 text-[#F3D068] flex items-center justify-center text-xs font-bold cursor-pointer"
          >
            🏆
          </button>
        </aside>

        {/* CENTER INTERACTIVE CANVAS STAGE */}
        <div className="flex-1 bg-[#050609] overflow-auto flex items-start justify-center p-6 sm:p-10">
          <div
            className="shadow-2xl border border-neutral-800 bg-[#07080C] transition-all"
            style={{
              width: `${Math.round(canvasWidth * zoom)}px`,
              height: `${Math.round(canvasHeight * zoom)}px`,
            }}
          >
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`w-full h-full block ${
                activeTool === 'MOVE'
                  ? 'cursor-move'
                  : activeTool === 'BRUSH' || activeTool === 'ERASER'
                  ? 'cursor-crosshair'
                  : 'cursor-text'
              }`}
            />
          </div>
        </div>

        {/* RIGHT PHOTOSHOP INSPECTOR (LAYERS, COLOR GRADING, LAYOUT) */}
        <aside className="w-80 sm:w-96 bg-[#0B0D14] border-l border-neutral-800 flex flex-col shrink-0">
          {/* Inspector Tabs */}
          <div className="grid grid-cols-3 border-b border-neutral-800 text-xs font-semibold">
            {(
              [
                { id: 'LAYERS', label: 'Layers & Text', icon: Layers },
                { id: 'ADJUSTMENTS', label: 'Adjustments', icon: Sliders },
                { id: 'LAYOUT', label: 'Theme & Grid', icon: LayoutGrid },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setRightTab(t.id)}
                  className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                    rightTab === t.id
                      ? 'border-[#D4AF37] text-[#F3D068] bg-[#12151F]'
                      : 'border-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            {/* ===============================================================
                INSPECTOR TAB 1: LAYERS, SELECTED SCHOLAR CARD, TEXT, BRUSH
               =============================================================== */}
            {rightTab === 'LAYERS' && (
              <>
                {/* Main Poster Typography Controls */}
                <div className="p-3.5 rounded-xl bg-[#11141E] border border-neutral-800 space-y-3">
                  <div className="font-semibold text-[#F3D068] uppercase tracking-wider">
                    Poster Headline & Typography
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">
                      Main Headline
                    </label>
                    <input
                      type="text"
                      value={studio.title}
                      onChange={(e) =>
                        setStudio((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded bg-[#090B10] border border-neutral-700 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-neutral-400 mb-1">
                        Font Family
                      </label>
                      <select
                        value={studio.titleFont}
                        onChange={(e) =>
                          setStudio((prev) => ({
                            ...prev,
                            titleFont: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1.5 rounded bg-[#090B10] border border-neutral-700 text-white"
                      >
                        <option value="Cinzel">Cinzel (Luxury Serif)</option>
                        <option value="Plus Jakarta Sans">
                          Plus Jakarta Sans
                        </option>
                        <option value="Georgia">Classic Georgia</option>
                        <option value="Impact">Impact Display</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">
                        Size ({studio.titleSize}px) & Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={24}
                          max={54}
                          value={studio.titleSize}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              titleSize: Number(e.target.value),
                            }))
                          }
                          className="flex-1"
                        />
                        <input
                          type="color"
                          value={studio.titleColor}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              titleColor: e.target.value,
                            }))
                          }
                          className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">
                      Footer Subtitle
                    </label>
                    <input
                      type="text"
                      value={studio.subtitle}
                      onChange={(e) =>
                        setStudio((prev) => ({
                          ...prev,
                          subtitle: e.target.value,
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded bg-[#090B10] border border-neutral-700 text-white"
                    />
                  </div>
                </div>

                {/* Brush Tool Settings when Brush/Eraser is active */}
                {(activeTool === 'BRUSH' || activeTool === 'ERASER') && (
                  <div className="p-3.5 rounded-xl bg-[#11141E] border border-[#D4AF37]/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#F3D068]">
                        Brush & Retouch Controls
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          pushHistory({ ...studio, strokes: [] })
                        }
                        className="text-red-400 hover:underline cursor-pointer"
                      >
                        Clear All Strokes
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-neutral-400 mb-1">
                          Brush Size ({brushSize}px)
                        </label>
                        <input
                          type="range"
                          min={2}
                          max={36}
                          value={brushSize}
                          onChange={(e) =>
                            setBrushSize(Number(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-400 mb-1">
                          Brush Color
                        </label>
                        <input
                          type="color"
                          value={brushColor}
                          onChange={(e) => setBrushColor(e.target.value)}
                          className="w-full h-7 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Participant Card Inspector */}
                {selectedCard && (
                  <div className="p-3.5 rounded-xl bg-[#141A29] border border-[#00D4FF]/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#00D4FF]">
                        Selected Scholar Layer
                      </span>
                      <span className="font-mono-tabular text-neutral-400">
                        X:{selectedCard.x} Y:{selectedCard.y}
                      </span>
                    </div>
                    <div>
                      <label className="block text-neutral-300 mb-1">
                        Scholar Name
                      </label>
                      <input
                        type="text"
                        value={selectedCard.fullName}
                        onChange={(e) =>
                          setStudio((prev) => ({
                            ...prev,
                            cards: prev.cards.map((c) =>
                              c.id === selectedCard.id
                                ? { ...c, fullName: e.target.value }
                                : c
                            ),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-[#090B10] border border-neutral-700 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-neutral-300 mb-1">
                          Competition Role
                        </label>
                        <select
                          value={selectedCard.categoryName}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              cards: prev.cards.map((c) =>
                                c.id === selectedCard.id
                                  ? { ...c, categoryName: e.target.value }
                                  : c
                              ),
                            }))
                          }
                          className="w-full px-2 py-1.5 rounded bg-[#090B10] border border-neutral-700 text-white"
                        >
                          {CATEGORY_ORDER.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-neutral-300 mb-1">
                          Photo Zoom ({Math.round(selectedCard.photoScale * 100)}
                          %)
                        </label>
                        <input
                          type="range"
                          min={0.8}
                          max={1.6}
                          step={0.05}
                          value={selectedCard.photoScale}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              cards: prev.cards.map((c) =>
                                c.id === selectedCard.id
                                  ? {
                                      ...c,
                                      photoScale: Number(e.target.value),
                                    }
                                  : c
                              ),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-neutral-300 mb-1">
                          Card Width ({selectedCard.width}px)
                        </label>
                        <input
                          type="range"
                          min={160}
                          max={420}
                          value={selectedCard.width}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              cards: prev.cards.map((c) =>
                                c.id === selectedCard.id
                                  ? { ...c, width: Number(e.target.value) }
                                  : c
                              ),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-300 mb-1">
                          Card Height ({selectedCard.height}px)
                        </label>
                        <input
                          type="range"
                          min={190}
                          max={460}
                          value={selectedCard.height}
                          onChange={(e) =>
                            setStudio((prev) => ({
                              ...prev,
                              cards: prev.cards.map((c) =>
                                c.id === selectedCard.id
                                  ? { ...c, height: Number(e.target.value) }
                                  : c
                              ),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Custom Text / Badge Layer Inspector */}
                {selectedOverlay && (
                  <div className="p-3.5 rounded-xl bg-[#141A29] border border-[#00D4FF]/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#00D4FF]">
                        Selected Text / Badge Layer
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          pushHistory({
                            ...studio,
                            overlays: studio.overlays.filter(
                              (o) => o.id !== selectedOverlay.id
                            ),
                          });
                          setSelectedOverlayId(null);
                        }}
                        className="text-red-400 hover:underline cursor-pointer"
                      >
                        Delete Layer
                      </button>
                    </div>
                    <input
                      type="text"
                      value={selectedOverlay.text}
                      onChange={(e) =>
                        setStudio((prev) => ({
                          ...prev,
                          overlays: prev.overlays.map((o) =>
                            o.id === selectedOverlay.id
                              ? { ...o, text: e.target.value }
                              : o
                          ),
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded bg-[#090B10] border border-neutral-700 text-white"
                    />
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={14}
                        max={64}
                        value={selectedOverlay.fontSize}
                        onChange={(e) =>
                          setStudio((prev) => ({
                            ...prev,
                            overlays: prev.overlays.map((o) =>
                              o.id === selectedOverlay.id
                                ? { ...o, fontSize: Number(e.target.value) }
                                : o
                            ),
                          }))
                        }
                        className="flex-1"
                      />
                      <input
                        type="color"
                        value={selectedOverlay.color}
                        onChange={(e) =>
                          setStudio((prev) => ({
                            ...prev,
                            overlays: prev.overlays.map((o) =>
                              o.id === selectedOverlay.id
                                ? { ...o, color: e.target.value }
                                : o
                            ),
                          }))
                        }
                        className="w-8 h-7 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* All Scholar Layers List (Grouped by Category) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-neutral-400 font-semibold uppercase tracking-wider">
                    <span>
                      Scholar Layers ({studio.cards.length} on 1 Page)
                    </span>
                    <span>Click to Select / Drag</span>
                  </div>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {studio.cards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => {
                          setSelectedCardId(card.id);
                          setSelectedOverlayId(null);
                        }}
                        className={`p-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer ${
                          selectedCardId === card.id
                            ? 'bg-[#162038] border-[#00D4FF]'
                            : 'bg-[#11141E] border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={card.photoUrl}
                            alt={card.fullName}
                            className="w-7 h-7 rounded object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate">
                              {card.fullName}
                            </div>
                            <div className="text-[10px] text-[#F3D068]">
                              {card.categoryName} · {card.classCode}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStudio((prev) => ({
                              ...prev,
                              cards: prev.cards.map((c) =>
                                c.id === card.id
                                  ? { ...c, visible: !c.visible }
                                  : c
                              ),
                            }));
                          }}
                          className="p-1 text-neutral-400 hover:text-white cursor-pointer"
                        >
                          {card.visible ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-red-400" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ===============================================================
                INSPECTOR TAB 2: PHOTOSHOP COLOR GRADING & ADJUSTMENTS
               =============================================================== */}
            {rightTab === 'ADJUSTMENTS' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#11141E] border border-neutral-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F3D068] uppercase tracking-wider">
                      Color & Lighting Grading
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setStudio((prev) => ({
                          ...prev,
                          brightness: 100,
                          contrast: 100,
                          saturation: 100,
                          sepia: 0,
                          hueRotate: 0,
                          goldGlow: 45,
                          vignette: 35,
                        }))
                      }
                      className="text-[#00D4FF] hover:underline cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>

                  {[
                    {
                      label: 'Brightness',
                      key: 'brightness' as const,
                      min: 50,
                      max: 150,
                      unit: '%',
                    },
                    {
                      label: 'Contrast',
                      key: 'contrast' as const,
                      min: 50,
                      max: 150,
                      unit: '%',
                    },
                    {
                      label: 'Saturation',
                      key: 'saturation' as const,
                      min: 0,
                      max: 200,
                      unit: '%',
                    },
                    {
                      label: 'Warm Gold Sepia',
                      key: 'sepia' as const,
                      min: 0,
                      max: 100,
                      unit: '%',
                    },
                    {
                      label: 'Hue Shift',
                      key: 'hueRotate' as const,
                      min: -180,
                      max: 180,
                      unit: '°',
                    },
                    {
                      label: 'Gold Spotlight Glow',
                      key: 'goldGlow' as const,
                      min: 0,
                      max: 100,
                      unit: '%',
                    },
                    {
                      label: 'Edge Vignette',
                      key: 'vignette' as const,
                      min: 0,
                      max: 100,
                      unit: '%',
                    },
                  ].map((ctrl) => (
                    <div key={ctrl.key}>
                      <div className="flex items-center justify-between text-neutral-300 mb-1">
                        <span>{ctrl.label}</span>
                        <span className="font-mono-tabular text-[#F3D068]">
                          {studio[ctrl.key]}
                          {ctrl.unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={ctrl.min}
                        max={ctrl.max}
                        value={studio[ctrl.key]}
                        onChange={(e) =>
                          setStudio((prev) => ({
                            ...prev,
                            [ctrl.key]: Number(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===============================================================
                INSPECTOR TAB 3: BACKGROUND THEMES, FRAME SHAPES & AUTO-LAYOUT
               =============================================================== */}
            {rightTab === 'LAYOUT' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#11141E] border border-neutral-800 space-y-3">
                  <div className="font-semibold text-[#F3D068] uppercase tracking-wider">
                    Canvas Background Theme
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'OBSIDIAN_GOLD', label: 'Obsidian & Gold' },
                        { id: 'ROYAL_NAVY', label: 'Royal Navy & Gold' },
                        { id: 'IMPERIAL_EMERALD', label: 'Imperial Emerald' },
                        { id: 'VELVET_CRIMSON', label: 'Velvet Crimson' },
                      ] as const
                    ).map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() =>
                          setStudio((prev) => ({ ...prev, bgTheme: th.id }))
                        }
                        className={`p-2.5 rounded-lg border text-left font-medium cursor-pointer ${
                          studio.bgTheme === th.id
                            ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3D068]'
                            : 'bg-[#090B10] border-neutral-800 text-neutral-300'
                        }`}
                      >
                        {th.label}
                      </button>
                    ))}
                  </div>

                  <label className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#161A26] text-[#F3D068] border border-[#D4AF37]/40 font-medium cursor-pointer mt-2">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Custom Background Texture</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () =>
                          setStudio((prev) => ({
                            ...prev,
                            customBgUrl: String(reader.result || ''),
                          }));
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>

                {/* Portrait Frame Shape */}
                <div className="p-3.5 rounded-xl bg-[#11141E] border border-neutral-800 space-y-3">
                  <div className="font-semibold text-[#F3D068] uppercase tracking-wider">
                    Scholar Portrait Frame Style
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'ROUNDED', label: 'Rounded Gold Card' },
                        { id: 'CIRCLE', label: 'Circular Medallion' },
                        { id: 'ARCH', label: 'Classical Arch' },
                        { id: 'SQUARE', label: 'Editorial Square' },
                      ] as const
                    ).map((shape) => (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() =>
                          setStudio((prev) => ({
                            ...prev,
                            frameShape: shape.id,
                          }))
                        }
                        className={`p-2 rounded-lg border text-center cursor-pointer ${
                          studio.frameShape === shape.id
                            ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3D068]'
                            : 'bg-[#090B10] border-neutral-800 text-neutral-300'
                        }`}
                      >
                        {shape.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1-Page Auto-Grid Arrange Presets */}
                <div className="p-3.5 rounded-xl bg-[#11141E] border border-neutral-800 space-y-2.5">
                  <div className="font-semibold text-[#F3D068] uppercase tracking-wider">
                    Auto-Arrange All Scholars on 1 Page
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { cols: undefined, label: 'Smart Auto Grid' },
                      { cols: 3, label: '3-Column Grid' },
                      { cols: 4, label: '4-Column Grid' },
                      { cols: 5, label: '5-Column Compact' },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          pushHistory({
                            ...studio,
                            cards: computeGridCards(
                              studio.cards,
                              preset.cols
                            ),
                          })
                        }
                        className="p-2 rounded-lg bg-[#090B10] hover:bg-neutral-800 border border-neutral-700 text-neutral-200 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* =====================================================================
          POST TO FEED MODAL INSIDE STUDIO
         ===================================================================== */}
      {showFeedPrompt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0E1118] border border-[#D4AF37]/50 p-6 space-y-4 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-white">
              Post Class {poster.classCode} Poster to Feed
            </h3>
            <p className="text-xs text-neutral-400">
              This will export your current high-resolution poster and publish it to the Class {poster.classCode} Feed.
            </p>
            <div>
              <label className="block text-xs text-neutral-300 mb-1">
                Feed Post Caption
              </label>
              <textarea
                rows={3}
                value={feedCaption}
                onChange={(e) => setFeedCaption(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#12151F] border border-neutral-700 text-xs text-white"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowFeedPrompt(false)}
                className="px-4 py-2 rounded-lg bg-neutral-900 text-xs text-neutral-300 border border-neutral-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={postingFeed}
                onClick={handleTriggerPostToFeed}
                className="px-4 py-2 rounded-lg bg-[#D4AF37] text-neutral-950 font-semibold text-xs cursor-pointer"
              >
                {postingFeed ? 'Posting...' : 'Confirm Post to Feed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
