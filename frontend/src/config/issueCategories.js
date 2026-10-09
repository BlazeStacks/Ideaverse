import {
  CircleHelp,
  CloudRain,
  Construction,
  Droplets,
  Footprints,
  Landmark,
  Lightbulb,
  TrafficCone,
  Trash2,
  Trees,
  Waves,
} from 'lucide-react'

/**
 * Civic issue categories — the single source of truth.
 *
 * Everything category-related is defined here once and consumed by the
 * reporting form, the category grid, the complaint generator, the authority
 * directory matcher and the dashboard labels. Adding or renaming a category
 * must not require editing a component.
 *
 * Each entry declares:
 *  - `id`             stable identifier used in state, matching and storage
 *  - `label`          the name shown to citizens
 *  - `description`    one short sentence, no jargon
 *  - `commonIssues`   examples of what belongs in the category
 *  - `keywords`       terms used to map an AI `issue_type` onto a category
 *                     (a *suggestion* only — never applied silently)
 *  - `Icon`           Lucide icon component
 *  - `followUpQuestions` a couple of optional questions asked only when the
 *                     category is chosen, to keep the form short
 *  - `complaintSubject` subject line used when drafting a formal complaint
 *  - `complaintPhrase`  how the issue is described inside the complaint body
 */

/** Sentinel id for "I don't know — let the AI identify it". */
export const AI_DECIDE_CATEGORY_ID = 'let-ai-decide'

