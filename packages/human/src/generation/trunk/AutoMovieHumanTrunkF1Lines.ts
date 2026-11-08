/**
 * f1's trunk (S00) as authored coordinates, the f1-only mission (owner,
 * 2026-11-08): the sparse view-curve controls of S00 written directly in its
 * part frames, judged against f1's reference until they match it, before any
 * generalisation. They replace, for S00's construction, the parameter laws
 * that produced the same controls (ANSUR depths and breadths at their sites,
 * the circular-arc back line, the neck-base plan, survey stature fractions),
 * which stay in their modules, commented in their readers, for the later
 * algorithmisation.
 *
 * Frames (`AutoMovieHumanTrunkSegmentFrames`, world +X anterior, +Y up, +Z the
 * subject's right):
 * - pelvis: origin at the hip-centre midpoint (x from it, y from its height);
 * - thorax: origin at IJ (x from IJ's X, y from IJ's height), axes parallel to
 *   the pelvis's; IJ itself is authored in the pelvis frame ({@link IJ}).
 *
 * Every control is a knot of the S00 outlines (value, and a slope where the
 * outline has an extremum or a known lean): x is the outline's forward place
 * (anterior, posterior) or its half breadth (lateral); slopes are dx/dy.
 * The comparison targets they were authored against are the exact plane cuts
 * of f1's reference registered into the same frames (`node:trunk-specs`
 * manifest trunk-2026-11-08T01-02-47-092Z `comparison` and
 * `referenceMidline`; `node:trunk-measure` receipts under
 * `.shots/f1_trunk/measure-*`); the knots are placed at the anatomical sites
 * named in each, not sampled along the surface.
 */
export namespace AutoMovieHumanTrunkF1Lines {
  /** One authored knot in its part frame. */
  export interface IKnot {
    /** The anatomical site. */
    site: string;

    /** Height in the part frame, mm. */
    y: number;

    /** Forward place (anterior, posterior) or half breadth (lateral) in the part frame, mm. */
    x: number;

    /** dx/dy where fixed (an extremum's zero or a known lean); absent where the fair solve chooses. */
    slope?: number;
  }

  /** One part's outline knots. */
  export interface IPart {
    /** Front midline. */
    anterior: IKnot[];

    /** Back midline. */
    posterior: IKnot[];

    /** Lateral half breadth (front view). */
    lateral: IKnot[];
  }

  /**
   * IJ, the thorax origin, in the pelvis frame: the deepest point of f1's
   * jugular notch (`node:trunk-measure`, its height is f1's
   * `suprasternaleHeight` input, 1416.0 above the floor, 527.0 above the hip
   * centres at 889.0), placed forward on the registered notch's X.
   */
  export const IJ: [number, number] = [16.5, 527.0];

  /**
   * The pelvis part, from the open crotch end (S00's bottom) to the natural
   * waist, pelvis frame. Sites: the crotch (the bottom ring: front notch,
   * back at the cleft's end, the thighs side by side); the mons over the
   * pubic symphysis; the buttock level (f1's maximum posterior protrusion,
   * 886); the cleft's floor's most posterior point; the lower abdomen's most
   * anterior point (below the navel); the navel's upper rim; the PSIS
   * dimples' level; the lordosis apex; the natural waist (f1's least girth,
   * 1100).
   */
  export const PELVIS: IPart = {
    // Her exact horizontal cuts (`.shots/f1_modeler/TrunkExtract.ts`, receipt `trunk-extract.txt`, 2026-11-08 18:23):
    // the trunk loop's midline front, its posterior extreme and its half breadth from 876 up, reduced within
    // 0.5 mm, y less the hip centres' 889. The crotch knots stay: the turned floor band (BAND) holds the bottom.
    anterior: [
      { site: "crotch (the thigh roots' front)", y: -84.1, x: 78.0, slope: 0 },
      { site: "her cut, 876", y: -13.0, x: 99.3, slope: 0.286 },
      { site: "her cut, 964", y: 75.0, x: 116.1, slope: 0.169 },
      { site: "her cut, 1004 (lower abdomen's most anterior point)", y: 115.0, x: 120.8, slope: 0 },
      // Hatching correction: her knots at 1042, 1050 and 1052 (106.2, 100.9, 101.0) follow the umbilical pit; dropped, the navel bridged.
      { site: "her cut, 1098", y: 209.0, x: 99.2, slope: -0.03 },
      { site: "natural waist (her run between 1098 and 1182)", y: 211.0, x: 99.1, slope: -0.05 },
    ],
    posterior: [
      { site: "crotch (the thigh roots' back)", y: -84.1, x: -112.0 },
      { site: "her cut, 876 (buttocks)", y: -13.0, x: -132.6, slope: -0.058 },
      { site: "her cut, 972", y: 83.0, x: -105.8, slope: 0.574 },
      { site: "her cut, 1068 (lordosis apex)", y: 179.0, x: -73.2, slope: 0 },
    ],
    lateral: [
      { site: "crotch (thighs side by side)", y: -84.1, x: 191.0 },
      { site: "her cut, 876", y: -13.0, x: 182.2, slope: -0.228 },
      { site: "her cut, 1008", y: 119.0, x: 152.8, slope: -0.397 },
      { site: "her cut, 1056", y: 167.0, x: 135.4, slope: -0.378 },
      { site: "natural waist (her run between 1056 and her least breadth 120.2 at 1110)", y: 211.0, x: 120.4, slope: -0.05 },
    ],
  };

