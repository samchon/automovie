import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * f1's head lines as authored control points (owner's orders, 2026-11-08
 * 13:1x: conquer f1 first with coordinates entered directly, each part from
 * its own zero; the parameter laws wait, commented, for the follow-up
 * algorithmization). These are the modeler's sparse knots, not samples of
 * her surface: each was placed against her reference registered in the
 * part's frame (`node:head-specs` overlays and their normal-deviation rows,
 * render `.shots/f1_head/head-2026-11-08T04-20-41-771Z`, and the landmark
 * receipts `.shots/f1_head/measure-2026-11-08T03-22-03-851Z` and
 * `measure-2026-11-08T03-49-29-355Z`), rounded to half a millimetre, with
 * the fair outline solver drawing the curve between them.
 *
 * Frame: the head frame, Frankfort about the tragia (origin the bitragion
 * midpoint, +X forward in FH, +Y normal to FH upward, +Z right), mm. The
 * outlines' knots are head-frame places (X for the midlines, the half
 * breadth for the lateral outline) at heights above FH; head.mass converts
 * them to its course's offsets at their stations.
 */
export namespace AutoMovieHumanHeadF1Lines {
  /** One authored knot of an outline: height above FH, the head-frame place, and an extremum where the outline turns. */
  export interface IKnot {
    /** Site name. */
    site: string;

    /** Height above FH, mm. */
    y: number;

    /** Head-frame X (midlines) or half breadth (lateral), mm. */
    at: number;

    /** Declared extremum of the outline's offset (zero slope there), or null. */
    sense: "max" | "min" | null;
  }

  /**
   * The pronasale, the most protruded point of the nasal tip (Farkas), her
   * reading in the head frame (receipt `measure-2026-11-08T03-22-03-851Z`,
   * landmarks.prn): the n-prn and sn-prn triangle closed it 1.9 mm behind
   * and 0.8 mm below.
   */
  export const PRONASALE: Vec3 = [117.5, -24.85, 0];

  /**
   * Legan and Burstone's labrale inferius, the lower lip's most prominent
   * point, her reading (receipt as above, landmarks.li): the lower lip's
   * protrusion belongs at this point, 6.5 mm below the stomion, not at the
   * vermilion border 10.7 mm below it.
   */
  export const LOWER_LIP: Vec3 = [96.1, -67.35, 0];

  /**
   * The nasal profile between the subnasale and the nasion, authored knots
   * in the head frame's midsagittal plane (X forward at height Y): the
   * columella's rise, the tip's underside, the supratip, the dorsum and the
   * rhinion's straight run to the nasion. They replace the declared
   * RHINION, SUPRATIP and LOBULE debts.
   */
  /**
   * Reverse-extracted (`NodeHeadExtract`, run `.shots/f1_head/extract-2026-11-08T08-01-22-373Z`:
   * her mesh cut exactly by her midsagittal plane in her world pose, the outermost point per
   * 0.5 degree, median of seven bins, Douglas-Peucker within 0.5 mm, read in the head frame by the
   * pose map), corrected by eye: the extraction's knot at -24.6 (117.6) is dropped, because the
   * pronasale (`PRONASALE`, -24.85 at 117.5) carries the tip 0.25 mm from it.
   */
  export const NOSE: { y: number; x: number; slope: number | null }[] = [
    { y: -33.4, x: 113.1, slope: null },
    { y: -29.9, x: 116.1, slope: null },
    { y: -20.8, x: 116.9, slope: null },
    { y: -16.8, x: 114.9, slope: null },
    { y: -8.7, x: 109, slope: null },
    { y: -3.3, x: 107.1, slope: null },
  ];

  /** The anterior outline above the glabella to the vertex (the forehead and the crown): reverse-extracted as `NOSE` (same run), every knot kept. */
  export const ANTERIOR: IKnot[] = [
    { site: "forehead (57.8)", y: 57.8, at: 102.5, sense: null },
    { site: "forehead (80.3)", y: 80.3, at: 95.6, sense: null },
    { site: "crown (95.4)", y: 95.4, at: 87.6, sense: null },
    { site: "crown (106.4)", y: 106.4, at: 77.1, sense: null },
    { site: "crown (111.8)", y: 111.8, at: 68.6, sense: null },
    { site: "crown (117.1)", y: 117.1, at: 57.8, sense: null },
  ];

