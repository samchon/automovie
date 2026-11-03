


/** The limits and sample counts of the curve rules. */
export namespace HumanCurveConstants {
  /**
   * The parts a body has, by the chains that carry them, with the fewest and most
   * of each: a hand has a thumb and four fingers, a foot five toes. `<side>`
   * stands for each side in turn.
   */
  export const ANATOMY: readonly [label: string, chains: RegExp, least: number, most: number][] = [
    ["trunk", /^(trunk|upper)$/, 1, Infinity],
    ["neck", /^head$/, 1, 1],
    ["head", /^head\.(lower|middle|upper)$/, 1, Infinity],
    ["ear", /^ear\.[a-z]+\.<side>$/, 1, Infinity],
    ["arm", /^arm\.<side>$/, 1, 1],
    ["palm", /^hand\.<side>\./, 1, Infinity],
    ["thumb", /^thumb\.<side>$/, 1, 1],
    ["finger", /^finger\.<side>\./, 4, 4],
    ["leg", /^leg\.<side>$/, 1, 1],
    ["foot", /^foot\.<side>$/, 1, 1],
    ["toe", /^toe\.<side>\./, 5, 5],
  ];

  /**
   * Share of stature the crown and the sole may stand off: a person's stature
   * falls by about this much from morning to evening, so a reading within it is
   * the same stature.
   */
  export const STATURE_DAY: number = 0.01;

  /** Ring samples. */
  export const PHASES: number = 96;

  /** Surface samples per layer interval. */
  export const STEPS: number = 4;

  /** A ring shorter than this is a cap's tip, mm. */
  export const SMALL: number = 20;

  /** Largest slope for a ring of `SLOPE_GIRTH`: the crotch opens this steeply. */
  export const SLOPE: number = 13;

  /** Girth the slope limit is stated for, mm. */
  export const SLOPE_GIRTH: number = 1300;

  // The limits below sit just above what reads smooth in the viewer. A limit
  // licenses everything under it, so a defect the viewer shows gets its own rule
  // rather than a tighter number here.

  /** Tangential motion per unit of the rings' axial gap. */
  export const SLIDE: number = 8;

  /** Span's swing past its chord. */
  export const OVERSHOOT: number = 1.5;

  /** Turn along a longitudinal curve between samples, degrees. */
  export const CREASE: number = 40;

  /** Ring samples an ear's rim is found among. */
  export const EAR_PHASES: number = 960;

  /** Cosine between neighbouring cells' normals below which an ear folds. */
  export const EAR_FOLD: number = -0.2;

  /**
   * Arc a crossing may enclose on an ear, mm: a helix tube's thickness, the most a
   * pinch's corner can overshoot and stay inside the rim.
   */
  export const EAR_CROSSING: number = 3.4;

  /** Shortest step along a curve that can show a corner, mm. */
  export const SEGMENT: number = 0.5;

  /** Curvature times the radius above which a flip is a band. */
  export const BAND: number = 34;

  /** Curvature times the radius that counts as bending at all. */
  export const BAND_FLOOR: number = 1.5;

  /** Median of the radius's height curvature, times the radius, round a ring. */
  export const RIDGE: number = 8;

  /** Height between the rings a ridge is read from, mm. */
  export const RIDGE_STEP: number = 6;

  /** Bearings a ridge is read at. */
  export const RIDGE_BEARINGS: number = 48;

  /** Cosine of a bearing past which it faces forward or back. */
  export const RIDGE_FACE: number = 0.7;

  /** Curvature flips a plain section may have round its ring. */
  export const RIPPLES: number = 14;

  /** And a section through the face, which crosses the nose, lips and sockets. */
  export const FACE_RIPPLES: number = 26;

  /** Station slope a face reaches at the lips' fissure. */
  export const FACE_SLOPE: number = 17;

  /** Turn a face reaches at the lips and the nose's base, degrees. */
  export const FACE_CREASE: number = 52;

  /** Station step of the face's profiles, mm. */
  export const PROFILE_STEP: number = 0.25;

  /** Stature the base and jaw lengths are stated for, mm. */
  export const BASE_STATURE: number = 1700;

  /** Least radius of the nose base's convex turns, mm. */
  export const BASE_RADIUS: number = 1.5;