export const ISSUE_CATEGORIES = [
  {
    id: 'road-damage',
    label: 'Road Damage',
    Icon: Construction,
    description: 'Potholes, cracked surfaces and broken road edges.',
    commonIssues: ['Potholes', 'Cracked roads', 'Damaged road surfaces'],
    keywords: ['pothole', 'potholes', 'road damage', 'damaged road', 'cracked road', 'cracked surface', 'broken road', 'road surface damage', 'sunken road', 'road depression', 'asphalt'],
    followUpQuestions: [
      {
        id: 'traffic-obstruction',
        label: 'Does the damaged area obstruct traffic?',
        helper: 'Useful for the authority to prioritise the repair.',
        options: ['Yes, it blocks traffic', 'Partly, vehicles slow down', 'No', 'Not sure'],
      },
      {
        id: 'two-wheeler-risk',
        label: 'Could it be dangerous for two-wheelers or pedestrians?',
        options: ['Yes', 'No', 'Not sure'],
      },
    ],
    complaintSubject: 'Request for Inspection and Repair of Damaged Road',
    complaintPhrase: 'damaged road surface',
  },
  {
    id: 'traffic-road-safety',
    label: 'Traffic and Road Safety',
    Icon: TrafficCone,
    description: 'Damaged signals, missing signs and worn road markings.',
    commonIssues: [
      'Damaged traffic signals',
      'Missing road signs',
      'Damaged road markings',
      'Other visible road-safety problems',
    ],
    keywords: ['traffic signal', 'signal', 'traffic light', 'road sign', 'signboard', 'road marking', 'zebra crossing', 'reflector', 'speed breaker', 'road safety', 'signal pole'],
    followUpQuestions: [
      {
        id: 'junction-affected',
        label: 'Is this at a junction or crossing?',
        options: ['Yes, a busy junction', 'Yes, a minor junction', 'No', 'Not sure'],
      },
      {
        id: 'signal-dark',
        label: 'Is the signal or sign completely non-functional?',
        options: ['Yes, completely dark or missing', 'Partly working or damaged', 'Not sure'],
      },
    ],
    complaintSubject: 'Request for Repair of Traffic Signal or Road Safety Infrastructure',
    complaintPhrase: 'damaged or non-functional traffic and road-safety infrastructure',
  },
  {
    id: 'waterlogging-flooding',
    label: 'Waterlogging and Flooding',
    Icon: CloudRain,
    description: 'Standing water on roads and in public areas.',
    commonIssues: ['Waterlogged roads', 'Flooded public areas', 'Blocked rainwater drains'],
    keywords: ['waterlogging', 'waterlogged', 'flooding', 'flooded', 'standing water', 'rainwater drain', 'rain water drain', 'stagnant water', 'water accumulation'],
    followUpQuestions: [
      {
        id: 'path-blocked',
        label: 'Is the water blocking a road or pedestrian pathway?',
        helper: 'This helps the authority judge how urgent the problem is.',
        options: ['Yes, the road is blocked', 'Yes, the footpath is blocked', 'Partly passable', 'No', 'Not sure'],
      },
      {
        id: 'recurring',
        label: 'Does this happen after every spell of rain?',
        options: ['Yes, it recurs frequently', 'Only after heavy rain', 'No, this is unusual', 'Not sure'],
      },
    ],
    complaintSubject: 'Request for Drainage Inspection and Removal of Waterlogging',
    complaintPhrase: 'waterlogging or flooding at a public location',
  },
  {
    id: 'drainage-sewage',
    label: 'Drainage and Sewage',
    Icon: Waves,
    description: 'Blocked or overflowing drains and sewage on public land.',
    commonIssues: ['Blocked drains', 'Overflowing drains', 'Visible sewage overflow'],
    keywords: ['drain', 'drainage', 'blocked drain', 'sewage', 'sewer', 'manhole', 'gutter', 'overflowing drain', 'choked drain', 'nallah', 'gutter overflow'],
    followUpQuestions: [
      {
        id: 'sewage-overflow',
        label: 'Is sewage overflowing onto a public surface?',
        options: ['Yes', 'No, only rainwater', 'Not sure'],
      },
      {
        id: 'cover-missing',
        label: 'Is a drain cover missing or broken?',
        options: ['Yes', 'No', 'Not sure'],
      },
    ],
    complaintSubject: 'Request for Clearance of Blocked Drain and Correction of Sewage Overflow',
    complaintPhrase: 'a blocked, overflowing or damaged drain',
  },
  {
    id: 'water-supply-leakage',
    label: 'Water Supply and Leakage',
    Icon: Droplets,
    description: 'Visible pipeline leaks and damaged public water connections.',
    commonIssues: [
      'Visible pipeline leaks',
      'Damaged public water connections',
      'Water wastage from infrastructure',
    ],
    keywords: ['water leak', 'pipeline leak', 'pipe leak', 'leaking pipe', 'water pipeline', 'water supply', 'burst pipe', 'tap', 'water wastage', 'valve'],
    followUpQuestions: [
      {
        id: 'continuous-leak',
        label: 'Is water flowing continuously from the leak?',
        options: ['Yes, continuously', 'Only at certain times', 'A slow drip', 'Not sure'],
      },
      {
        id: 'supply-affected',
        label: 'Is the leak affecting water supply nearby?',
        options: ['Yes', 'No', 'Not sure'],
      },
    ],
    complaintSubject: 'Request for Repair of Leaking Public Water Pipeline',
    complaintPhrase: 'a visible leak in public water infrastructure',
  },
  {
    id: 'waste-management',
    label: 'Waste Management',
    Icon: Trash2,
    description: 'Overflowing bins, accumulated garbage and dumping on public land.',
    commonIssues: ['Overflowing garbage bins', 'Garbage accumulation', 'Illegal dumping'],
    keywords: ['garbage', 'waste', 'trash', 'rubbish', 'bin', 'dustbin', 'dumping', 'debris', 'litter', 'garbage dump', 'sweeping'],
    followUpQuestions: [
      {
        id: 'health-risk',
        label: 'Is the waste close to homes, a school or a market?',
        options: ['Yes', 'No', 'Not sure'],
      },
    ],
    complaintSubject: 'Request for Removal of Accumulated Waste',
    complaintPhrase: 'uncollected or dumped solid waste',
  },
  {
    id: 'streetlights-electrical',
    label: 'Streetlights and Electrical Infrastructure',
    Icon: Lightbulb,
    description: 'Unlit or damaged streetlights and exposed electrical fittings.',
    commonIssues: [
      'Damaged streetlights',
      'Streetlights that appear unlit',
      'Exposed or visibly damaged electrical infrastructure',
    ],
    keywords: ['streetlight', 'street light', 'lamp', 'lamp post', 'pole', 'unlit', 'dark', 'light not working', 'electric', 'electrical', 'wire', 'cable', 'junction box', 'transformer'],
    followUpQuestions: [
      {
        id: 'hazard-exposed',
        label: 'Are wires, cables or fittings visibly exposed?',
        helper: 'Report exposed wiring as a safety hazard. Do not touch it.',
        options: ['Yes, exposed wiring is visible', 'No', 'Not sure'],
      },
      {
        id: 'area-dark',
        label: 'Does the area stay unlit at night?',
        options: ['Yes, the whole stretch is dark', 'Only this light is affected', 'Not sure'],
      },
    ],
    complaintSubject: 'Request for Repair of Streetlight or Electrical Infrastructure',
    complaintPhrase: 'a streetlight or public electrical fitting that is damaged or not working',
  },
  {
    id: 'footpaths-accessibility',
    label: 'Footpaths and Accessibility',
    Icon: Footprints,
    description: 'Broken footpaths, blocked walkways and damaged ramps.',
    commonIssues: [
      'Broken footpaths',
      'Blocked pedestrian pathways',
      'Damaged ramps',
      'Other accessibility obstacles',
    ],
    keywords: ['footpath', 'sidewalk', 'pavement', 'pathway', 'ramp', 'accessibility', 'wheelchair', 'kerb', 'curb', 'walkway', 'paving'],
    followUpQuestions: [
      {
        id: 'wheelchair-access',
        label: 'Does it block wheelchair or pram access?',
        options: ['Yes', 'No', 'Not sure'],
      },
      {
        id: 'pedestrian-diversion',
        label: 'Are pedestrians forced onto the road?',
        options: ['Yes', 'No', 'Not sure'],
      },
    ],
    complaintSubject: 'Request for Repair of Damaged Footpath or Pedestrian Access',
    complaintPhrase: 'a damaged or obstructed footpath or pedestrian access point',
  },
  {
    id: 'public-infrastructure',
    label: 'Public Infrastructure',
    Icon: Landmark,
    description: 'Damaged bus stops, benches and other public structures.',
    commonIssues: ['Damaged bus stops', 'Broken public benches', 'Damaged public structures'],
    keywords: ['bus stop', 'bus shelter', 'bench', 'public structure', 'shelter', 'railing', 'fence', 'boundary wall', 'public toilet', 'signage'],
    followUpQuestions: [
      {
        id: 'in-use',
        label: 'Is the structure still in public use?',
        options: ['Yes', 'No, it is unusable or unsafe', 'Not sure'],
      },
    ],
    complaintSubject: 'Request for Repair of Damaged Public Infrastructure',
    complaintPhrase: 'damaged public infrastructure',
  },
  {
    id: 'trees-green-spaces',
    label: 'Trees and Green Spaces',
    Icon: Trees,
    description: 'Fallen branches, damaged parks and obstructed pathways.',
    commonIssues: ['Fallen branches', 'Damaged public parks', 'Obstructed public pathways'],
    keywords: ['tree', 'branch', 'fallen tree', 'park', 'garden', 'green space', 'hedge', 'overgrown', 'foliage', 'plant'],
    followUpQuestions: [
      {
        id: 'path-obstructed',
        label: 'Is a road or pathway obstructed?',
        options: ['Yes', 'No', 'Not sure'],
      },
      {
        id: 'risk-falling',
        label: 'Could anything fall or is it touching power lines?',
        helper: 'Keep clear of damaged branches and wires.',
        options: ['Yes, it looks unsafe', 'No', 'Not sure'],
      },
    ],
    complaintSubject: 'Request for Attention to Damaged Trees or Public Green Space',
    complaintPhrase: 'damaged trees or green-space infrastructure at a public location',
  },
  {
    id: 'other-civic-issue',
    label: 'Other Civic Issue',
    Icon: CircleHelp,
    description: 'A publicly maintained problem that does not fit the categories above.',
    commonIssues: ['Any other publicly maintained civic problem'],
    keywords: [],
    followUpQuestions: [
      {
        id: 'already-reported',
        label: 'Have you already reported this somewhere?',
        options: ['No, this is the first time', 'Yes, to another channel', 'Not sure'],
      },
    ],
    complaintSubject: 'Request for Inspection of a Reported Civic Infrastructure Issue',
    complaintPhrase: 'a civic infrastructure problem at a public location',
  },
]

