import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { estimateAutoMovieHumanArmTissue } from "./estimateAutoMovieHumanArmTissue";

/**
 * Levels of the arm's edge loops in its own coordinate: minus the fraction of the cut-to-elbow length above the elbow joint centre, plus the fraction of the elbow-to-wrist-cut length below it. The upper arm takes the biceps peak, the narrowing above the elbow and the epicondyles; the joint level carries the olecranon; the forearm takes the swell of its upper muscular half, its maximum girth, the end of the bellies, the flattened tendinous half and the wrist. Loops gather at the elbow, 15, 0 and 10 percent, so the cage has edges to fold on when it flexes ("denser in areas that deform more", Blender Manual, "Mesh Structure"). Grade: conventional placement of measured landmarks.
 */
const LEVELS: number[] = [-1, -0.62, -0.3, -0.15, 0, 0.08, 0.22, 0.42, 0.64, 0.83, 1];

/** Level of the maximum forearm girth, where the identity's forearm circumference is matched. Grade: conventional, a fifth of the way down, in the upper muscular half. */
const FOREARM_PEAK: number = 0.22;

/**
 * Cross-section proportions along the arm, as breadth over depth of the deep section before its muscles, bones and fat are added, and the superellipse exponent of the section (2 an ellipse, larger a squarer, flattened section, as the tendinous lower forearm and the wrist are; Gray 1918, "Surface Anatomy of the Upper Extremity").
 *
 * The breadths are fitted offline to the MakeHuman 1.x base mesh with its CC0 macro targets (the twelve arms of `GIRTH_PROFILE`, elbows straightened), minimising the squared relative difference of the median frontal breadth over girth at each level across the ten converter presets this package's viewer is judged on (women and men at average, thin, heavy and muscular build, a 7-year-old boy and an 80-year-old woman). Away from the elbow the breadth follows two straight lines, the upper arm's from 0.89 at the cut to 0.65 at the elbow and the forearm's from 0.55 at the elbow to 1.35 at the wrist; the three elbow loops are fitted to the reference's frontal breadth relative to the upper forearm (0.95, 0.97 and 0.99), which the straightening preserves because the reference's elbows bend forward, across that breadth. Residuals are under 2 percent at every level but two fifths of the way down the forearm, 7 percent broader there, where the forearm masses this generator adds stand out of the reference's smoother cone. Grade: population-fitted on a CC0 reference body.
 */
const PROPORTION: Array<[level: number, aspect: number, exponent: number]> = [
  [-1, 0.888, 2],
  [-0.62, 0.798, 2],
  [-0.3, 0.721, 2],
  [-0.15, 0.773, 2],
  [0, 0.898, 2],
  [0.08, 0.937, 2],
  [0.22, 0.726, 2],
  [0.42, 0.886, 2.1],
  [0.64, 1.062, 2.3],
  [0.83, 1.214, 2.5],
  [1, 1.35, 2.6],
];

/**
 * Fat thickness around the section relative to the thickness over the triceps, at the eight section directions anterior, anteromedial, medial, posteromedial, posterior, posterolateral, lateral and anterolateral. On the upper arm the back and inner side carry the most, the biceps the least, the biceps skinfold being about half the triceps skinfold in the skinfold tables of Durnin and Womersley (1974, Br J Nutr 32:77-97) as commonly reproduced; on the forearm fat is nearly even, thinner over the dorsal ulna. Grade: conventional.
 */
const FAT_AROUND: { upper: number[]; fore: number[] } = {
  upper: [0.5, 0.65, 0.9, 1, 1, 0.9, 0.7, 0.55],
  fore: [1, 1, 0.95, 0.8, 0.75, 0.8, 0.9, 1],
};

/**
 * How much of the deep relief fat fills: a layer of this thickness, millimetres, levels half of it. Fat lies thicker in the furrows between muscles than over their bellies, so a fatter arm is rounder at the same girth. Grade: conventional.
 */
const FAT_LEVELLING: number = 10;

/** Share of the local fat layer that lies over a bony prominence; fat thins over the epicondyles and gathers between them. Grade: conventional. */
const EPICONDYLE_FAT: number = 0.5;

