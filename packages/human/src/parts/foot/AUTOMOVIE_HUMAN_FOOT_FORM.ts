/**
 * The foot's form coefficients, each a fraction of foot length unless stated: the outline, rim and sole profiles, the dorsal crest, the heel's back and the toes.
 *
 * Fitted by us, offline, as the least-squares match of shape descriptors between this generator's limit surface and reference feet: the MakeHuman 1.x base mesh with its caucasian female and male young, child and old macro targets applied at full weight (both released CC0 by the MakeHuman team in September 2020; used numerically only, nothing of them in this package). Each reference and its counterpart from the converter for the same sex and age, given the reference's breadth-to-length ratio, were compared on the plan outline at 23 stations, the dorsal and medial-underside height profiles, five cross-sections and the heel's posterior silhouette, all normalised by foot length and breadth, and one coefficient set was fitted across all six by coordinate descent. Measured quantities stay measured: foot length and breadth, heel breadth, navicular height, the malleoli and the metatarsophalangeal joints come from the identity and the skeleton, so the fit decides only form between them. Grade: population-fitted to a modelled reference, set against anatomical plates and photographs.
 */
export const AUTOMOVIE_HUMAN_FOOT_FORM = {
  /** Medial border's distance from the foot's axis at the rim's upper edge, at 0.2, 0.35, 0.55, 0.66 and 0.74 of foot length from the heel. */
  medialOffset: [0.12, 0.147, 0.15, 0.187, 0.21],

  /** Lateral border's distance from the foot's axis at 0.2, 0.3, 0.45, 0.56 and 0.635 of foot length. */
  lateralOffset: [0.115, 0.138, 0.1695, 0.199, 0.182],

  /** Height of the medial rim's upper edge at the heel arc's end and at 0.2, 0.32, 0.45, 0.6 and 0.74 of foot length. */
  medialRim: [0.136, 0.154, 0.17, 0.174, 0.114, 0.106],

  /** Height of the lateral rim's upper edge at the heel arc's end and at 0.25, 0.45 and 0.635 of foot length. */
  lateralRim: [0.098, 0.096, 0.088, 0.067],

  /** Height of the sole's medial edge at the heel arc's end, 0.22, 0.62 and 0.74 of foot length. */
  medialSole: [0.032, 0.038, 0.03, 0.003],

  /** Height of the sole's medial edge at 0.32 and 0.48 of foot length, as shares of navicular height: the soft tissue under the arch. */
  medialArch: [0.43, 0.455],

  /** Height of the sole's lateral edge at the heel arc's end, 0.3 and 0.635 of foot length. */
  lateralSole: [0.008, 0.016, 0.012],

  /** The dorsal crest's distance lateral of the axis at 0.1, 0.3, 0.6 and 0.8 of foot length. */
  ridgeX: [0.016, 0.002, -0.03, -0.046],

  /** The dorsal crest's height at 0, 0.12, 0.22, 0.3, 0.36, 0.45, 0.55, 0.65, 0.74, 0.82 and 0.9 of foot length, for a navicular height of 0.2 foot lengths. */
  ridgeHeight: [0.168, 0.224, 0.348, 0.354, 0.329, 0.294, 0.254, 0.204, 0.164, 0.149, 0.11],

  /** Share of the navicular height's departure from 0.2 foot lengths that raises or lowers the crest over the midfoot. */
  ridgeLift: 0.4,

  /** The heel arc's reach behind its centre and the upper's edge height at its back and its sides. */
  heel: { reach: 0.062, back: 0.174, side: 0.134 },

  /** Lesser toes, second to fifth, from the metatarsophalangeal joint centre to the tip; the hallux reaches the full foot length. */
  toeLength: [0.2431, 0.221, 0.1813, 0.1873],

  /** Dorsal height of each toe's free part, hallux to fifth. */
  toeHeight: [0.11, 0.067, 0.055, 0.078, 0.083],
} as const;