  /**
   * The thorax part, from the natural waist to the neck-base end, thorax
   * frame (origin IJ). Sites: the xiphoid level; the sternum between the
   * breasts at the bust level (f1's bust point, 1254); the sternal angle;
   * the manubrium; IJ (the notch's deepest point: slope zero); the
   * thoracolumbar inflection; the kyphosis apex; the upper back; C7 at the
   * end; the trunk's side at the bust and under the arm.
   */
  export const THORAX: IPart = {
    // Her exact horizontal cuts (`trunk-extract.txt`, 2026-11-08 18:23), y less IJ's 1416, x less IJ's 16.5
    // (half breadths as read): the midline front, the loop's posterior extreme, the half breadth.
    anterior: [
      { site: "her cut, 1182", y: -234.0, x: 79.1, slope: -0.15 },
      { site: "her cut, 1244", y: -172.0, x: 68.1, slope: -0.125 },
      { site: "her cut, 1392", y: -24.0, x: 11.5, slope: -0.83 },
      { site: "IJ (her cut 1416: 16.4, on IJ's 16.5)", y: 0, x: 0, slope: 0 },
    ],
    posterior: [
      { site: "her cut, 1146", y: -270.0, x: -105.6, slope: -0.248 },
      { site: "her cut, 1172", y: -244.0, x: -112.7, slope: -0.186 },
      { site: "her cut, 1308 (kyphosis apex)", y: -108.0, x: -134.2, slope: 0 },
      { site: "her cut, 1362", y: -54.0, x: -130.1, slope: 0.115 },
      { site: "her cut, 1420 (toward C7)", y: 4.0, x: -110.3, slope: 0.707 },
    ],
    lateral: [
      { site: "her run between 1110 and 1172", y: -266.0, x: 124.6 },
      { site: "her cut, 1172", y: -244.0, x: 129.1, slope: 0.221 },
      { site: "her cut, 1200", y: -216.0, x: 136.1, slope: 0.183 },
      // Hatching correction: from 1276 her arm enters the cut (149.5 to 247.0); the line ends at 1274, the axilla.
      { site: "her cut, 1274 (below the axilla)", y: -142.0, x: 149.4, slope: 0.098 },
    ],
  };

  /** Girth and landmark levels: the pelvis ones in the pelvis frame, the thorax ones in the thorax frame. */
  export const LEVELS = {
    /** f1's natural waist: the least trunk girth (673.67 against her 673.63 input), 1100 above the floor. */
    waist: 211.0,
    /** f1's buttock level: the maximum posterior protrusion (girth 990.3 against her 991.4), 886. */
    buttock: -3.0,
    /** f1's navel centre (the umbilical pit's deepest point, 7.9 mm behind the loop's front), 1048. */
    omphalion: 159.0,
    /** f1's lumbosacral inflection ILS (steepest backward lean below the lordosis apex, 26.5 degrees), 992: the back line's lower end for its DIERS reading. */
    dimples: 103.0,
    /** f1's bust point level (the trunk loop's most anterior point), 1254, thorax frame. */
    bust: -162.0,
    /** f1's inframammary fold, thorax frame: where her trunk loop's taut girth equals her ISO 8559-1 under bust girth (760.48, taken at the fold), about 1202. */
    fold: -214.0,
  } as const;

  /**
   * The neck base, thorax frame: C7 at the end (f1's back midline at the
   * cervicale height 1458.2, 42.2 above IJ, 93.7 behind it, leaning back
   * 0.355 per mm of height there) and the side neck points' half breadth,
   * 50 (f1_head's reading of 57.5 drew a neck base broader than f1's clay,
   * pair.front 2026-11-08 15:05).
   */
  export const NECK = { c7: [-93.3, 42.2] as [number, number], c7Slope: 0.355, half: 57.5 } as const;