/** Thickness of skin over a subcutaneous bone, millimetres; dermis is 1 to 2 mm thick. Grade: conventional. */
const SKIN: number = 1.5;

/**
 * Elbow girth over the forearm's maximum girth. The elbow is as broad as the arm above and the forearm below, across the epicondyles, but shallow: the olecranon lies under thin skin behind and only the brachialis and the biceps tendon cross in front, so its girth dips below the forearm's, most at the joint line and blending out half way up to the upper cut and a fifth down the forearm. The reference body's elbow cannot give this value because its elbows are bent; no measured elbow girth was read. Grade: conventional.
 */
const ELBOW_PER_FOREARM: number = 0.92;

/**
 * Girth along the arm as a weight between its measured girths: above the elbow from the upper arm circumference (0) toward the forearm circumference (1), below it from the forearm circumference (0) toward the wrist circumference (1). The forearm's girth holds from the elbow to a fifth of the way down, where the identity's maximum forearm circumference lies, before `ELBOW_PER_FOREARM` dips the elbow.
 *
 * Weights a third of the way up the arm and from a fifth of the way down the forearm are fitted offline to the MakeHuman 1.x base mesh with its CC0 macro targets (caucasian young female and male at average, minimum and maximum weight and muscle, a male child and an old female; twelve arms, elbows straightened), as the median over those arms of each level's weight between the same three girths measured on the mesh; nearer the elbow the reference's bent elbow folds its sections, so the weight there is interpolated. Spread across the twelve: about 0.1 at the forearm levels; above the elbow the thin and muscular arms depart most, because their upper arm and forearm girths nearly meet. Grade: population-fitted on a CC0 reference body.
 */
const GIRTH_PROFILE: Array<[level: number, weight: number]> = [
  [-1, 0],
  [-0.62, 0.32],
  [-0.3, 0.54],
  [-0.15, 0.75],
  [0, 0],
  [0.08, 0],
  [0.22, 0],
  [0.42, 0.25],
  [0.64, 0.55],
  [0.83, 0.84],
  [1, 1],
];

/**
 * Where bone lies under thin skin, as distances from the limb axis in fractions of the biepicondylar breadth, at one level and section direction (0 anterior, 2 medial, 4 posterior, 6 lateral, odd ones between). A `pin` fixes the surface there, a `floor` keeps the surface outside a bony prominence, a `ceiling` keeps it down on a subcutaneous border, each plus skin and the local fat:
 *
 * - The epicondyles, the medial more prominent (Gray 1918), floor the elbow's breadth.
 * - The olecranon tip pins the back of the elbow; above it the triceps tendon lies flat on the humerus.
 * - The posterior border of the ulna is subcutaneous from the olecranon to the ulnar head (Gray 1918), so the forearm's flexor and extensor masses swell in front of and beside the bones, not behind them.
 *
 * Grade: conventional.
 */
const BONES: Array<[level: number, direction: number, kind: "pin" | "floor" | "ceiling", breadths: number]> = [
  [-0.3, 3, "ceiling", 0.62],
  [-0.3, 4, "ceiling", 0.56],
  [-0.3, 5, "ceiling", 0.62],
  [-0.15, 2, "floor", 0.55],
  [-0.15, 6, "floor", 0.45],
  [-0.15, 3, "ceiling", 0.5],
  [-0.15, 4, "ceiling", 0.38],
  [-0.15, 5, "ceiling", 0.5],
  [0, 2, "floor", 0.55],
  [0, 6, "floor", 0.45],
  [0, 3, "ceiling", 0.42],
  [0, 4, "pin", 0.42],
  [0, 5, "ceiling", 0.46],
  [0.08, 3, "ceiling", 0.38],
  [0.08, 4, "ceiling", 0.3],
  [0.08, 5, "ceiling", 0.5],
  [0.22, 3, "ceiling", 0.36],
  [0.22, 4, "ceiling", 0.33],
  [0.22, 5, "ceiling", 0.56],
  [0.42, 3, "ceiling", 0.34],
  [0.42, 4, "ceiling", 0.36],
  [0.64, 3, "ceiling", 0.32],
  [0.83, 3, "ceiling", 0.31],
];