  /**
   * The posterior outline from the nape to the vertex, around the opisthocranion (the public g-op's
   * place stays a datum of its own): reverse-extracted as `NOSE` (same run), corrected by eye: the
   * extraction's knots at 30.9 (-85.2) and 37 (-85.1) are dropped, because they stand within 10 mm
   * of the op datum's station, which sets the outline's maximum there; two values that close to one
   * datum would make the fair solver wiggle between them.
   */
  export const POSTERIOR: IKnot[] = [
    { site: "nape (-79.2)", y: -79.2, at: -70.2, sense: null },
    { site: "nape (-64)", y: -64, at: -67.4, sense: null },
    { site: "nape hollow (-47.2)", y: -47.2, at: -65.5, sense: null },
    { site: "occiput (-29.8)", y: -29.8, at: -66.7, sense: null },
    { site: "occiput (-21.9)", y: -21.9, at: -67.8, sense: null },
    { site: "occiput (23.3)", y: 23.3, at: -84.2, sense: null },
    { site: "parietal (63.3)", y: 63.3, at: -80.5, sense: null },
    { site: "parietal (78.3)", y: 78.3, at: -76.6, sense: null },
    { site: "crown (91.9)", y: 91.9, at: -70, sense: null },
    { site: "crown (104.1)", y: 104.1, at: -60.5, sense: null },
    { site: "crown (109.4)", y: 109.4, at: -55.3, sense: null },
  ];

  /**
   * The mouth's frame: origin the stomion, +Y up, |Z| the lateral distance
   * from the midline. The vermilion borders as authored knots `[|z|, height
   * above the stomion]`, placed against her lip lines (the asset's
   * crv_lip_upper_outer, crv_lip_philtrum, crv_lip_lower_outer, read in FH by
   * `node:head-measure`, receipt `measure-2026-11-08T04-37-17-243Z`): the
   * upper border's midline notch, the cupid's bow peak on the philtral
   * column, its fall to the commissure; the lower border's flat middle and
   * its rise to the commissure. They replace the elliptical taper and the
   * declared BOW of the lips' plan.
   */
  export const MOUTH: { half: number; upper: [number, number][]; lower: [number, number][] } = {
    half: 24,
    upper: [
      [0, 12],
      [6, 13.75],
      [11, 12],
      [15, 9.5],
      [19, 6.5],
      [22, 3.5],
      [24, 0.5],
    ],
    lower: [
      [0, -10.5],
      [10, -9.5],
      [16, -7.5],
      [20, -5],
      [22.5, -2.5],
      [24, 0.5],
    ],
  };

  /**
   * Each eye's frame: origin the palpebral fissure's centre (the canthi's
   * midpoint, her `pt_eye_corner_inner` and `_outer` read in FH: right eye
   * at X 82.8, Y 13.0, Z 30.95, mirrored for the left), +Y up, +Z lateral
   * (outward), +X forward. The lid margins as authored knots `[z, y]` in that
   * frame from the inner canthus (z -15.45) to the outer (+15.45), placed
   * against her crv_eyelid_upper and crv_eyelid_lower; the upper lid's crease
   * against her crv_eyecrease (receipt as for the mouth).
   */
  export const EYE: { centre: Vec3; cornea: number; upper: [number, number][]; lower: [number, number][]; crease: [number, number][] } = {
    centre: [82.8, 13.0, 30.95],
    // The globe's front (the closed lids' skin over the cornea less the lid) at the fissure's centre, head-frame X: between her upper margin's front (92.0) and her lower margin's (88.5), where the lids rest on the globe.
    cornea: 90,
    upper: [
      [-15.45, -3],
      [-10, 1.5],
      [-1, 4.5],
      [6, 5],
      [13, 4],
      [15.45, 3],
    ],
    lower: [
      [-15.45, -3],
      [-9, -3.3],
      [-1, -5.1],
      [6, -4.6],
      [11.5, -1.7],
      [15.45, 3],
    ],
    crease: [
      [-12.5, -0.3],
      [-8.5, 2.8],
      [-4, 5],
      [1, 6.7],
      [7, 7.4],
      [14, 6.7],
      [17.5, 5],
    ],
  };