  /**
   * The shoulder line in the front view, thorax frame, from the side neck
   * point out to the trapezius' lateral part (f1's front-view top line: 1446
   * at 70 mm, 1425 at 105 mm from the midline, 31 degrees down from the side
   * neck point), as half breadths at heights; the acromion stays the frames'
   * landmark. Listed bottom to top: every outline's knots increase in height.
   */
  export const SHOULDER: IKnot[] = [
    { site: "over the acromion (f1's top line, 130 at 1411)", y: -5.0, x: 130.0 },
    { site: "trapezius, lateral", y: 9.0, x: 105.0 },
    { site: "trapezius, upper", y: 30.0, x: 70.0 },
  ];

  /**
   * The spinal groove, thorax frame: f1's paraspinal muscles stand 10 to 14
   * mm behind her spinous line from 1065 to 1390 (her registered loops'
   * posterior extremes against her midline), so the back wall stands at that
   * extreme and a hollow 11 mm deep at 1120, reaching 1390 above and 1040
   * below, 50 mm of arc to each side (a 30 mm hollow read as a slot,
   * 2026-11-08 14:00; centred at 1160 its lower half tapered faster than
   * f1's lumbar paraspinals, 6 to 8 mm short at 1090 to 1165), carves the
   * midline back (`AutoMovieHumanTrunkViewMounds`'s `groove`).
   */
  export const GROOVE = { station: -296.0, up: 270.0, down: 80.0, half: 50.0, depth: 11.0 } as const;

  /**
   * Bone reliefs, thorax frame (apex height, distance from the midline,
   * footprint half extents, projection), authored for f1:
   * - the scapulae: the infraspinous body's prominence, apex at 1350 (about
   *   T4), 80 mm from the midline (the medial border 5 to 8 cm from the
   *   spinous line), from about 1405 (the spine of the scapula) down to the
   *   inferior angle near 1250; 9 mm (f1's back extremes stand 10 to 14 mm
   *   behind the paraspinal line at 1290 to 1390, part of it the posterior
   *   axillary fold);
   * - the clavicles: the shaft's ridge on the upper chest, apex at 1408 just
   *   below IJ, 85 mm from the midline, from the sternoclavicular joint (about
   *   30 mm out) to near the acromion (about 160 mm out), 7 mm high over 18
   *   mm of height (4 mm over 24 did not read in the clay, 2026-11-08 14:11).
   */
  export const BONES: { name: string; side: "front" | "back"; station: number; z: number; up: number; down: number; medial: number; lateral: number; projection: number }[] = [
    { name: "scapula", side: "back", station: -66.0, z: 80.0, up: 55.0, down: 100.0, medial: 45.0, lateral: 65.0, projection: 9.0 },
    { name: "clavicle", side: "front", station: -12.0, z: 85.0, up: 6.0, down: 10.0, medial: 55.0, lateral: 75.0, projection: 7.0 },
  ];

  /**
   * The breasts' footprint half extents from the apex, authored against f1's
   * clay side by side (2026-11-08 14:59, pair.front-left-high and pair.left):
   * her breast rises from about 80 mm above the bust point (the upper chest
   * under the clavicles), spans from near the sternal edge to the anterior
   * axillary line, 60 mm medial and 80 mm lateral of the apex; the published
   * 110 mm base left a small cone on a fuller wall.
   */
  // Read from f1's bust sections (receipt measure-2026-11-08T06-46-40-529Z): the paramedian profile through
  // the apex column rises from the fold (63.7 at 1205) to 93.6 at 1260 in a full rounded lower pole (75.3 at
  // 1220, 89.7 at 1240: the fuller lower exponent 4) and falls gently above (78.4 at 1300, 59.8 at 1330:
  // 75 mm up); across, the breast reaches the midline (the cleavage) and about 60 mm lateral of the apex.
  export const BREAST = { up: 70.0, medial: 58.0, lateral: 62.0, lower: 4.0 } as const;

  /**
   * The trunk's side at the acromion height, half breadth: f1's front-view
   * top line stands 170 mm out at 1396 and rounds over into the deltoid; the
   * biacromial half breadth (186, a bony breadth) held as the skin's maximum
   * there made the shoulders high and square (pair.front, 2026-11-08 15:05).
   */
  export const ACROMION_HALF: number = 170.0;

  /**
   * Wall fullness knots between the girth sites, pelvis frame (the conic
   * shoulder share; the ellipse is 0.414): at 845, between the buttock level
   * and the crotch, the sides were boxy against f1's rounder thigh-root
   * section (pair.front-left-low).
   */
  export const FULLNESS: { site: string; y: number; value: number }[] = [{ site: "below the buttock level", y: -44.0, value: 0.44 }];

  /** The buttocks' medial footprint stops 15 mm of arc short of the back midline: f1's cleft floor (-114 at 930) stands 19 mm ahead of her buttock apices, and reliefs reaching the midline filled it (the posterior crotch path ran 51 mm longer than hers). */
  export const BUTTOCK_GAP: number = 15.0;