  /** Distances from the midline the base is read at, in the nostril's own. */
  export const BASE_PLACES: readonly number[] = [0, 0.5, 1, 1.5];

  /** Heights the base is read over about the nostril, and the profile's sample, mm. */
  export const BASE_BELOW: number = 6;

  /** Height the nose's base is read above the nostril, mm. */
  export const BASE_ABOVE: number = 12;

  /** Step of the base's profile samples, mm. */
  export const BASE_SAMPLE: number = 0.4;

  /**
   * Largest radius of the turn under the mandible's border, mm: the soft tissue
   * over the bone's edge, which fat rounds but does not take away.
   */
  export const JAW_TURN: number = 10;

  /** Height either side of the jaw's turn read for its radius, and the sample, mm. */
  export const JAW_BAND: number = 12;

  /** Step of the jaw's profile samples, mm. */
  export const JAW_SAMPLE: number = 1;

  /** Height over which the jaw's turn under is read, mm. */
  export const JAW_SPAN: number = 3;

  /** Distances from the midline the jaw is read at, in the lower head's half-width. */
  export const JAW_PLACES: readonly number[] = [0.5, 0.65, 0.8];

  /** Share of the lower head above its bottom ring where the neck's base ends. */
  export const JAW_ABOVE_NECK: number = 0.15;

  /**
   * Turn of the shading normal across one cell along the jaw's border, degrees:
   * above it the border read as a row of facets in the viewer.
   */
  export const FACET: number = 15;

  /** Heights below the nostrils the jaw's border is read between, mm. */
  export const FACET_BELOW: readonly number[] = [25, 80];

  /** Distances from the midline it is read between, in the jaw's half-width. */
  export const FACET_ACROSS: readonly number[] = [0.35, 1.3];

  /**
   * The mouth, which it leaves out: within this share of the jaw's half-width
   * of the midline, and less than this far below the nostrils, mm.
   */
  export const FACET_MOUTH: readonly number[] = [0.6, 40];

  /** How far behind the lower head's axis it is read, in the jaw's half-width. */
  export const FACET_BACK: number = 0.5;

  /**
   * Turn of the shading normal across one cell of a nostril's closure, degrees:
   * at 40 and more its walls read in the viewer as a white, jagged fringe.
   */
  export const PIT: number = 30;

  /** Rise of the skin forward per millimetre of height beside the nose. */
  export const LEDGE: number = 0.7;

  /** Distances from the midline it is read at, in the nostril's own: past the wing. */
  export const LEDGE_PLACES: readonly number[] = [2.5, 2.8];

  /** Heights it is read over about the nostril, and its step, mm. */
  export const LEDGE_BELOW: number = 12;

  /** Height the ledge is read above the nostril, mm. */
  export const LEDGE_ABOVE: number = 6;

  /** Step of the ledge's samples, mm. */
  export const LEDGE_STEP: number = 1;

  /** Turn of a face's section across one control, degrees. */
  export const ALIAS: number = 30;

  /** Bearing from the ring's centre within which a section is the face, radians. */
  export const ALIAS_FRONT: number = 1;

  /** A ring shorter than this closes on a pole, where slopes run steep, mm. */
  export const CAP: number = 150;

  /** Open join, mm. */
  export const GAP: number = 4;

  /** Kink across a seam, degrees. */
  export const SEAM: number = 65;

  /**
   * Kink at a fold by design, degrees: the armpit's front, which a heavy arm
   * deepens, and the crease beside the nose where the face's two chains meet.
   */
  export const ARMPIT_SEAM: number = 85;

  /** Kink where the palm leaves the wrist, whose sections turn across the hand, degrees. */
  export const WRIST_SEAM: number = 96;

  /** Station offset of the seam's tangents, mm. */
  export const REACH: number = 6;

  /** Turn of the skin across a limb's or the trunk's join, degrees. */
  export const FOLD: number = 20;

  /** Station offset either side of a join where its turn is read, mm. */
  export const FOLD_REACH: number = 4;

  /** Station half step of a surface normal, mm. */
  export const NORMAL_STATION: number = 0.02;

  /** Phase half step of a surface normal, radians. */
  export const NORMAL_PHASE: number = 1e-3;