  /**
   * The right auricle's frame (the left mirrors it across the midsagittal
   * plane): origin the tragion (head frame 0, 0, half t-t); +Y the auricle's
   * long axis, from her lobule's lowest rim point to her helix's top (the
   * asset's crv_ear_outer_helix read in FH, receipt
   * `measure-2026-11-08T04-37-17-243Z`); +X across the auricle, from its
   * attachment at the tragion toward the posterior helical rim at the
   * tragion's height, square to +Y; +Z = Y x X, the plate's normal (outward
   * and forward). Head-frame unit vectors.
   */
  export const EAR_AXES: { y: Vec3; x: Vec3; z: Vec3 } = {
    y: [-0.1038, 0.9686, 0.2248],
    x: [-0.7033, -0.2313, 0.6722],
    z: [0.7031, -0.0883, 0.7052],
  };

  /**
   * The auricle in its frame, swept from its root across to its rim:
   * authored knots `[x across from the attachment line, the plate's lower
   * edge (Y), its upper edge (Y), its half thickness (Z)]`, mm, placed
   * against her helical rim and attachment line in that frame (the lobule's
   * attachment at Y -30, the helix's root at Y 26, the lobule's lowest rim
   * at X 7, the helix's top at X 7 and Y 33.6, the posterior rim's farthest
   * at X 27.4 and Y 6). The first section is the root loop, the port the
   * head's band meets; the rim closes at its pole. A simplified auricle: its
   * helix, antihelix and concha reliefs are later work.
   */
  export const EAR: [number, number, number, number][] = [
    // The root stands on the attachment line (x 0, through the tragion on the head's skin), so the kept auricle lies outside the head: at 6 mm inside it (x -6) the auricle's root sweep ran through the head's skin, 945 self-crossings at the ears (f1_integration's gate, 2026-11-08).
    [0, -30, 26, 4],
    [7, -30, 33, 3],
    [14, -25, 33, 3],
    // The helix's rolled rim: the plate thickens toward its rim.
    [20, -18, 30, 3.5],
    [24, -10, 25, 4],
  ];

  /**
   * The auricle's cup: the plate's middle off its plane (ear frame Z, mm)
   * across from the root to the rim, `[x, z]`: the concha's bowl behind
   * the attachment, then the helix's rim curling forward and out.
   */
  export const EAR_CUP: [number, number][] = [
    // Starts at the root's station (`EAR`'s first section, x 0).
    [0, 0],
    [8, -3],
    [16, -2.5],
    [22, 0],
    [27.5, 2.5],
  ];

  /** The auricle's section shoulder (the conic's fullness): fuller than the exact quarter ellipse (0.414), so the plate's edges, the helix and the lobule, read as rolled rims rather than knife edges. */
  export const EAR_SHOULDER: number = 0.62;

  /** The auricle's rim pole across from the attachment line, X mm, and its height, Y mm (her posterior rim's farthest point in the ear frame). */
  export const EAR_RIM: [number, number] = [27.5, 6];

  /**
   * Her craniovertebral angle, degrees: the line from C7's spinous process
   * to the tragion above the true horizontal, standing (Zarate-Tejero et al.
   * 2024's definition), read on her whole-body reference (receipt
   * `measure-2026-11-08T03-22-03-851Z`, values.craniovertebralAngle 58.90).
   * It replaces the women's mean 50.07 (a plain mean, not her).
   */
  export const CRANIOVERTEBRAL: number = 58.9;