  /**
   * The lower intergluteal cleft, pelvis frame: f1's back midline sweeps
   * forward from the cleft floor (-108.5 at 880) to the perineum (-87 at
   * 840, -50 at 810) between the buttocks, while S00's bottom ring keeps the
   * thigh roots' back (-112) for the legs' half loops; without this hollow
   * the midline ran level along the ring and up the buttocks' surface, an L
   * 66 mm longer than f1's crotch tape behind (her posterior crotch length
   * 303.8 against S00's 370). Deepest at the open bottom (58: from -112 to
   * f1's -54 there), fading to nothing 80 mm up (about 885), 22 mm of arc to
   * each side. Not applied (2026-11-08 14:28): it notched the back ends of the
   * half loops the thighs start from, and the joint comes first.
   */
  export const CLEFT = { station: -84.1, up: 80.0, down: 4.0, half: 22.0, depth: 58.0 } as const;

  /**
   * Girths at extra levels, pelvis frame: f1's taut-tape girth of her
   * registered trunk loop at 940 (934.8), so the fullness between her hip and
   * top-hip tapes follows her instead of the fair interpolation (it stood 19
   * mm fuller there).
   */
  export const TAPES: { site: string; y: number; girth: number }[] = [{ site: "iliac", y: 51.0, girth: 934.8 }];

  /**
   * f1's back line by the DIERS definitions (`node:trunk-measure` run 4 on
   * her exact mid-sagittal cut): the kyphosis angle between the tangents at
   * ICT (1451) and ITL (1179), 39.3 degrees, and the lordosis angle between
   * ITL and ILS (992), 42.8; the targets S00's back-line reading is checked
   * against.
   */
  export const POSTURE = { kyphotic: 39.3, lordotic: 42.8 } as const;

  /** f1's breast apex (the bust point), thorax frame: forward place (the registered loop's most anterior point at the bust level, 1254: 101.4 against IJ's 16.5). */
  export const APEX: number = 84.9;

