/**
 * Authority directory — reporting guidance data.
 *
 * This is a small, curated, configurable dataset. It is NOT a national
 * database and it is NOT a government integration. Adding or correcting an
 * entry is a data edit in this file only; no component needs to change.
 *
 * Honesty rules this file follows:
 *  - A reporting channel is only listed as `verified` when it was identified
 *    from the authority's own domain or official communication, and it carries
 *    a `lastVerified` date explaining what was actually checked.
 *  - Nothing here claims that CivicFix can submit, pre-fill or track a
 *    complaint. Every channel is opened by the citizen, manually.
 *  - Authorities whose channel is not confirmed are still listed (so citizens
 *    know who may be responsible) but with `verificationStatus: 'unverified'`
 *    and no URL presented as official.
 *
 * Ownership is deliberately modelled as uncertain: a road may belong to the
 * municipal corporation, the state public works department, the national
 * highways authority or a cantonment board, and the correct answer depends on
 * the location and the asset. The UI therefore always shows this caveat and
 * always lets the citizen choose a different authority.
 */

/** How a channel's accuracy was established. */
export const VERIFICATION_STATUS = {
  /** Channel identified from the authority's own domain or official channel. */
  VERIFIED: 'verified',
  /** Authority is plausible for the asset, but no channel has been confirmed. */
  UNVERIFIED: 'unverified',
}

/** Date the directory entries below were last reviewed by hand. */
export const DIRECTORY_REVIEWED_ON = '2026-10-10'

/** Sentinel for "my city is not in the directory yet". */
export const OTHER_CITY_ID = 'other'

/** Cities with structured entries. Add new cities here as they are verified. */
export const SUPPORTED_CITIES = [
  { id: 'pune', label: 'Pune, Maharashtra', region: 'Maharashtra' },
]

/**
 * @typedef {{
 *   id: string,
 *   type: 'website'|'phone',
 *   label: string,
 *   url?: string,
 *   phone?: string,
 *   method: string,
 *   verificationStatus: string,
 *   lastVerified?: string,
 *   verifiedHow?: string,
 *   caveats?: string,
 * }} AuthorityChannel
 */

/**
 * @typedef {{
 *   id: string,
 *   cityIds: string[],
 *   name: string,
 *   shortName: string,
 *   authorityType: string,
 *   role: 'primary'|'alternative',
 *   handlesCategoryIds: string[],
 *   reason: string,
 *   scopeNote: string,
 *   channels: AuthorityChannel[],
 * }} AuthorityEntry
 */