  /**
   * The throat in the head frame's midsagittal plane: authored knots `[y,
   * x]` above the jugular notch (the trunk's IJ starts the line), placed
   * against her throat line in her Frankfort frame: its backward bow below
   * the larynx and its rise to her cervical point C, where it leans
   * `THROAT_LEAN` forward of the vertical (her neck line, receipt as above,
   * readings.neckLeanDegrees). They replace the straight throat line at the
   * women's mean cervicomental angle.
   */
  export const THROAT: [number, number][] = [
    // Reverse-extracted as `NOSE` (same run), corrected by eye: the extraction's -130.8 (19.2) beside -130.5 (21.8) is a saw-tooth slice at the window's lower edge, dropped; -120.5 (25.4) and -119.6 (26.5) jog 1.1 mm in 0.9 mm of height (hatching), replaced by their mean; -98.4 (33.4) inside the corner's rounding is dropped, the corner left to the fillet.
    [-130.5, 21.8],
    [-120, 26],
    [-100.1, 31.6],
    // Her cervical point C (the extraction's -97.8, 35.4), shared with `SUBMENTAL`'s first knot.
    [-97.8, 35.4],
  ];

  /**
   * The submental floor's line below FH, backward from her menton, radians:
   * 9 degrees, her submental tangent (receipt
   * `measure-2026-11-08T03-22-03-851Z`, 8.97): the floor slopes gently down
   * and back from the chin into the throat's rounded corner (`FILLET_F1` of
   * the throat). A level section carries the floor only as a monotone
   * outline; her cervical point's rise above the corner is the later
   * section-family work.
   */
  export const SUBMENTAL_INCLINATION: number = (9 * Math.PI) / 180;

  /**
   * The anterior quarters' conic shoulder at the submental floor's station
   * (between the throat's corner and the menton): low, so the floor's plan
   * narrows toward the chin and the floor rises into the mandible's borders
   * on each side (a broad, shallow U across, as hers), where the exact
   * quarter ellipse (0.414) left it flat across.
   */
  export const SUBMENTAL_SHOULDER: number = 0.3;

  /** Her neck line's lean forward of the vertical at the cervical point, radians (22.46 degrees). */
  export const THROAT_LEAN: number = (22.46 * Math.PI) / 180;

  /**
   * The submental skin from her cervical point C to her menton, authored
   * knots `[x, y]` in the head frame's midsagittal plane, placed against her
   * submental line: C, the sag's lowest place, the menton (receipt as above:
   * readings.cervical, readings.envelope, landmarks.me). The submental lift
   * raises the mass's submental tangent onto it.
   */
  export const SUBMENTAL: [number, number][] = [
    // Reverse-extracted as `NOSE` (same run), corrected by eye: the extraction zig-zags about 1 mm along the floor (38.5 -96.8, 45 -98.8, 49.2 -97.5, 60.6 -100.2: saw-toothed slices across the sloping floor), so the knots are read on the fair line through that zig-zag at 45 and 55; the lowest place (62.7 -101.7, 66.6 -101.5) at 63; C as `THROAT`'s last; the menton her landmark (72.54, -101.02).
    [35.4, -97.8],
    [45, -98.2],
    [55, -99],
    [63, -101.6],
    [72.5, -101],
  ];

  /**
   * Her sections' quarter shoulders, `[station, anterior, posterior]`: the station is the course's
   * (height above her tragia's level in her upright frame, mm, `AutoMovieHumanHeadF1Pose`), the
   * values the conic shoulder `rho = |MS| / |MC|` of the head stream's own quarter box (from the
   * course origin, the anterior or posterior outline's offset and the lateral half breadth as built,
   * M the chord's midpoint, C the box corner, S her section on the ray from M to C; 0.414 is the exact
   * quarter ellipse). Read by `NodeHeadQuarters` (run `.shots/f1_head3/quarters-2026-11-08T08-27-19-413Z`)
   * on her mesh cut exactly at each station (`AutoMovieMeshExtract.outline`) over all her cut's chains
   * (her slices are open at the mouth, nostrils and orbits), the two sides averaged; her two sides
   * agree within 0.026 at every station. They replace the shoulder law's tape solves (the menton and
   * subnasale knots held the exact ellipse, 0.414, against her 0.01 to 0.14 at the chin and 0.51 to
   * 0.56 over the cheeks; the posterior one value at the glabella against her 0.23 at the nape).
   * Her -90 reading (anterior 0.014), 4 mm above her submental floor, is legitimate: there her
   * section's front quarter runs from the chin tip along the mandible's arms nearly as a straight
   * chord, the conic's rho -> 0 limit. The table is consumed by a chain bounded by construction
   * (`AutoMovieHumanHeadMassCurves.fullnessBounded`); the fair chain through it undershot below zero
   * (-0.013 at -92.6) and the loft refused head.mass (render `.shots/f1_head/head-2026-11-08T08-40-16-785Z`).
   */
  export const QUARTERS: [number, number, number][] = [
    [-100, 0.141, 0.412],
    [-90, 0.014, 0.363],
    [-80, 0.409, 0.314],
    [-70, 0.485, 0.273],
    [-60, 0.518, 0.249],
    [-50, 0.513, 0.233],
    [-40, 0.513, 0.243],
    [-30, 0.533, 0.274],
    [-20, 0.553, 0.322],
    [-10, 0.564, 0.37],
    [0, 0.555, 0.403],
    [10, 0.508, 0.427],
    [20, 0.473, 0.437],
    [30, 0.529, 0.437],
    [40, 0.512, 0.434],
    [50, 0.435, 0.437],
    [60, 0.394, 0.439],
    [70, 0.38, 0.438],
    [80, 0.378, 0.449],
    [90, 0.385, 0.458],
    [100, 0.39, 0.469],
    [110, 0.387, 0.481],
    [120, 0.403, 0.529],
  ];