  /**
   * Step 1 of the owner's method (2026-11-08 15:15): every S00 control in
   * absolute world coordinates in the reference's pose (heights above the
   * floor, X forward of the hip-centre vertical, half breadths from the
   * midline), matched against f1's registered reference in the stage-1
   * overlay and the side-by-side clay pairs. Step 2 re-bases them into S00's
   * zero frames (`rebase`).
   *
   * The back quarters' fullness departs from the front quarters' by f1's own
   * split: her trunk loops' quarter shoulder shares about S00's section axis
   * (node:trunk-measure receipt measure-2026-11-08T06-18-49-167Z, quarters:
   * the conic quarter from the midline point to the lateral point, rho =
   * |MS| / |MC|): back less front +0.063 at 940, +0.171 at 993, +0.109 at
   * 1100, +0.230 at 1150, +0.300 at 1202; at the hip the buttocks are reliefs
   * (0), at the chest the breasts are (+0.10 against her back 0.692); the
   * navel level (1048) is left to the fair span (its pit reads in the front).
   */
  export const WORLD = {
    ij: [16.5, 1416.0] as [number, number],
    c7: { x: -77.5, slope: 0.448 },
    // Her top line reaches 60 at 1455 (receipt measure-2026-11-08T07-02-30-880Z, bar.half), 57.5 by
    // f1_head's reading of the side neck points.
    neckHalf: 57.5,
    acromionHalf: 170.0,
    apexX: 101.4,
    // f1's bust section (receipt measure-2026-11-08T06-46-40-529Z, breast.across): her bust level's most
    // anterior point stands 55 to 60 mm from the midline (101.5 at 60), not at half her bust point width
    // (90.5, where she reads 93.4); the breasts meet at the midline (83.3, the cleavage) and end laterally
    // near 118 (58.6 at 120, then the side).
    apexHalf: 58.0,
    // Her apex column at 58 mm (receipt measure-2026-11-08T07-02-30-880Z, breastColumn): the fold at 1205
    // (83.3), the apex at 1255 (101.4); over her chest wall drawn as the Hermite from the fold (83.3, lean
    // -0.15) to 1330 (68.9, lean -0.68), the relief stands 17.8 at the apex, 0.9 / 0.57 / 0.20 of it 10 /
    // 30 / 50 mm above and 0.89 / 0.65 / 0.25 of it 20 / 30 / 40 mm below: the profile family's upper
    // (1 - rho^2)^3 over 70 mm and fuller lower (1 - rho^4)^3 over 50 mm within 0.05 of it.
    breastP: 17.8,
    // Reverse-extracted (node:trunk-measure receipt measure-2026-11-08T06-37-48-867Z, `extract`: f1's
    // loops every 5 mm, the front as the most anterior skin within 12 mm of the midline, reduced to knots
    // within 0.5 mm with their slopes), then corrected by eye over the reference where the extraction
    // followed its artifacts:
    // - the crotch ring (805) is authored, not extracted: below 850 her midline drops into the pubic notch,
    //   which the legs' split owns; the ring's front stands at the thigh roots' front, level (slope 0);
    // - 1025 to 1050 dropped: the umbilical pit; the bridged surface runs 1015 -> 1060;
    // - 1240 to 1290 zig-zag (85.6, 86.3, 84.5, 85.9, 82.9, 83.7, 79.8, 80.9) dropped: saw-toothed slices on
    //   the sternum between the breasts; kept 1235 and 1290 only;
    // - 1340 to 1350 dropped (-99.9 and a +-16 slope): a gap in the hatching at the sternal angle;
    // - IJ pinned at 16.5 with slope 0 (the extraction reads 18.1 at 1415, the window's edge beside the notch).
    anterior: [
      { site: "crotch ring (the thigh roots' front, authored)", y: 805.0, x: 95.0, slope: 0 },
      { site: "pubic rise", y: 870.0, x: 97.5, slope: 0.363 },
      { site: "lower abdomen", y: 895.0, x: 104.2, slope: 0.212 },
      { site: "lower abdomen", y: 930.0, x: 110.7, slope: 0.161 },
      { site: "lower abdomen", y: 980.0, x: 118.7, slope: 0.144 },
      { site: "lower abdomen's most anterior point", y: 1005.0, x: 120.8, slope: 0 },
      { site: "below the navel", y: 1015.0, x: 119.9 },
      { site: "above the navel (bridged)", y: 1060.0, x: 103.6, slope: -0.13 },
      { site: "natural waist", y: 1100.0, x: 99.6, slope: -0.052 },
      { site: "lower ribs", y: 1140.0, x: 99.6, slope: -0.011 },
      { site: "xiphoid level", y: 1175.0, x: 97.9, slope: -0.119 },
      { site: "sternum between the breasts", y: 1235.0, x: 87.2 },
      { site: "sternum above the breasts", y: 1290.0, x: 80.9 },
      { site: "upper sternum", y: 1315.0, x: 71.5, slope: -0.277 },
      { site: "sternal angle", y: 1325.0, x: 68.7, slope: -0.458 },
      { site: "manubrium", y: 1355.0, x: 54.6, slope: -0.523 },
      { site: "manubrium", y: 1375.0, x: 42.0, slope: -0.647 },
      { site: "manubrium's upper end", y: 1390.0, x: 30.8, slope: -0.726 },
      { site: "notch's rim", y: 1400.0, x: 24.1, slope: -0.584 },
      { site: "IJ", y: 1416.0, x: 16.5, slope: 0 },
    ] as IKnot[],
    // The back wall at f1's posterior extreme (paraspinals, scapulae) from 960 up, the cleft floor below
    // (her loops within 12 mm of the midline read the buttocks' inner faces there, -117.7 at 880: corrected
    // to the cleft floor of the earlier midline cut, the buttocks being reliefs); 955 to 960 (-111.1,
    // -112.3) is a sliver and dropped.
    posterior: [
      { site: "crotch ring (the thigh roots' back, authored)", y: 805.0, x: -112.0 },
      { site: "cleft below the sacrum", y: 880.0, x: -108.8 },
      { site: "sacrum's most posterior point (cleft floor)", y: 930.0, x: -114.4, slope: 0 },
      { site: "lumbosacral inflection", y: 995.0, x: -93.6, slope: 0.504 },
      { site: "lumbar", y: 1015.0, x: -84.5, slope: 0.383 },
      { site: "lumbar", y: 1040.0, x: -76.5, slope: 0.244 },
      { site: "lordosis apex (paraspinal extreme)", y: 1065.0, x: -73.3, slope: 0 },
      { site: "thoracolumbar", y: 1105.0, x: -78.6, slope: -0.208 },
      { site: "thoracolumbar", y: 1125.0, x: -83.2, slope: -0.257 },
      { site: "lower thorax", y: 1170.0, x: -95.8, slope: -0.234 },
      { site: "mid thorax", y: 1255.0, x: -113.0, slope: -0.179 },
      { site: "kyphosis apex (scapular extreme)", y: 1310.0, x: -117.7, slope: 0 },
      { site: "upper back", y: 1340.0, x: -116.1, slope: 0.105 },
      { site: "upper back", y: 1370.0, x: -112.5, slope: 0.14 },
      { site: "upper back", y: 1400.0, x: -104.8, slope: 0.453 },
      { site: "cervicothoracic", y: 1430.0, x: -87.9, slope: 0.419 },
    ] as IKnot[],
    lateral: [
      { site: "crotch ring (thighs side by side)", y: 805.0, x: 191.0 },
      { site: "below the buttock level", y: 835.0, x: 189.2, slope: -0.141 },
      { site: "iliac region", y: 955.0, x: 167.8, slope: -0.179 },
      { site: "top hip", y: 995.0, x: 157.6, slope: -0.343 },
      { site: "above the crest", y: 1080.0, x: 126.3, slope: -0.335 },
      { site: "natural waist", y: 1095.0, x: 122.1, slope: -0.217 },
      { site: "least breadth", y: 1115.0, x: 120.4, slope: 0 },
      { site: "lower ribs", y: 1160.0, x: 126.3, slope: 0.192 },
      { site: "underbust", y: 1205.0, x: 137.3, slope: 0.212 },
      { site: "bust level (chest breadth)", y: 1255.0, x: 147.2, slope: 0.174 },
      { site: "below the axilla (the arm still apart)", y: 1265.0, x: 148.4, slope: 0.123 },
    ] as IKnot[],
    // The shoulder bar from the acromion (1395, 170) to the neck base, every 10 mm: her front-view top
    // line's reach at each height (receipt measure-2026-11-08T07-02-30-880Z, bar.half).
    shoulder: [
      { site: "shoulder bar", y: 1405.0, x: 144.0 },
      { site: "shoulder bar", y: 1415.0, x: 123.0 },
      { site: "shoulder bar (trapezius)", y: 1425.0, x: 102.0 },
      { site: "shoulder bar (trapezius)", y: 1435.0, x: 85.0 },
      { site: "shoulder bar (trapezius, upper)", y: 1445.0, x: 70.0 },
    ] as IKnot[],
    levels: { waist: 1100.0, buttock: 886.0, omphalion: 1048.0, dimples: 992.0, bust: 1255.0, fold: 1205.0 },
    // Two hollows on the midline, since the wall now stands at the posterior extreme: the lumbar furrow
    // (f1's paraspinals 6 mm behind her spinous line at 1065) and the furrow between the scapulae (12 mm
    // at 1290 to 1340: her midline -104 against her scapular extreme -117).
    groove: [
      { station: 1075.0, up: 70.0, down: 80.0, half: 45.0, depth: 6.0 },
      { station: 1300.0, up: 110.0, down: 130.0, half: 55.0, depth: 12.0 },
    ],
    // The scapulae are in the extracted back wall now (its extreme is theirs from 1255 up), so no relief.
    // The clavicle relief is withdrawn above 1395 with the neck hollow (the upper-chest crease); the
    // shoulder bar's sections carry the clavicles' line.
    bones: [] as { name: string; side: "front" | "back"; station: number; z: number; up: number; down: number; medial: number; lateral: number; projection: number }[],
    tapes: [{ site: "iliac", y: 940.0, girth: 934.8 }],
    fullness: [
      { site: "below the buttock level", y: 845.0, value: 0.44 },
      // The shoulder bar's front quarters every 10 mm: her loops cut at the top line's reach (the arm side)
      // and, above IJ, at the neck cylinder (receipt measure-2026-11-08T07-02-30-880Z, bar.rhoFront); the
      // back quarters' excess in backQuarters.
      { site: "shoulder bar at the acromion", y: 1395.0, value: 0.165 },
      { site: "shoulder bar", y: 1405.0, value: 0.191 },
      { site: "shoulder bar", y: 1415.0, value: 0.14 },
      { site: "shoulder bar (trapezius)", y: 1425.0, value: 0.175 },
      { site: "shoulder bar (trapezius)", y: 1435.0, value: 0.234 },
      { site: "shoulder bar (neck base)", y: 1445.0, value: 0.341 },
    ],
    // Extracted against these outlines (the back at the posterior extreme): back less front 0.1 at 960,
    // 0.2 at 985 to 1005, 0 at 1050 to 1090, 0.2 at 1195; the hip (buttock reliefs) 0, the chest (breast
    // reliefs) 0.1.
    backQuarters: [
      { site: "hip (buttocks are reliefs)", y: 886.0, value: 0 },
      { site: "iliac", y: 960.0, value: 0.1 },
      { site: "top hip", y: 995.0, value: 0.2 },
      { site: "navel level", y: 1050.0, value: 0 },
      { site: "natural waist", y: 1090.0, value: 0 },
      { site: "xiphoid level", y: 1195.0, value: 0.2 },
      { site: "chest (breasts are reliefs)", y: 1254.0, value: 0.1 },
      { site: "shoulder bar at the acromion (0.376 - 0.165)", y: 1395.0, value: 0.211 },
      { site: "shoulder bar (0.475 - 0.191)", y: 1405.0, value: 0.284 },
      { site: "shoulder bar (0.55 - 0.14)", y: 1415.0, value: 0.41 },
      { site: "trapezius (0.604 - 0.175)", y: 1425.0, value: 0.429 },
      { site: "trapezius (0.577 - 0.234)", y: 1435.0, value: 0.343 },
      { site: "neck base (0.502 - 0.341)", y: 1445.0, value: 0.161 },
    ],
  };