/** @type {AuthorityEntry[]} */
export const AUTHORITY_ENTRIES = [
  {
    id: 'pmc',
    cityIds: ['pune'],
    name: 'Pune Municipal Corporation',
    shortName: 'PMC',
    authorityType: 'Municipal corporation (urban local body)',
    role: 'primary',
    handlesCategoryIds: [
      'road-damage',
      'traffic-road-safety',
      'waterlogging-flooding',
      'drainage-sewage',
      'waste-management',
      'streetlights-electrical',
      'footpaths-accessibility',
      'public-infrastructure',
      'trees-green-spaces',
      'other-civic-issue',
    ],
    reason:
      'Within the municipal limits, most city roads, drains, footpaths, streetlights, waste collection and public structures are maintained by the municipal corporation.',
    scopeNote:
      'Not every road inside a city belongs to the corporation. National highways, state highways, cantonment or defence land and some privately maintained roads are the responsibility of other bodies. If this complaint is not accepted, check who owns the asset.',
    channels: [
      {
        id: 'pmc-complaint-portal',
        type: 'website',
        label: 'PMC Complaint Management System',
        url: 'https://complaint.pmc.gov.in/home?language=en',
        method: 'Online complaint form on the authority’s own portal',
        verificationStatus: VERIFICATION_STATUS.VERIFIED,
        lastVerified: '2026-10-10',
        verifiedHow:
          'The portal at complaint.pmc.gov.in presents itself as the Pune Municipal Corporation Complaint Management System (checked 2026-10-10).',
        caveats:
          'CivicFix has not confirmed that this portal accepts pasted or pre-filled complaint text, and it never submits anything for you. Expect to paste or retype your complaint into their form, and keep their reference number once they issue one.',
      },
      {
        id: 'pmc-helpline',
        type: 'phone',
        label: 'PMC toll-free helpline',
        phone: '1800 1030 222',
        method: 'Phone complaint to the municipal helpline',
        verificationStatus: VERIFICATION_STATUS.VERIFIED,
        lastVerified: '2026-10-10',
        verifiedHow:
          'Number shown on the PMC Complaint Management System page (complaint.pmc.gov.in) as the toll-free line, 7am to 11pm (checked 2026-10-10).',
        caveats:
          'CivicFix does not call on your behalf. Ask for the complaint reference number and note it down.',
      },
    ],
  },
  {
    id: 'pune-cantonment',
    cityIds: ['pune'],
    name: 'Pune Cantonment Board',
    shortName: 'Cantonment Board',
    authorityType: 'Cantonment board (central government)',
    role: 'alternative',
    handlesCategoryIds: [
      'road-damage',
      'waterlogging-flooding',
      'drainage-sewage',
      'waste-management',
      'streetlights-electrical',
      'footpaths-accessibility',
      'public-infrastructure',
      'trees-green-spaces',
    ],
    reason:
      'Civic infrastructure inside cantonment limits is usually maintained by the cantonment board rather than the municipal corporation.',
    scopeNote:
      'Only applies inside cantonment limits. If your location is not in a cantonment area, the municipal corporation or the state body is the more likely owner.',
    channels: [],
  },
  {
    id: 'msedcl',
    cityIds: ['pune'],
    name: 'Maharashtra State Electricity Distribution Co. Ltd. (Mahavitaran / MSEDCL)',
    shortName: 'Mahavitaran',
    authorityType: 'State electricity distribution utility',
    role: 'alternative',
    handlesCategoryIds: ['streetlights-electrical'],
    reason:
      'Where streetlight poles, fittings or distribution infrastructure are owned by the electricity utility, electrical faults fall to the distribution company rather than the municipal body.',
    scopeNote:
      'Streetlight ownership is split in practice: many city streetlights are installed and maintained by the municipal corporation, while the supply and some poles belong to the distribution utility. If one says it is not theirs, try the other and mention that you already asked.',
    channels: [
      {
        id: 'msedcl-icrs',
        type: 'website',
        label: 'Mahavitaran online complaint registration (ICRS)',
        url: 'https://wss.mahadiscom.in/ICRS/registerComplaint.aspx?Lang=en-US',
        method: 'Online complaint registration form on the utility’s official website',
        verificationStatus: VERIFICATION_STATUS.VERIFIED,
        lastVerified: '2026-10-10',
        verifiedHow:
          'This is the utility’s own Internal Complaint Redressal System registration page on wss.mahadiscom.in (checked 2026-10-10).',
        caveats:
          'The form may require a consumer number for some complaint types. CivicFix does not submit anything and cannot confirm which categories their form accepts.',
      },
      {
        id: 'msedcl-helpline',
        type: 'phone',
        label: 'Mahavitaran helpline',
        phone: '1912 / 19120 / 1800 233 3435 / 1800 212 3435',
        method: 'Phone complaint to the utility helpline',
        verificationStatus: VERIFICATION_STATUS.VERIFIED,
        lastVerified: '2026-10-10',
        verifiedHow:
          'Numbers listed on the official mahadiscom.in Contact Us page and on the ICRS complaint page (checked 2026-10-10).',
        caveats: 'CivicFix does not call on your behalf.',
      },
    ],
  },
  {
    id: 'mh-pwd',
    cityIds: ['pune'],
    name: 'Maharashtra Public Works Department',
    shortName: 'State PWD',
    authorityType: 'State government public works department',
    role: 'alternative',
    handlesCategoryIds: ['road-damage', 'traffic-road-safety', 'public-infrastructure'],
    reason:
      'State highways and some major roads and bridges passing through a city are built and maintained by the state public works department, not the municipal corporation.',
    scopeNote:
      'Usually relevant when the road is a state highway or an arterial road with a state route number. Check the road signage or ask the municipal helpline who maintains that stretch.',
    channels: [],
  },
  {
    id: 'nhai',
    cityIds: ['pune'],
    name: 'National Highways Authority of India',
    shortName: 'NHAI',
    authorityType: 'Central government highways authority',
    role: 'alternative',
    handlesCategoryIds: ['road-damage', 'traffic-road-safety', 'footpaths-accessibility'],
    reason:
      'National highways and their service roads and structures are maintained by the national highways authority or its contractor.',
    scopeNote:
      'Relevant only for national highways (for example roads marked with an NH number) and their service roads.',
    channels: [],
  },
]

/** Cities and how many entries exist, for display in the picker. */
export function getSupportedCities() {
  return SUPPORTED_CITIES.map((city) => ({
    ...city,
    entryCount: AUTHORITY_ENTRIES.filter((entry) => entry.cityIds.includes(city.id)).length,
  }))
}

export function getCityById(cityId) {
  return SUPPORTED_CITIES.find((city) => city.id === cityId) ?? null
}