/**
 * Superficial forms of the arm, each a ridge or furrow along the limb at one direction of the section.
 *
 * `angle` is degrees from the anterior (flexor) surface toward the medial side, in the forearm's frame in supination, which the section twists into the rest pose. `amplitude` is relative to the section's mean deep radius; muscles and furrows scale with muscularity, bones do not. `from`, `peak` and `to` are arm levels as in `LEVELS`. Courses follow Gray (1918) and Bridgman (1920, "Constructive Anatomy"): the brachioradialis wedge rises a third of the way up the arm and peaks above the medial flexor-pronator mass, which starts at the medial epicondyle and peaks lower, so the outer and inner contours never peak at one level; the deltoid insertion and the cubital fossa are hollows between bellies; the lower forearm is tendinous. Amplitudes are conventional, judged in the viewer.
 */
const FORMS: IForm[] = [
  { name: "biceps", kind: "muscle", angle: 10, width: 38, amplitude: 0.1, from: -1.4, peak: -0.5, to: 0.25 },
  { name: "brachialis lateral", kind: "muscle", angle: -60, width: 25, amplitude: 0.05, from: -0.75, peak: -0.2, to: 0.15 },
  { name: "brachialis medial", kind: "muscle", angle: 62, width: 25, amplitude: 0.04, from: -0.7, peak: -0.2, to: 0.1 },
  { name: "triceps long head", kind: "muscle", angle: 150, width: 35, amplitude: 0.08, from: -1.5, peak: -0.9, to: -0.35 },
  { name: "triceps lateral head", kind: "muscle", angle: -140, width: 32, amplitude: 0.07, from: -1.5, peak: -1, to: -0.45 },
  { name: "triceps tendon plane", kind: "muscle", angle: 180, width: 30, amplitude: -0.07, from: -0.6, peak: -0.25, to: -0.02 },
  { name: "deltoid insertion", kind: "muscle", angle: -90, width: 25, amplitude: -0.035, from: -1.3, peak: -1, to: -0.7 },
  { name: "medial bicipital groove", kind: "muscle", angle: 95, width: 20, amplitude: -0.04, from: -1.3, peak: -0.6, to: -0.15 },
  { name: "cubital fossa", kind: "muscle", angle: 0, width: 30, amplitude: -0.02, from: -0.35, peak: 0.02, to: 0.3 },
  { name: "brachioradialis", kind: "muscle", angle: -70, width: 32, amplitude: 0.14, from: -0.9, peak: 0, to: 0.6 },
  { name: "flexor-pronator mass", kind: "muscle", angle: 50, width: 38, amplitude: 0.11, from: -0.25, peak: 0.3, to: 0.8 },
  { name: "extensor mass", kind: "muscle", angle: -125, width: 32, amplitude: 0.07, from: 0, peak: 0.25, to: 0.8 },
  { name: "anconeus", kind: "muscle", angle: -158, width: 20, amplitude: 0.03, from: 0, peak: 0.08, to: 0.2 },
  { name: "ulnar furrow", kind: "muscle", angle: 150, width: 18, amplitude: -0.05, from: 0.05, peak: 0.4, to: 1 },
  { name: "abductor pollicis longus", kind: "muscle", angle: -105, width: 25, amplitude: 0.04, from: 0.55, peak: 0.74, to: 0.92 },
  { name: "medial epicondyle", kind: "bone", angle: 90, width: 18, amplitude: 0.08, from: -0.3, peak: -0.08, to: 0.08 },
  { name: "lateral epicondyle", kind: "bone", angle: -90, width: 18, amplitude: 0.05, from: -0.3, peak: -0.08, to: 0.08 },
  { name: "olecranon", kind: "bone", angle: 180, width: 22, amplitude: 0.05, from: -0.1, peak: 0, to: 0.12 },
  { name: "ulnar head", kind: "bone", angle: 135, width: 22, amplitude: 0.05, from: 0.82, peak: 1, to: 1.2 },
];