  /** A segment frame's world transform (origin and axes), as `AutoMovieHumanTrunkSegmentFrames.world` returns it. */
  export interface ITransform {
    /** World origin. */
    origin: readonly [number, number, number];

    /** World axes, rows X, Y, Z. */
    axes: readonly (readonly [number, number, number])[];
  }

  /** A part frame's name: the pelvis carries every control at or below the natural waist, the thorax the rest. */
  export type Frame = "pelvis" | "thorax";

  /** A knot in its part frame. */
  export interface IPartKnot extends IKnot {
    /** Its part frame. */
    frame: Frame;
  }

  /** A height in its part frame. */
  export interface IPartLevel {
    /** Its part frame. */
    frame: Frame;

    /** Height in that frame, mm. */
    y: number;
  }

  /** {@link WORLD}'s positional controls in S00's zero frames; the rest of WORLD (breadths, extents, values) is frame-free. */
  export interface IRebased {
    /** IJ, the thorax origin, in the pelvis frame. */
    ij: [number, number];

    /** C7 at the end (its forward place and lean), thorax frame. */
    c7: IPartKnot;

    /** The breast apex's forward place at the bust level, thorax frame. */
    apex: IPartKnot;

    /** Front midline knots. */
    anterior: IPartKnot[];

    /** Back midline knots. */
    posterior: IPartKnot[];