/** Entries for a city, primary role first. */
export function getEntriesForCity(cityId) {
  return AUTHORITY_ENTRIES.filter((entry) => entry.cityIds.includes(cityId)).sort(
    (a, b) => (a.role === b.role ? 0 : a.role === 'primary' ? -1 : 1),
  )
}

/** Channels that may be shown as actionable links (verified only). */
export function getVerifiedChannels(entry) {
  return (entry?.channels ?? []).filter(
    (channel) => channel.verificationStatus === VERIFICATION_STATUS.VERIFIED,
  )
}

/** Channels that exist in the data but are not confirmed. */
export function getUnverifiedChannels(entry) {
  return (entry?.channels ?? []).filter(
    (channel) => channel.verificationStatus !== VERIFICATION_STATUS.VERIFIED,
  )
}

/**
 * Suggest a city from free-text location input.
 *
 * This is a *suggestion* that the citizen must confirm — the location field is
 * free text, so it is not treated as authoritative.
 *
 * @param {string|null|undefined} location
 * @returns {{ cityId: string, matchedOn: string } | null}
 */
export function suggestCityFromLocationText(location) {
  if (typeof location !== 'string' || !location.trim()) return null
  const haystack = location.toLowerCase()
  for (const city of SUPPORTED_CITIES) {
    const cityName = city.label.split(',')[0].trim().toLowerCase()
    if (cityName && haystack.includes(cityName)) {
      return { cityId: city.id, matchedOn: cityName }
    }
  }
  return null
}

/** Reasons a recommendation cannot be given confidently. */
export const RECOMMENDATION_GAPS = {
  NO_CITY: 'no_city',
  CITY_NOT_IN_DIRECTORY: 'city_not_in_directory',
  NO_CATEGORY_MATCH: 'no_category_match',
}

const GAP_MESSAGES = {
  [RECOMMENDATION_GAPS.NO_CITY]:
    'Choose your city or jurisdiction so CivicFix can look for structured entries that match your issue.',
  [RECOMMENDATION_GAPS.CITY_NOT_IN_DIRECTORY]:
    'CivicFix does not yet have verified directory entries for this city. It will not invent a portal or a phone number. Use the guidance below to find the right office, and confirm any channel on the authority’s own website before relying on it.',
  [RECOMMENDATION_GAPS.NO_CATEGORY_MATCH]:
    'No entry in the directory is mapped to this issue category for the selected city. The bodies below are the ones CivicFix knows about for this city; confirm which of them owns the asset.',
}

/**
 * Recommend authorities for a city + issue category.
 *
 * Never returns a fabricated authority: when nothing matches, it returns the
 * gap reason so the UI can explain the uncertainty and offer guidance.
 *
 * @param {{ cityId?: string|null, categoryId?: string|null }} params
 */
export function recommendAuthorities({ cityId = null, categoryId = null } = {}) {
  if (!cityId) {
    return {
      city: null,
      primary: null,
      matches: [],
      alternatives: [],
      confident: false,
      gap: RECOMMENDATION_GAPS.NO_CITY,
      message: GAP_MESSAGES[RECOMMENDATION_GAPS.NO_CITY],
    }
  }

  const city = getCityById(cityId)
  const cityEntries = cityId === OTHER_CITY_ID ? [] : getEntriesForCity(cityId)

  if (!city || cityEntries.length === 0) {
    return {
      city,
      primary: null,
      matches: [],
      alternatives: [],
      confident: false,
      gap: RECOMMENDATION_GAPS.CITY_NOT_IN_DIRECTORY,
      message: GAP_MESSAGES[RECOMMENDATION_GAPS.CITY_NOT_IN_DIRECTORY],
    }
  }

  const matches = categoryId
    ? cityEntries.filter((entry) => entry.handlesCategoryIds.includes(categoryId))
    : []

  if (matches.length === 0) {
    return {
      city,
      primary: null,
      matches: [],
      alternatives: cityEntries,
      confident: false,
      gap: RECOMMENDATION_GAPS.NO_CATEGORY_MATCH,
      message: GAP_MESSAGES[RECOMMENDATION_GAPS.NO_CATEGORY_MATCH],
    }
  }

  const primary = matches[0]
  return {
    city,
    primary,
    matches,
    alternatives: matches.slice(1),
    otherCityEntries: cityEntries.filter((entry) => !matches.includes(entry)),
    confident: true,
    gap: null,
    message: null,
  }
}

/** Short display string for a channel's verification state. */
export function describeVerification(channel) {
  if (channel.verificationStatus === VERIFICATION_STATUS.VERIFIED) {
    return channel.lastVerified
      ? `Channel verified on ${channel.lastVerified}`
      : 'Channel verified'
  }
  return 'Channel not verified'
}