/** Category shown when nothing else matches. Never presented as AI output. */
export const FALLBACK_CATEGORY = ISSUE_CATEGORIES[ISSUE_CATEGORIES.length - 1]

/** Look up a category by its stable id. */
export function getIssueCategory(categoryId) {
  if (!categoryId) return null
  return ISSUE_CATEGORIES.find((category) => category.id === categoryId) ?? null
}

/** Human-readable label for a category id, with an explicit unknown fallback. */
export function getCategoryLabel(categoryId, fallback = 'Uncategorised') {
  return getIssueCategory(categoryId)?.label ?? fallback
}

/** Category-specific optional questions. Empty array when the id is unknown. */
export function getFollowUpQuestions(categoryId) {
  return getIssueCategory(categoryId)?.followUpQuestions ?? []
}

/** Complaint metadata used by the deterministic complaint template. */
export function getComplaintMeta(categoryId) {
  const category = getIssueCategory(categoryId)
  if (!category) {
    return {
      subject: 'Request for Inspection of a Reported Civic Infrastructure Issue',
      phrase: 'a civic infrastructure problem at a public location',
    }
  }
  return { subject: category.complaintSubject, phrase: category.complaintPhrase }
}

/**
 * Map a free-text `issue_type` returned by the AI onto a category id.
 *
 * This produces a *suggestion* only. The UI must always ask the citizen to
 * confirm it, and must never replace a category the citizen chose themselves.
 *
 * @param {string|null|undefined} issueType
 * @param {string|null|undefined} [description]
 * @returns {{ categoryId: string, matchedOn: string } | null}
 */