  /** Where the thigh's top is read under the crotch ring, a share of stature. */
  export const THIGH_TOP: number = 0.024;

  /** Largest girth of the thigh's top per unit of the thigh tape. */
  export const THIGH_GIRTH: number = 1.15;

  /** Skin depths either side of a joint over which the rig spreads its turn: its cut. */
  export const BEND: number = 1.5;

  /**
   * Depth under the crotch ring where a leg's section is its own, mm: within it
   * the slit's pinch is a corner by design, as the event join's taper holds.
   */
  export const CORNER_FROM: number = 6;

  /** Depth step of the corner rule, mm. */
  export const CORNER_STEP: number = 1;

  /** Phases of a ring the corner rule reads: about a quarter millimetre apart. */
  export const CORNER_PHASES: number = 1440;

  /** Samples either side of a pinch's nearest point the corner rule reads. */
  export const CORNER_REACH: number = 60;

  /** Largest turn of the trunk's ring over one control pitch, degrees. */
  export const TEETH: number = 30;

  /** Control pitches either side of a pinch where the teeth rule is not read. */
  export const TEETH_PINCH: number = 6;

  /** Plane the rear is read in, a share of the crotch ring's half width. */
  export const SHELF_PLANE: number = 0.3;

  /** Rise of the rear under the crotch ring per unit of its rise above. */
  export const SHELF: number = 2;

  /** Depth per half width of the crotch ring's rear, one control from its tip. */
  export const TIP: number = 1.5;

  /** Difference of the back's turn either side of the joint, degrees. */
  export const STEP: number = 4;

  /** Height the back's turn is read over, mm. */
  export const STEP_REACH: number = 16;

  /** Half arc round the back's midline that is read, radians. */
  export const STEP_ARC: number = 0.5;

  /** Shares of stature under the crotch ring where a streak is read. */
  export const STREAK_SHARES: number[] = [0.04, 0.05];

  /** Third difference round a leg's ring of 512 points, mm. */
  export const STREAK: number = 0.3;

  /** Sides' difference under equal inputs, mm. */
  export const MIRROR: number = 1.5;

  /** How far a limb may pass the midline, mm: the softness of the thighs' contact. */
  export const MIDLINE: number = 1.5;

  /** Turn along a foot's longitudinal curve, degrees per radius of its ring. */
  export const RIB: number = 250;

  /** Station step a rib is read at, mm. */
  export const RIB_STEP: number = 1;

  /** Phases a rib is read at. */
  export const RIB_PHASES: number = 64;

  /** A ring smaller than this is a cap's tip, whose curve turns by design, mm. */
  export const RIB_RADIUS: number = 3;

  /** Shortest step along a curve that can show a rib, mm. */
  export const RIB_SEGMENT: number = 0.2;

  /** Sharpest fold between a hand's neighbouring triangles, degrees. */
  export const HAND_TEAR: number = 110;

  /** Layer intervals up the arm that count as the hand's skin. */
  export const HAND_ARM_LAYERS: number = 12;

  /** Most a child's own end ring stands off the arc it inherits, mm. */
  export const HAND_JOIN: number = 1;

  /** Fold past which a hand's edge counts toward a crumple, degrees. */
  export const HAND_SHARP: number = 30;

  /** Radius of the patch in which sharp edges are counted, mm. */
  export const HAND_PATCH: number = 4;

  /** Most sharp edges one patch of a hand may hold. */
  export const HAND_CRUMPLE: number = 8;

  /** Share of a chain's median radius below which the surface skips a ring for its dome. */
  export const DOME_FLOOR: number = 0.35;

  /** How far behind a web the ball is read, mm: past any toe's crease. */
  export const BALL_BACK: number = 6;

  /** How far either side of a web its neighbouring skin is read, mm. */
  export const BALL_SIDE: number = 9;

  /** Height of a groove in the ball that reads, mm. */
  export const BALL: number = 1;

  /** Station step of the ball's skin, mm. */
  export const BALL_STEP: number = 0.5;

  /** Phases of the ball's skin. */
  export const BALL_PHASES: number = 360;

  /** Length of a chain read from its toe end, mm. */
  export const BALL_CHAIN: number = 60;

  /** Angle a toe's dome may leave its tube at, degrees. */
  export const DOME: number = 15;
}