  /**
   * The lateral outline (front-view half breadth) from the neck to the vertex; the auricles stand
   * outside it. Reverse-extracted (`NodeHeadExtract`, run as `NOSE`: her largest half breadth on each
   * side of an exact level cut every 1 mm of upright height, the auricles' box left out, both sides
   * averaged, median of five, Douglas-Peucker within 0.5 mm), corrected by eye:
   * - 33.2 (75.9) and 35.2 (77.7) dropped: a 1.8 mm step in 2 mm of height at the auricles' box's
   *   upper edge (35), where the reading changes from the cranium alone to the helix's top;
   * - -2 (72.7) and 6 (73.7) dropped: within 6 mm of the tragion datum (`t`, half t-t), which owns
   *   the outline's value there;
   * - -66.3 (54.8) dropped: 1.4 mm of station below the gonion datum (`go`, -64.6 at half go-go
   *   56.85 with the ramus chord's slope), 2 mm off its value; the two drew a ledge round the whole
   *   head at the gonion's height (render `.shots/f1_head/head-2026-11-08T08-09-03-662Z`,
   *   head.back-right-low.4 and head.world.clay.side).
   */
  export const LATERAL: IKnot[] = [
    // Her neck's straight run, read on her silhouette (the same run's raw readings, extract.json raw.lateral, both sides' mean at upright -100, -85 and -75, at head heights upright / 0.99536, the posed reading's rise): the reduction dropped them as within 0.5 mm of the chord, and without them the fair chain pinched 0.9 to 1.0 mm inside her at -90 to -85 and stood 1.5 mm outside her at -100 (`NodeHeadQuarters --check`, 17:51).
    { site: "neck (-100.5)", y: -100.47, at: 53.66, sense: null },
    { site: "neck (-95.4)", y: -95.4, at: 53.5, sense: null },
    { site: "neck (-85.4)", y: -85.4, at: 53.63, sense: null },
    { site: "neck (-75.4)", y: -75.35, at: 54.21, sense: null },
    { site: "jaw (-56.3)", y: -56.3, at: 59.8, sense: null },
    { site: "cheek (-46.2)", y: -46.2, at: 63.3, sense: null },
    { site: "cheek (-15.1)", y: -15.1, at: 69.3, sense: null },
    { site: "temple (20.1)", y: 20.1, at: 74, sense: null },
    { site: "euryon", y: 52.2, at: 78.9, sense: "max" },
    { site: "parietal (66.3)", y: 66.3, at: 77.4, sense: null },
    { site: "parietal (74.3)", y: 74.3, at: 75, sense: null },
    { site: "parietal (86.4)", y: 86.4, at: 69.6, sense: null },
    { site: "crown (103.5)", y: 103.5, at: 58.9, sense: null },
    { site: "crown (110.5)", y: 110.5, at: 52.3, sense: null },
    { site: "crown (116.5)", y: 116.5, at: 44.6, sense: null },
  ];
}