/** Forearm twist at the wrist, degrees: the rest pose holds the forearm at neutral rotation, palm toward the thigh, a quarter turn from supination. */
const NEUTRAL_TWIST: number = 90;

/** Number of section directions, the ring count of both arm junctions. */
const COUNT: number = 8;

/**
 * Shape the arm's cross-sections, one per edge loop, from its measurements.
 *
 * Each section is built in four steps:
 *
 * 1. A deep shape of bone and muscle: a superellipse of the level's proportions with every superficial form added at its direction and level, muscles scaled by muscularity.
 * 2. Fat levels part of that relief toward the section's mean, more as the layer thickens.
 * 3. The deep shape is scaled and the fat layer laid over it so the section's girth equals the level's girth (`GIRTH_PROFILE`): the identity's upper arm circumference at the upper cut, its forearm circumference from the elbow to the forearm's maximum, its wrist circumference at the wrist, and between them the weights fitted to a reference body.
 * 4. Bones bound the radii they reach (`BONES`): the olecranon fixes the back of the elbow, the epicondyles keep the elbow at least as broad as the bone, the subcutaneous ulna holds the back of the forearm down, and the styloids fix the breadth of the wrist.
 *
 * Girth is the length of the smooth closed curve through the section's points, the periodic cubic B-spline that interpolates them, which is what the subdivided cage reproduces at that level.
 *
 * @param arm The arm's measurements
 * @param tissue The arm's fat, muscularity and bony breadths
 * @returns Sections from the upper cut to the wrist
 */
export function sectionAutoMovieHumanArm(
  arm: IAutoMovieHumanIdentity.IArm,
  tissue: estimateAutoMovieHumanArmTissue.IOutput,
): sectionAutoMovieHumanArm.ISection[] {
  const fat: (level: number) => number[] = (level: number): number[] =>
    fatAround(level, tissue);
  const mean: (values: number[]) => number = (values: number[]): number =>
    values.reduce((a: number, b: number): number => a + b, 0) / values.length;
  const upper: number = arm.upperArmCircumference;
  const forearm: number = arm.forearmCircumference;
  const wrist: number = arm.wristCircumference;
  const profile: (level: number) => number = (level: number): number =>
    interpolate(
      GIRTH_PROFILE.map(
        ([at, weight]: [number, number]): [number, number] => [
          at,
          (at < 0
            ? upper + weight * (forearm - upper)
            : forearm + weight * (wrist - forearm)) *
            (1 - (1 - ELBOW_PER_FOREARM) * bump(at, -0.5, 0, 0.22)),
        ],
      ),
      level,
    );
  return LEVELS.map((level: number): sectionAutoMovieHumanArm.ISection => {
    const thickness: number[] = fat(level);
    const girth: number = profile(level);
    const shape: number[] = deepShape(level, tissue.muscularity);
    const levelling: number =
      mean(thickness) / (mean(thickness) + FAT_LEVELLING);
    const average: number = mean(shape);
    const soft: number[] = shape.map(
      (s: number): number => (1 - levelling) * s + levelling * average,
    );
    const pinned: Map<number, number> = new Map();
    const floor: Map<number, number> = new Map();
    const ceiling: Map<number, number> = new Map();
    for (const [at, k, kind, breadths] of BONES)
      if (at === level)
        ({ pin: pinned, floor, ceiling })[kind].set(
          k,
          breadths * tissue.elbowBreadth +
            SKIN +
            (kind === "floor" ? EPICONDYLE_FAT : 1) * thickness[k]!,
        );
    if (level === 1) {
      pinned.set(2, tissue.wristBreadth / 2 + SKIN + thickness[2]!);
      pinned.set(6, tissue.wristBreadth / 2 + SKIN + thickness[6]!);
    }
    return {
      level,
      twist: level <= 0 ? 0 : NEUTRAL_TWIST * level * level * (3 - 2 * level),
      radii: fitGirth(soft, thickness, girth, pinned, floor, ceiling),
    };
  });
}
export namespace sectionAutoMovieHumanArm {
  /**
   * One cross-section of the arm, at one edge loop.
   *
   * @author Samchon
   */
  export interface ISection {
    /** Arm level: minus the fraction of the cut-to-elbow length above the elbow, plus the fraction of the elbow-to-wrist length below it. */
    level: number;