    /** Lateral half-breadth knots. */
    lateral: IPartKnot[];

    /** Shoulder line knots, thorax frame. */
    shoulder: IPartKnot[];

    /** Girth and landmark levels. */
    levels: Record<keyof (typeof WORLD)["levels"], IPartLevel>;

    /** The spinal grooves' stations, in WORLD.groove's order. */
    groove: IPartLevel[];

    /** The bone reliefs' stations, in WORLD.bones' order. */
    bones: IPartLevel[];

    /** The extra tapes' heights, in WORLD.tapes' order. */
    tapes: IPartLevel[];

    /** The fullness knots' heights, in WORLD.fullness' order. */
    fullness: IPartLevel[];

    /** The back quarters' departure heights, in WORLD.backQuarters' order. */
    backQuarters: IPartLevel[];
  }

  /** The part frame a world height belongs to. */
  export function frameOf(y: number): Frame {
    return y <= WORLD.levels.waist ? "pelvis" : "thorax";
  }

  /**
   * Step 2: the re-base. Every positional control of {@link WORLD} into its
   * part frame by the frame's inverse rigid transform, `p = A (w - o)` with
   * A's rows the frame's axes; a lateral knot keeps its half breadth (a
   * distance along Z) and takes only its height. Slopes dx/dy carry over
   * while the frames keep the world's axes (they do: pelvic tilt and thoracic
   * inclination are input gaps), else they would turn with the axes. IJ, the
   * thorax origin, is re-based into the pelvis frame. Re-run it whenever a
   * WORLD control or a frame moves; S00 reads it at every build ({@link resolve}), so nothing is transcribed.
   */
  export function rebase(pelvis: ITransform, thorax: ITransform): IRebased {
    const of = (f: Frame): ITransform => (f === "pelvis" ? pelvis : thorax);
    const part = (t: ITransform, x: number, y: number): [number, number] => {
      const d: [number, number, number] = [x - t.origin[0], y - t.origin[1], -t.origin[2]];
      const row = (k: number): number => t.axes[k]![0] * d[0] + t.axes[k]![1] * d[1] + t.axes[k]![2] * d[2];
      return [row(0), row(1)];
    };
    const midline = (k: IKnot, f: Frame = frameOf(k.y)): IPartKnot => {
      const [x, y] = part(of(f), k.x, k.y);
      return { ...k, frame: f, x, y };
    };
    const side = (k: IKnot): IPartKnot => {
      const f: Frame = frameOf(k.y);
      return { ...k, frame: f, y: part(of(f), 0, k.y)[1] };
    };
    const level = (y: number, f: Frame = frameOf(y)): IPartLevel => ({ frame: f, y: part(of(f), 0, y)[1] });
    const L = WORLD.levels;
    return {
      ij: part(pelvis, WORLD.ij[0], WORLD.ij[1]),
      c7: midline({ site: "C7 (the end)", y: thorax.origin[1], x: WORLD.c7.x, slope: WORLD.c7.slope }, "thorax"),
      apex: midline({ site: "bust point", y: L.bust, x: WORLD.apexX }, "thorax"),
      anterior: WORLD.anterior.map((k: IKnot): IPartKnot => midline(k)),
      posterior: WORLD.posterior.map((k: IKnot): IPartKnot => midline(k)),
      lateral: WORLD.lateral.map(side),
      shoulder: WORLD.shoulder.map((k: IKnot): IPartKnot => ({ ...side(k), frame: "thorax", y: part(thorax, 0, k.y)[1] })),
      levels: { waist: level(L.waist), buttock: level(L.buttock), omphalion: level(L.omphalion), dimples: level(L.dimples), bust: level(L.bust), fold: level(L.fold) },
      groove: WORLD.groove.map((g: { station: number }): IPartLevel => level(g.station)),
      bones: WORLD.bones.map((b: { station: number }): IPartLevel => level(b.station)),
      tapes: WORLD.tapes.map((t: { y: number }): IPartLevel => level(t.y)),
      fullness: WORLD.fullness.map((t: { y: number }): IPartLevel => level(t.y)),
      backQuarters: WORLD.backQuarters.map((t: { y: number }): IPartLevel => level(t.y)),
    };
  }