export function suggestCategoryFromText(issueType, description) {
  const haystack = [issueType, description]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLowerCase()

  if (!haystack) return null

  let best = null

  for (const category of ISSUE_CATEGORIES) {
    for (const keyword of category.keywords) {
      const index = haystack.indexOf(keyword)
      if (index === -1) continue
      // Longer keyword matches and matches inside `issue_type` win.
      const score = keyword.length * 2 + (/issueType/i.test(String(issueType ?? '')) ? 0 : 0)
      const inIssueType = String(issueType ?? '').toLowerCase().includes(keyword)
      const total = score + (inIssueType ? 10 : 0)
      if (!best || total > best.score) {
        best = { categoryId: category.id, matchedOn: keyword, score: total }
      }
    }
  }

  if (!best) return null
  return { categoryId: best.categoryId, matchedOn: best.matchedOn }
}

/**
 * Decide which category a report (and therefore its complaint) should use.
 *
 * Precedence is deliberate and never silent:
 *  1. a category the citizen chose themselves always wins;
 *  2. otherwise the AI classification is used as a *suggestion* ("source:
 *     'ai-suggestion'"), which the citizen can change on the results page;
 *  3. otherwise a neutral fallback is used.
 *
 * @param {{
 *   userCategoryId?: string|null,
 *   analysis?: { issueType?: string|null, description?: string|null } | null,
 * }} params
 * @returns {{ categoryId: string, source: 'user'|'ai-suggestion'|'fallback', matchedOn: string|null }}
 */
export function resolveEffectiveCategory({ userCategoryId = null, analysis = null } = {}) {
  if (userCategoryId && userCategoryId !== AI_DECIDE_CATEGORY_ID) {
    return { categoryId: userCategoryId, source: 'user', matchedOn: null }
  }

  const suggestion = suggestCategoryFromText(analysis?.issueType, analysis?.description)
  if (suggestion) {
    return { categoryId: suggestion.categoryId, source: 'ai-suggestion', matchedOn: suggestion.matchedOn }
  }

  return { categoryId: FALLBACK_CATEGORY.id, source: 'fallback', matchedOn: null }
}

/** Label describing where a category came from, for honest UI copy. */
export function describeCategorySource(source) {
  switch (source) {
    case 'user':
      return 'Category selected by you'
    case 'ai-suggestion':
      return 'Category suggested from the AI assessment — review and change it if it is wrong'
    default:
      return 'No category was identified; the neutral category is used by default'
  }
}
