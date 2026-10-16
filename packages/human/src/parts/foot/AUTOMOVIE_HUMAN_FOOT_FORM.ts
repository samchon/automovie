/**
 * Shared foot profile shapes, rims, sole, dorsal crest, heel and toe heights.
 *
 * Historical offline form fit across six age/sex art references supplies the
 * profile ratios. These are conventional shape parameters, not independently
 * measured clinical dimensions. The plan normalizes the transverse outline
 * as one family to the independently supplied foot breadth and carries its
 * centre from the actual heel to the shared metatarsal boundary. Heights and
 * longitudinal stations retain their stated foot-length/navicular bases.
 * The source-level normalization does not certify the final displayed
 * breadth or the original fit after representation changes.
 */
export const AUTOMOVIE_HUMAN_FOOT_FORM: {
  readonly medialOffset: readonly [number, number, number, number, number];
  readonly lateralOffset: readonly [number, number, number, number, number];
  readonly medialRim: readonly [number, number, number, number, number, number];
  readonly lateralRim: readonly [number, number, number, number];
  readonly medialSole: readonly [number, number, number, number];
  readonly medialArch: readonly [number, number];
  readonly lateralSole: readonly [number, number, number];
  readonly ridgeX: readonly [number, number, number, number];
  readonly ridgeHeight: readonly [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  readonly ridgeLift: number;
  readonly heel: {
    readonly reach: number;
    readonly back: number;
    readonly side: number;
  };
  readonly toeHeight: readonly [number, number, number, number, number];
  readonly relief: number;
  readonly hollow: {
    readonly depth: number;
    readonly at: number;
    readonly spread: number;
    readonly angle: number;
    readonly width: number;
  };
  readonly tendon: {
    readonly depth: number;
    readonly at: number;
    readonly spread: number;
    readonly angle: number;
    readonly width: number;
  };
  readonly toeRidge: {
    readonly hallux: number;
    readonly lesser: number;
    readonly width: number;
    readonly reach: number;
    readonly web: number;
  };
} = {
  /** Medial border's distance from the foot's axis at the rim's upper edge, at 0.2, 0.35, 0.55, 0.66 and 0.74 of foot length from the heel. */
  medialOffset: [0.0842, 0.1188, 0.1297, 0.1744, 0.2181],

  /** Lateral border's distance from the foot's axis at 0.2, 0.3, 0.45, 0.56 and 0.635 of foot length. */
  lateralOffset: [0.1622, 0.1663, 0.1885, 0.1909, 0.2045],

  /** Height of the medial rim's upper edge at the heel arc's end and at 0.2, 0.32, 0.45, 0.6 and 0.74 of foot length. */
  medialRim: [0.182, 0.2087, 0.204, 0.1415, 0.0815, 0.0905],

  /** Height of the lateral rim's upper edge at the heel arc's end and at 0.25, 0.45 and 0.635 of foot length. */
  lateralRim: [0.061, 0.0501, 0.0485, 0.038],

  /** Height of the sole's medial edge at the heel arc's end, 0.22, 0.62 and 0.74 of foot length. */
  medialSole: [0.076, 0.0294, 0.0096, -0.0077],

  /** Height of the sole's medial edge at 0.32 and 0.48 of foot length, as shares of navicular height: the soft tissue under the arch. */
  medialArch: [0.3888, 0.2394],

  /** Height of the sole's lateral edge at the heel arc's end, 0.3 and 0.635 of foot length. */
  lateralSole: [-0.029, 0.043, 0.0205],

  /** The dorsal crest's distance lateral of the axis at 0.1, 0.3, 0.6 and 0.8 of foot length. */
  ridgeX: [0.033, -0.024, -0.08, -0.118],

  /** The dorsal crest's height at 0, 0.12, 0.22, 0.3, 0.36, 0.45, 0.55, 0.65, 0.74, 0.82 and 0.9 of foot length, for a navicular height of 0.2 foot lengths. */
  ridgeHeight: [
    0.19, 0.2063, 0.314, 0.3435, 0.311, 0.269, 0.2275, 0.158, 0.1077, 0.095,
    0.08,
  ],

  /** Share of the navicular height's departure from 0.2 foot lengths that raises or lowers the crest over the midfoot. */
  ridgeLift: 0.2,

  /** The heel arc's reach behind its centre and the upper's edge height at its back and its sides. */
  heel: { reach: 0.088, back: 0.2131, side: 0.1081 },

  /** Dorsal height of each toe's free part, hallux to fifth: the hallux and second toe fitted, the third to fifth falling laterally, conventional, since the old cage's fitted values for them (a third toe a quarter of the second's height) served its four-sided toe tubes and flattened a swept toe. */
  toeHeight: [0.1092, 0.0685, 0.064, 0.06, 0.056],

  /** Scale of the malleoli, the hollows beside the calcaneal tendon and the tendon's line, 1 as fitted and set against renders. */
  relief: 1,

  /** The hollows either side of the calcaneal tendon: depth of foot length, middle and spread in height of lateral malleolus height, angle from the front and its spread in degrees. */
  hollow: { depth: 0.072, at: 1.31, spread: 0.95, angle: 95, width: 62 },

  /** The tendon's line set in from the heel's bulge, in the same terms as `hollow`. */
  tendon: { depth: 0.045, at: 0.99, spread: 0.41, angle: 212.5, width: 42.5 },

  /** The dorsum's descent onto the toes past the line of the metatarsophalangeal joints: the ridge over each toe at its root, of the toe's height (the old cage's dorsal heights at the base of the free toe), its half-breadth, of the toe's breadth, the share of the toes' mean length over which the dorsum comes down onto them, and the webs' height between the toes, of their mean height. */
  toeRidge: {
    hallux: 1.055,
    lesser: 1.155,
    width: 0.5533,
    reach: 0.5038,
    web: 0.5542,
  },
} as const;