    /** Turn of the section's anatomical frame about the limb axis toward the medial side, degrees; 0 above the elbow, 90 at the wrist. */
    twist: number;

    /**
     * Distance of the surface from the bone axis, millimetres, toward anterior, anteromedial, medial, posteromedial, posterior, posterolateral, lateral and anterolateral in the section's twisted frame.
     */
    radii: number[];
  }
}

/** One superficial form. */
interface IForm {
  name: string;
  kind: "muscle" | "bone";
  angle: number;
  width: number;
  amplitude: number;
  from: number;
  peak: number;
  to: number;
}

/** Deep relative radii of one level: superellipse proportions plus every form, mean near 1. */
const deepShape = (level: number, muscularity: number): number[] => {
  const aspect: number = interpolate(
    PROPORTION.map((p: [number, number, number]): [number, number] => [p[0], p[1]]),
    level,
  );
  const exponent: number = interpolate(
    PROPORTION.map((p: [number, number, number]): [number, number] => [p[0], p[2]]),
    level,
  );
  const breadth: number = Math.sqrt(aspect);
  const depth: number = 1 / breadth;
  return Array.from({ length: COUNT }, (_: unknown, k: number): number => {
    const angle: number = (2 * Math.PI * k) / COUNT;
    const base: number = Math.pow(
      Math.pow(Math.abs(Math.cos(angle)) / depth, exponent) +
        Math.pow(Math.abs(Math.sin(angle)) / breadth, exponent),
      -1 / exponent,
    );
    let relief: number = 0;
    for (const form of FORMS) {
      const along: number = bump(level, form.from, form.peak, form.to);
      if (along === 0) continue;
      const delta: number = wrap((angle * 180) / Math.PI - form.angle);
      const around: number = Math.exp(-0.5 * (delta / form.width) ** 2);
      const scale: number = form.kind === "muscle" ? muscularity : 1;
      relief += form.amplitude * scale * along * around;
    }
    return base + relief;
  });
};

/** Fat thickness at the eight directions of one level, millimetres. */
const fatAround = (
  level: number,
  tissue: estimateAutoMovieHumanArmTissue.IOutput,
): number[] => {
  const along: number = interpolate(
    [
      [-1, tissue.upperArmFat],
      [-0.3, 0.9 * tissue.upperArmFat],
      [0, (tissue.upperArmFat + tissue.forearmFat) / 2],
      [FOREARM_PEAK, tissue.forearmFat],
      [1, tissue.wristFat],
    ],
    level,
  );
  const blend: number = Math.min(1, Math.max(0, (level + 0.1) / 0.3));
  return Array.from({ length: COUNT }, (_: unknown, k: number): number => {
    const around: number =
      (1 - blend) * FAT_AROUND.upper[k]! + blend * FAT_AROUND.fore[k]!;
    // skin over the olecranon is thin: the subcutaneous bursa, not fat
    const olecranon: number =
      k === 4 || k === 3 || k === 5
        ? 1 - (k === 4 ? 0.65 : 0.4) * bump(level, -0.12, 0, 0.14)
        : 1;
    return along * around * olecranon;
  });
};

/**
 * Scale the deep shape so the section through its radii plus the fat has the target girth, holding pinned radii and pinning any radius that crosses its floor or ceiling there.
 */
const fitGirth = (
  shape: number[],
  fat: number[],
  girth: number,
  pinned: Map<number, number>,
  floor: Map<number, number>,
  ceiling: Map<number, number>,
): number[] => {
  const fixed: Map<number, number> = new Map(pinned);
  for (let round: number = 0; round <= COUNT; ++round) {
    const radii: (scale: number) => number[] = (scale: number): number[] =>
      shape.map((s: number, k: number): number =>
        fixed.has(k) ? fixed.get(k)! : scale * s + fat[k]!,
      );
    let low: number = 0;
    let high: number = girth;
    for (let step: number = 0; step < 60; ++step) {
      const middle: number = (low + high) / 2;
      if (perimeter(radii(middle)) < girth) low = middle;
      else high = middle;
    }
    const result: number[] = radii((low + high) / 2);
    let raised: boolean = false;
    for (const [k, value] of floor)
      if (!fixed.has(k) && result[k]! < value) {
        fixed.set(k, value);
        raised = true;
      }
    for (const [k, value] of ceiling)
      if (!fixed.has(k) && result[k]! > value) {
        fixed.set(k, value);
        raised = true;
      }
    if (!raised) return result;
  }
  throw new Error("arm section cannot meet its girth within its bones");
};

