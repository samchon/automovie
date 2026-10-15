/**
 * The foot's form coefficients, each a fraction of foot length unless stated: the outline, rim and sole profiles, the dorsal crest, the heel's back and the toes.
 *
 * Fitted by us, offline, as the least-squares match of shape descriptors between this generator's limit surface and reference feet: the MakeHuman 1.x base mesh with its caucasian female and male young, child and old macro targets applied at full weight (both released CC0 by the MakeHuman team in September 2020; used numerically only, nothing of them in this package). Each reference and its counterpart from the converter for the same sex and age, given the reference's breadth-to-length ratio, were compared on the plan outline at 23 stations, the dorsal and medial-underside height profiles, five cross-sections and the heel's posterior silhouette, all normalised by foot length and breadth, and one coefficient set was fitted across all six by coordinate descent. Measured quantities stay measured: foot length and breadth, heel breadth, navicular height, the malleoli and the metatarsophalangeal joints come from the identity and the skeleton, so the fit decides only form between them. Grade: population-fitted to a modelled reference, set against anatomical plates and photographs.
 */
export const AUTOMOVIE_HUMAN_FOOT_FORM = {
  /** Medial border's distance from the foot's axis at the rim's upper edge, at 0.2, 0.35, 0.55, 0.66 and 0.74 of foot length from the heel. */
  medialOffset: [0.0951, 0.119, 0.1374, 0.199, 0.2187],

  /** Lateral border's distance from the foot's axis at 0.2, 0.3, 0.45, 0.56 and 0.635 of foot length. */
  lateralOffset: [0.1388, 0.1458, 0.1565, 0.1973, 0.2034],

  /** Height of the medial rim's upper edge at the heel arc's end and at 0.2, 0.32, 0.45, 0.6 and 0.74 of foot length. */
  medialRim: [0.16, 0.1767, 0.183, 0.1415, 0.0895, 0.0895],

  /** Height of the lateral rim's upper edge at the heel arc's end and at 0.25, 0.45 and 0.635 of foot length. */
  lateralRim: [0.07, 0.0701, 0.052, 0.037],

  /** Height of the sole's medial edge at the heel arc's end, 0.22, 0.62 and 0.74 of foot length. */
  medialSole: [0.06, 0.0454, 0.0256, -0.009],

  /** Height of the sole's medial edge at 0.32 and 0.48 of foot length, as shares of navicular height: the soft tissue under the arch. */
  medialArch: [0.4488, 0.2844],

  /** Height of the sole's lateral edge at the heel arc's end, 0.3 and 0.635 of foot length. */
  lateralSole: [-0.02, 0.033, 0.017],

  /** The dorsal crest's distance lateral of the axis at 0.1, 0.3, 0.6 and 0.8 of foot length. */
  ridgeX: [0.029, 0, -0.072, -0.094],

  /** The dorsal crest's height at 0, 0.12, 0.22, 0.3, 0.36, 0.45, 0.55, 0.65, 0.74, 0.82 and 0.9 of foot length, for a navicular height of 0.2 foot lengths. */
  ridgeHeight: [0.185, 0.2183, 0.316, 0.339, 0.323, 0.286, 0.232, 0.18, 0.133, 0.155, 0.11],

  /** Share of the navicular height's departure from 0.2 foot lengths that raises or lowers the crest over the midfoot. */
  ridgeLift: 0.2,

  /** The heel arc's reach behind its centre and the upper's edge height at its back and its sides. */
  heel: { reach: 0.0819, back: 0.1821, side: 0.124 },

  /** Lesser toes, second to fifth, from the metatarsophalangeal joint centre to the tip; the hallux reaches the full foot length. */
  toeLength: [0.2686, 0.261, 0.1889, 0.1913],

  /** Dorsal height of each toe's free part, hallux to fifth. */
  toeHeight: [0.1087, 0.0685, 0.034, 0.0848, 0.0935],

  /** How far lateral of the ankle joint centre the foot's long axis runs: the calcaneus lies lateral of the talus and the foot's axis runs out through the second ray. */
  axis: 0.0114,

  /** Scale of the malleoli, the hollows beside the calcaneal tendon and the tendon's line, 1 as set against renders. */
  relief: 0,
} as const;
