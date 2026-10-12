export interface PosterParticipantItem {
  id: number;
  admissionNo?: string | null;
  fullName: string;
  photoUrl: string;
  classCode: string;
  categoryName: string;
  ownTopic?: string | null;
}

function escapeXml(unsafe: string): string {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const CATEGORY_ORDER = [
  'Qirat',
  'Naat',
  'Speech',
  'Table Topic',
  'Evolution',
  'Aah Counter',
  'Marshal',
  'Grammarian',
];

function renderHeading3D(
  text: string,
  x: number,
  y: number,
  fontSize = 34
): string {
  const safe = escapeXml(text);
  return `
    <g>
      <text x="${x - 2}" y="${y + 2}" text-anchor="middle" fill="#7DD3FC" fill-opacity="0.7" font-family="'Plus Jakarta Sans', 'Montserrat', sans-serif" font-size="${fontSize}" font-weight="800" letter-spacing="1.5">${safe}</text>
      <text x="${x + 1.5}" y="${y - 1}" text-anchor="middle" fill="#FDA4AF" fill-opacity="0.55" font-family="'Plus Jakarta Sans', 'Montserrat', sans-serif" font-size="${fontSize}" font-weight="800" letter-spacing="1.5">${safe}</text>
      <text x="${x}" y="${y}" text-anchor="middle" fill="#4B5563" font-family="'Plus Jakarta Sans', 'Montserrat', sans-serif" font-size="${fontSize}" font-weight="800" letter-spacing="1.5">${safe}</text>
    </g>
  `;
}

function renderPortraitSlot(params: {
  idKey: string;
  person?: PosterParticipantItem | null;
  cx: number;
  cy: number;
  w: number;
  h: number;
  placeholderRole: string;
  showName?: boolean;
}): string {
  const {
    idKey,
    person,
    cx,
    cy,
    w,
    h,
    placeholderRole,
    showName = true,
  } = params;
  const x = Math.round(cx - w / 2);
  const y = Math.round(cy - h / 2);
  const clipId = `clip-slot-${idKey}`;

  if (!person) {
    return `
      <g transform="translate(${x}, ${y})">
        <rect x="0" y="0" width="${w}" height="${h}" rx="${Math.round(w * 0.22)}" fill="#FFFFFF" fill-opacity="0.55" stroke="#E5C1BD" stroke-width="1.5" stroke-dasharray="6 4" />
        <circle cx="${w / 2}" cy="${h * 0.4}" r="${Math.min(w, h) * 0.18}" fill="#D6B4B0" fill-opacity="0.45" />
        <path d="M ${w * 0.22} ${h * 0.84} C ${w * 0.22} ${h * 0.62}, ${w * 0.78} ${h * 0.62}, ${w * 0.78} ${h * 0.84} Z" fill="#D6B4B0" fill-opacity="0.45" />
        <text x="${w / 2}" y="${h + 18}" text-anchor="middle" fill="#8C7370" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700">${escapeXml(placeholderRole)}</text>
      </g>
    `;
  }

  return `
    <g transform="translate(${x}, ${y})">
      <defs>
        <clipPath id="${clipId}">
          <path d="M ${w * 0.14} 0 L ${w * 0.86} 0 C ${w * 0.96} 0, ${w} ${h * 0.06}, ${w} ${h * 0.16} L ${w} ${h * 0.84} L ${w * 0.88} ${h} L ${w * 0.12} ${h} L 0 ${h * 0.84} L 0 ${h * 0.16} C 0 ${h * 0.06}, ${w * 0.04} 0, ${w * 0.14} 0 Z" />
        </clipPath>
      </defs>
      <!-- Soft Halo Behind Portrait -->
      <ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * 0.52}" ry="${h * 0.5}" fill="#FFFFFF" fill-opacity="0.7" />
      <image href="${escapeXml(person.photoUrl)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMin slice" clip-path="url(#${clipId})" />
      ${
        showName
          ? `
        <rect x="${-10}" y="${h - 4}" width="${w + 20}" height="24" rx="12" fill="#FFFFFF" fill-opacity="0.88" stroke="#E2C6C2" stroke-width="1" />
        <text x="${w / 2}" y="${h + 12}" text-anchor="middle" fill="#1F2937" font-family="'Plus Jakarta Sans', sans-serif" font-size="12.5" font-weight="800">${escapeXml(person.fullName)}</text>
      `
          : ''
      }
    </g>
  `;
}

export function buildIlmPosterSvg(params: {
  classCode: string;
  categoryName: string;
  title: string;
  subtitle: string;
  participants: PosterParticipantItem[];
  bestSpeakerOverride?: PosterParticipantItem | null;
  dateLabel?: string;
}): string {
  const { classCode, participants, bestSpeakerOverride, dateLabel } = params;
  const width = 1600;
  const height = 1130;

  const byCat = (cat: string) =>
    participants.filter(
      (p) => p.categoryName.toLowerCase() === cat.toLowerCase()
    );

  const marshals = byCat('Marshal');
  const qirats = byCat('Qirat');
  const tableTopics = byCat('Table Topic');
  const grammarians = byCat('Grammarian');
  const aahCounters = byCat('Aah Counter');
  const speeches = byCat('Speech');
  const naats = byCat('Naat');
  const evolutions = byCat('Evolution');

  const featuredBestSpeaker =
    bestSpeakerOverride || speeches[0] || naats[0] || participants[0] || null;

  const todayStamp =
    dateLabel ||
    new Date()
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
      .replace(/\//g, '-');

  // 5-slot dice coordinates for SPEAKERS (left column: x from 40 to 520, y from 680 to 1080)
  const speakerCoords = [
    { cx: 115, cy: 765 },
    { cx: 430, cy: 765 },
    { cx: 272, cy: 865 },
    { cx: 115, cy: 975 },
    { cx: 430, cy: 975 },
  ];

  // 5/6-slot grid coordinates for SINGERS / NAAT (middle column: x from 535 to 1045, y from 680 to 1080)
  const naatCoords = [
    { cx: 635, cy: 775 },
    { cx: 790, cy: 775 },
    { cx: 945, cy: 775 },
    { cx: 635, cy: 975 },
    { cx: 790, cy: 975 },
    { cx: 945, cy: 975 },
  ];

  // 5-slot dice coordinates for EVALUATORS / EVOLUTION (right column: x from 1060 to 1560, y from 680 to 1080)
  const evaluatorCoords = [
    { cx: 1155, cy: 765 },
    { cx: 1475, cy: 765 },
    { cx: 1315, cy: 865 },
    { cx: 1155, cy: 975 },
    { cx: 1475, cy: 975 },
  ];

  const speakersSvg = speakerCoords
    .map((pt, i) =>
      renderPortraitSlot({
        idKey: `spk-${i}`,
        person: speeches[i] || null,
        cx: pt.cx,
        cy: pt.cy,
        w: 122,
        h: 148,
        placeholderRole: `Speaker ${i + 1}`,
      })
    )
    .join('\n');

  const naatsSvg = naatCoords
    .slice(0, Math.max(5, naats.length))
    .map((pt, i) =>
      renderPortraitSlot({
        idKey: `naat-${i}`,
        person: naats[i] || null,
        cx: pt.cx,
        cy: pt.cy,
        w: 122,
        h: 148,
        placeholderRole: `Naat ${i + 1}`,
      })
    )
    .join('\n');

  const evaluatorsSvg = evaluatorCoords
    .map((pt, i) =>
      renderPortraitSlot({
        idKey: `eval-${i}`,
        person: evolutions[i] || null,
        cx: pt.cx,
        cy: pt.cy,
        w: 122,
        h: 148,
        placeholderRole: `Evaluator ${i + 1}`,
      })
    )
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <!-- Soft Blush-Cream Watercolor Background matching reference image -->
      <linearGradient id="blushBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FCE8E6" />
        <stop offset="35%" stop-color="#FFF7F6" />
        <stop offset="70%" stop-color="#FDF0EE" />
        <stop offset="100%" stop-color="#F9DFDC" />
      </linearGradient>

      <radialGradient id="watercolorSplash1" cx="25%" cy="20%" r="40%">
        <stop offset="0%" stop-color="#F8C8C4" stop-opacity="0.45" />
        <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
      </radialGradient>

      <radialGradient id="watercolorSplash2" cx="75%" cy="65%" r="45%">
        <stop offset="0%" stop-color="#F6C2BE" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
      </radialGradient>

      <linearGradient id="leafBronze" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#C88A70" />
        <stop offset="50%" stop-color="#A56953" />
        <stop offset="100%" stop-color="#7C4B3A" />
      </linearGradient>

      <linearGradient id="leafRose" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#E5B2A8" />
        <stop offset="100%" stop-color="#B97B6E" />
      </linearGradient>

      <filter id="softShadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.22" />
      </filter>
    </defs>

    <!-- Base Watercolor Canvas -->
    <rect width="${width}" height="${height}" fill="url(#blushBg)" />
    <circle cx="400" cy="240" r="520" fill="url(#watercolorSplash1)" />
    <circle cx="1180" cy="740" r="560" fill="url(#watercolorSplash2)" />
    <circle cx="800" cy="520" r="460" fill="#FFFFFF" fill-opacity="0.55" />

    <!-- Top-Left Botanical Leaves & Calligraphic Class Script (e.g., U3) -->
    <g opacity="0.88">
      <path d="M -10 -10 Q 120 40 240 160" stroke="#9C604C" stroke-width="2.5" fill="none" />
      <path d="M 0 0 Q 180 10 380 45" stroke="#9C604C" stroke-width="2" fill="none" />
      <path d="M 10 0 Q 40 140 60 360" stroke="#9C604C" stroke-width="2" fill="none" />
      <!-- Botanical Leaves Top-Left -->
      <path d="M 60 20 C 95 -5, 145 10, 165 45 C 125 55, 85 45, 60 20 Z" fill="url(#leafBronze)" />
      <path d="M 150 25 C 195 0, 250 18, 275 55 C 230 68, 180 55, 150 25 Z" fill="url(#leafRose)" />
      <path d="M 255 15 C 300 -8, 355 10, 385 45 C 340 58, 290 45, 255 15 Z" fill="url(#leafBronze)" opacity="0.85" />
      <path d="M 20 95 C 55 75, 95 110, 105 155 C 65 150, 35 125, 20 95 Z" fill="url(#leafRose)" />
      <path d="M 15 210 C 48 195, 82 235, 88 285 C 50 275, 25 245, 15 210 Z" fill="url(#leafBronze)" />
      <path d="M 5 330 C 35 315, 68 355, 72 405 C 38 395, 15 365, 5 330 Z" fill="url(#leafRose)" />
      <circle cx="420" cy="28" r="5" fill="#B86B52" />
      <circle cx="438" cy="36" r="4" fill="#D08870" />
      <circle cx="195" cy="145" r="5" fill="#B86B52" />
    </g>

    <!-- Bottom-Right Botanical Leaves -->
    <g opacity="0.88" transform="translate(1600, 1130) scale(-1, -1)">
      <path d="M -10 -10 Q 120 40 240 160" stroke="#9C604C" stroke-width="2.5" fill="none" />
      <path d="M 10 0 Q 40 140 60 360" stroke="#9C604C" stroke-width="2" fill="none" />
      <path d="M 60 20 C 95 -5, 145 10, 165 45 C 125 55, 85 45, 60 20 Z" fill="url(#leafBronze)" />
      <path d="M 150 25 C 195 0, 250 18, 275 55 C 230 68, 180 55, 150 25 Z" fill="url(#leafRose)" />
      <path d="M 20 95 C 55 75, 95 110, 105 155 C 65 150, 35 125, 20 95 Z" fill="url(#leafRose)" />
      <path d="M 15 210 C 48 195, 82 235, 88 285 C 50 275, 25 245, 15 210 Z" fill="url(#leafBronze)" />
      <path d="M 5 330 C 35 315, 68 355, 72 405 C 38 395, 15 365, 5 330 Z" fill="url(#leafRose)" />
    </g>

    <!-- Calligraphic Class Emblem in Top-Left (e.g., U3) -->
    <text x="125" y="138" text-anchor="middle" fill="none" stroke="#C58B76" stroke-width="3" font-family="'Cinzel', 'Playfair Display', Georgia, serif" font-style="italic" font-size="112" font-weight="700" opacity="0.85">${escapeXml(classCode)}</text>
    <text x="122" y="135" text-anchor="middle" fill="#D89E88" fill-opacity="0.35" font-family="'Cinzel', 'Playfair Display', Georgia, serif" font-style="italic" font-size="112" font-weight="700">${escapeXml(classCode)}</text>

    <!-- Center-Top "ILM" Classic Serif Title -->
    <text x="820" y="96" text-anchor="middle" fill="#111111" filter="url(#softShadow)" font-family="'Cinzel', 'Playfair Display', Georgia, serif" font-size="88" font-weight="700" letter-spacing="4">ILM</text>

    <!-- =====================================================================
         STRUCTURAL VERTICAL DIVIDER LINES (Matching Reference Image)
         ===================================================================== -->
    <!-- Upper-Right Vertical Divider (Separating Best Speaker from Qirath / Timer / Grammarians / Ah Counter) -->
    <line x1="1050" y1="0" x2="1050" y2="612" stroke="#111111" stroke-width="3" />

    <!-- Lower-Left Vertical Divider (Between SPEAKERS and SINGERS/NAAT) -->
    <line x1="532" y1="670" x2="532" y2="1130" stroke="#111111" stroke-width="3" />

    <!-- Lower-Right Vertical Divider (Between SINGERS/NAAT and EVALUATORS) -->
    <line x1="1048" y1="635" x2="1048" y2="1130" stroke="#111111" stroke-width="3" />

    <!-- =====================================================================
         UPPER-LEFT SECTION: MARSHAL
         ===================================================================== -->
    ${renderHeading3D('MARSHAL', 280, 245, 54)}
    ${renderPortraitSlot({
      idKey: 'marshal-main',
      person: marshals[0] || null,
      cx: 280,
      cy: 440,
      w: 250,
      h: 295,
      placeholderRole: 'Class Marshal',
    })}

    <!-- =====================================================================
         UPPER-CENTER SECTION: QIRATH (Replaced Best Speaker as requested)
         ===================================================================== -->
    ${renderHeading3D('QIRATH', 845, 245, 54)}
    ${renderPortraitSlot({
      idKey: 'qirath-main',
      person: qirats[0] || null,
      cx: 845,
      cy: 440,
      w: 245,
      h: 290,
      placeholderRole: 'Qirat Reciter',
    })}
    <!-- Vertical Date Stamp next to Qirath -->
    <text x="990" y="450" text-anchor="middle" transform="rotate(90, 990, 450)" fill="#E09F95" font-family="'Cinzel', Georgia, serif" font-style="italic" font-size="24" font-weight="700" letter-spacing="2">${escapeXml(todayStamp)}</text>

    <!-- =====================================================================
         UPPER-RIGHT PANEL: GRAMMARIANS & AH COUNTER (Timer removed)
         ===================================================================== -->
    ${
      tableTopics.length > 0
        ? `
      <!-- Row 1: GRAMMARIANS & AH COUNTER -->
      ${renderHeading3D('GRAMMARIAN', 1195, 65, 28)}
      ${renderPortraitSlot({
        idKey: 'grammarian-1',
        person: grammarians[0] || null,
        cx: 1195,
        cy: 165,
        w: 124,
        h: 150,
        placeholderRole: 'Grammarian',
      })}

      ${renderHeading3D('AH COUNTER', 1455, 65, 28)}
      ${renderPortraitSlot({
        idKey: 'ah-counter-1',
        person: aahCounters[0] || null,
        cx: 1455,
        cy: 165,
        w: 124,
        h: 150,
        placeholderRole: 'Aah Counter',
      })}

      <!-- Row 2: TABLE TOPIC -->
      ${renderHeading3D('TABLE TOPIC', 1325, 305, 30)}
      ${tableTopics
        .slice(0, 3)
        .map((tt, idx) => {
          const total = Math.min(3, tableTopics.length);
          const spacing = total === 1 ? 0 : total === 2 ? 220 : 165;
          const startX = 1325 - ((total - 1) * spacing) / 2;
          return renderPortraitSlot({
            idKey: `tt-${idx}`,
            person: tt,
            cx: startX + idx * spacing,
            cy: 430,
            w: 118,
            h: 144,
            placeholderRole: `Topic ${idx + 1}`,
          });
        })
        .join('\n')}
    `
        : `
      <!-- Row 1: GRAMMARIANS -->
      ${renderHeading3D('GRAMMARIANS', 1325, 88, 34)}
      ${renderPortraitSlot({
        idKey: 'grammarian-1',
        person: grammarians[0] || null,
        cx: 1325,
        cy: 215,
        w: 155,
        h: 185,
        placeholderRole: 'Grammarian',
      })}

      <!-- Row 2: AH COUNTER -->
      ${renderHeading3D('AH COUNTER', 1325, 385, 34)}
      ${renderPortraitSlot({
        idKey: 'ah-counter-1',
        person: aahCounters[0] || null,
        cx: 1325,
        cy: 505,
        w: 155,
        h: 185,
        placeholderRole: 'Aah Counter',
      })}
    `
    }

    <!-- =====================================================================
         LOWER THREE COLUMNS: SPEAKERS (5) | SINGERS / NAAT (5) | EVALUATORS (5)
         ===================================================================== -->
    <!-- Column 1: SPEAKERS -->
    ${renderHeading3D('SPEAKERS', 272, 668, 38)}
    ${speakersSvg}

    <!-- Column 2: SINGERS (NAAT) -->
    ${renderHeading3D('SINGERS · NAAT', 790, 665, 36)}
    ${naatsSvg}

    <!-- Column 3: EVALUATORS (EVOLUTION) -->
    ${renderHeading3D('EVALUATORS', 1315, 668, 38)}
    ${evaluatorsSvg}
  </svg>`;
}

export function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}