/**
 * Length of the periodic cubic B-spline that interpolates the section's points, the curve the subdivided cage follows at that level.
 */
const perimeter = (radii: number[]): number => {
  const points: Array<[number, number]> = radii.map(
    (r: number, k: number): [number, number] => {
      const angle: number = (2 * Math.PI * k) / COUNT;
      return [r * Math.cos(angle), r * Math.sin(angle)];
    },
  );
  // control points whose B-spline interpolates the points: (c[k-1] + 4 c[k] + c[k+1]) / 6 = p[k]
  let control: Array<[number, number]> = points.map(
    (p: [number, number]): [number, number] => [p[0], p[1]],
  );
  for (let step: number = 0; step < 60; ++step)
    control = control.map((c: [number, number], k: number): [number, number] => {
      const a: [number, number] = control[(k + COUNT - 1) % COUNT]!;
      const b: [number, number] = control[(k + 1) % COUNT]!;
      return [
        c[0] + points[k]![0] - (a[0] + 4 * c[0] + b[0]) / 6,
        c[1] + points[k]![1] - (a[1] + 4 * c[1] + b[1]) / 6,
      ];
    });
  const SAMPLES: number = 16;
  let length: number = 0;
  let previous: [number, number] | null = null;
  let first: [number, number] | null = null;
  for (let k: number = 0; k < COUNT; ++k)
    for (let s: number = 0; s < SAMPLES; ++s) {
      const t: number = s / SAMPLES;
      const p0: [number, number] = control[(k + COUNT - 1) % COUNT]!;
      const p1: [number, number] = control[k]!;
      const p2: [number, number] = control[(k + 1) % COUNT]!;
      const p3: [number, number] = control[(k + 2) % COUNT]!;
      const w: [number, number, number, number] = [
        (1 - t) ** 3 / 6,
        (3 * t ** 3 - 6 * t ** 2 + 4) / 6,
        (-3 * t ** 3 + 3 * t ** 2 + 3 * t + 1) / 6,
        t ** 3 / 6,
      ];
      const point: [number, number] = [
        w[0] * p0[0] + w[1] * p1[0] + w[2] * p2[0] + w[3] * p3[0],
        w[0] * p0[1] + w[1] * p1[1] + w[2] * p2[1] + w[3] * p3[1],
      ];
      if (previous !== null)
        length += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
      else first = point;
      previous = point;
    }
  return length + Math.hypot(first![0] - previous![0], first![1] - previous![1]);
};

/** Smooth bump along the arm: 0 outside `from` to `to`, 1 at `peak`, cosine on each side. */
const bump = (x: number, from: number, peak: number, to: number): number => {
  if (x <= from || x >= to) return 0;
  const t: number = x < peak ? (x - from) / (peak - from) : (to - x) / (to - peak);
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
};

/** Signed angle difference in degrees, in (-180, 180]. */
const wrap = (degrees: number): number => {
  const r: number = ((degrees % 360) + 360) % 360;
  return r > 180 ? r - 360 : r;
};

/** Piecewise linear interpolation over ascending knots, held beyond the ends. */
const interpolate = (knots: Array<[number, number]>, x: number): number => {
  if (x <= knots[0]![0]) return knots[0]![1];
  for (let i: number = 1; i < knots.length; ++i) {
    const [x1, y1]: [number, number] = knots[i]!;
    if (x <= x1) {
      const [x0, y0]: [number, number] = knots[i - 1]!;
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return knots[knots.length - 1]![1];
};