  /**
   * The world controls S00's view curves read (`AutoMovieHumanTrunkViewCurves`):
   * {@link rebase}'s output lifted back through the frames' rigid transforms, `w = o + A^T p`,
   * with WORLD's frame-free breadths, extents and values. For f1's frames it
   * reproduces {@link WORLD} (step 2's equivalence); a moved frame carries its
   * controls with it.
   */
  export function resolve(pelvis: ITransform, thorax: ITransform): typeof WORLD {
    // Step 2: S00 reads its zero-frame controls (rebase's output) lifted through the frames.
    return resolvePart(pelvis, thorax);
  }

  /** Step 2's reading: {@link rebase}'s output lifted through the frames (see {@link resolve}). */
  export function resolvePart(pelvis: ITransform, thorax: ITransform): typeof WORLD {
    const of = (f: Frame): ITransform => (f === "pelvis" ? pelvis : thorax);
    const world = (t: ITransform, x: number, y: number): [number, number] => [t.origin[0] + x * t.axes[0]![0] + y * t.axes[1]![0], t.origin[1] + x * t.axes[0]![1] + y * t.axes[1]![1]];
    const midline = (k: IPartKnot): IKnot => {
      const [x, y] = world(of(k.frame), k.x, k.y);
      return { site: k.site, y, x, ...(k.slope === undefined ? {} : { slope: k.slope }) };
    };
    const side = (k: IPartKnot): IKnot => ({ site: k.site, y: world(of(k.frame), 0, k.y)[1], x: k.x, ...(k.slope === undefined ? {} : { slope: k.slope }) });
    const height = (l: IPartLevel): number => world(of(l.frame), 0, l.y)[1];
    // The zero-frame controls are computed, never transcribed: rebase's output for these frames.
    const P: IRebased = rebase(pelvis, thorax);
    const ij: [number, number] = world(pelvis, P.ij[0], P.ij[1]);
    return {
      ...WORLD,
      ij,
      c7: { x: midline(P.c7).x, slope: P.c7.slope ?? 0 },
      apexX: midline(P.apex).x,
      anterior: P.anterior.map(midline),
      posterior: P.posterior.map(midline),
      lateral: P.lateral.map(side),
      shoulder: P.shoulder.map(side),
      levels: { waist: height(P.levels.waist), buttock: height(P.levels.buttock), omphalion: height(P.levels.omphalion), dimples: height(P.levels.dimples), bust: height(P.levels.bust), fold: height(P.levels.fold) },
      groove: WORLD.groove.map((g: (typeof WORLD)["groove"][number], i: number): (typeof WORLD)["groove"][number] => ({ ...g, station: height(P.groove[i]!) })),
      bones: WORLD.bones.map((b: (typeof WORLD)["bones"][number], i: number): (typeof WORLD)["bones"][number] => ({ ...b, station: height(P.bones[i]!) })),
      tapes: WORLD.tapes.map((t: (typeof WORLD)["tapes"][number], i: number): (typeof WORLD)["tapes"][number] => ({ ...t, y: height(P.tapes[i]!) })),
      fullness: WORLD.fullness.map((t: (typeof WORLD)["fullness"][number], i: number): (typeof WORLD)["fullness"][number] => ({ ...t, y: height(P.fullness[i]!) })),
      backQuarters: WORLD.backQuarters.map((t: (typeof WORLD)["backQuarters"][number], i: number): (typeof WORLD)["backQuarters"][number] => ({ ...t, y: height(P.backQuarters[i]!) })),
    };
  }
}
