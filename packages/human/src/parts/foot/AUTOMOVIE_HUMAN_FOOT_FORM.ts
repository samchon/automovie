/**
 * The foot's form coefficients, each a fraction of foot length unless stated: the outline, rim and sole profiles, the dorsal crest, the heel's back and the toes.
 *
 * Fitted by us, offline, as the least-squares match of shape descriptors between this generator's limit surface and reference feet: the MakeHuman 1.x base mesh with its caucasian female and male young, child and old macro targets applied at full weight (both released CC0 by the MakeHuman team in September 2020; used numerically only, nothing of them in this package). Each reference and its counterpart from the converter for the same sex and age, given the reference's breadth-to-length ratio, were compared on the plan outline at 23 stations, the dorsal and medial-underside height profiles, five cross-sections and the heel's posterior silhouette, all normalised by foot length and breadth, and one coefficient set was fitted across all six by coordinate descent. Measured quantities stay measured: foot length and breadth, heel breadth, navicular height, the malleoli and the metatarsophalangeal joints come from the identity and the skeleton, so the fit decides only form between them. Grade: population-fitted to a modelled reference, set against anatomical plates and photographs.
 */
export const AUTOMOVIE_HUMAN_FOOT_FORM = {
  /** Medial border's distance from the foot's axis at the rim's upper edge, at 0.2, 0.35, 0.55, 0.66 and 0.74 of foot length from the heel. */
  medialOffset: [0.0851, 0.111, 0.1334, 0.194, 0.2187],

  /** Lateral border's distance from the foot's axis at 0.2, 0.3, 0.45, 0.56 and 0.635 of foot length. */
  lateralOffset: [0.1433, 0.1478, 0.1765, 0.1933, 0.2104],

  /** Height of the medial rim's upper edge at the heel arc's end and at 0.2, 0.32, 0.45, 0.6 and 0.74 of foot length. */
  medialRim: [0.17, 0.1967, 0.192, 0.1415, 0.0815, 0.0905],

  /** Height of the lateral rim's upper edge at the heel arc's end and at 0.25, 0.45 and 0.635 of foot length. */
  lateralRim: [0.065, 0.0501, 0.0485, 0.038],

  /** Height of the sole's medial edge at the heel arc's end, 0.22, 0.62 and 0.74 of foot length. */
  medialSole: [0.07, 0.0354, 0.0156, -0.0082],

  /** Height of the sole's medial edge at 0.32 and 0.48 of foot length, as shares of navicular height: the soft tissue under the arch. */
  medialArch: [0.3888, 0.2094],

  /** Height of the sole's lateral edge at the heel arc's end, 0.3 and 0.635 of foot length. */
  lateralSole: [-0.03, 0.037, 0.0195],

  /** The dorsal crest's distance lateral of the axis at 0.1, 0.3, 0.6 and 0.8 of foot length. */
  ridgeX: [0.033, -0.02, -0.08, -0.114],

  /** The dorsal crest's height at 0, 0.12, 0.22, 0.3, 0.36, 0.45, 0.55, 0.65, 0.74, 0.82 and 0.9 of foot length, for a navicular height of 0.2 foot lengths. */
  ridgeHeight: [0.19, 0.2183, 0.312, 0.339, 0.307, 0.27, 0.224, 0.16, 0.113, 0.157, 0.11],

  /** Share of the navicular height's departure from 0.2 foot lengths that raises or lowers the crest over the midfoot. */
  ridgeLift: 0.1,

  /** The heel arc's reach behind its centre and the upper's edge height at its back and its sides. */
  heel: { reach: 0.0899, back: 0.1901, side: 0.115 },

  /** Lesser toes, second to fifth, from the metatarsophalangeal joint centre to the tip; the hallux reaches the full foot length. */
  toeLength: [0.2691, 0.255, 0.1879, 0.1918],

  /** Dorsal height of each toe's free part, hallux to fifth. */
  toeHeight: [0.1087, 0.0681, 0.0265, 0.0923, 0.0946],

  /** How far lateral of the ankle joint centre the foot's long axis runs: the calcaneus lies lateral of the talus and the foot's axis runs out through the second ray. */
  axis: 0.0114,

  /** Scale of the malleoli, the hollows beside the calcaneal tendon and the tendon's line, 1 as fitted and set against renders. */
  relief: 1,

  /** The hollows either side of the calcaneal tendon: depth of foot length, middle and spread in height of lateral malleolus height, angle from the front and its spread in degrees. */
  hollow: { depth: 0.06, at: 1.47, spread: 0.87, angle: 110, width: 47 },

  /** The tendon's line set in from the heel's bulge, in the same terms as `hollow`. */
  tendon: { depth: 0.033, at: 1.01, spread: 0.33, angle: 205, width: 45 },
} as const;
