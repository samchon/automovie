import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { estimateAutoMovieHumanArmTissue } from "./estimateAutoMovieHumanArmTissue";

/**
 * Levels of the arm's edge loops in its own coordinate: minus the fraction of the cut-to-elbow length above the elbow joint centre, plus the fraction of the elbow-to-wrist-cut length below it. The upper arm takes the biceps peak, the narrowing above the elbow and the epicondyles; the joint level carries the olecranon; the forearm takes the swell of its upper muscular half, its maximum girth, the end of the bellies, the flattened tendinous half and the wrist. Loops gather at the elbow, 9, 0 and 10 percent, so the cage has edges to fold on when it flexes ("denser in areas that deform more", Blender Manual, "Mesh Structure"). Grade: conventional placement of measured landmarks.
 */
const LEVELS: number[] = [-1, -0.62, -0.3, -0.09, 0, 0.1, 0.22, 0.42, 0.64, 0.83, 1];

/** Level of the maximum forearm girth, where the identity's forearm circumference is matched. Grade: conventional, a fifth of the way down, in the upper muscular half. */
const FOREARM_PEAK: number = 0.22;

/**
 * Cross-section proportions along the arm, as breadth over depth and the superellipse exponent of the section (2 an ellipse, larger a squarer, flattened section). Mid upper arm is a little deeper than broad between biceps and triceps, the elbow broad across the epicondyles, the lower forearm and the wrist flattened with a palmar and a dorsal face (Gray 1918, "Surface Anatomy of the Upper Extremity"). Grade: conventional.
 */
const PROPORTION: Array<[level: number, aspect: number, exponent: number]> = [
  [-1, 0.92, 2],
  [-0.62, 0.95, 2],
  [-0.3, 1.05, 2],
  [-0.09, 1.22, 2.1],
  [0, 1.25, 2.1],
  [0.1, 1.18, 2],
  [0.22, 1.15, 2],
  [0.42, 1.22, 2.1],
  [0.64, 1.35, 2.3],
  [0.83, 1.45, 2.5],
  [1, 1.5, 2.6],
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

/** Thickness of skin over a subcutaneous bone, millimetres; dermis is 1 to 2 mm thick. Grade: conventional. */
const SKIN: number = 1.5;

/**
 * Elbow girth without fat, a fraction of the forearm's maximum girth without fat. At the joint line the section holds the epicondyles, the olecranon, the brachialis and biceps tendon crossing in front and the origins of the forearm masses. No measured elbow girth was read; the fraction is checked against the arm's visible narrowing above the forearm swell. Grade: conventional.
 */
const ELBOW_PER_FOREARM: number = 0.85;

/** Bony projections at the elbow as fractions of the biepicondylar breadth: medial and lateral epicondyles from the joint axis, the medial more prominent (Gray 1918), and the olecranon tip behind it. Grade: conventional. */
const ELBOW_BONE: { medial: number; lateral: number; olecranon: number } = {
  medial: 0.55,
  lateral: 0.45,
  olecranon: 0.3,
};

/**
 * Superficial forms of the arm, each a ridge or furrow along the limb at one direction of the section.
 *
 * `angle` is degrees from the anterior (flexor) surface toward the medial side, in the forearm's frame in supination, which the section twists into the rest pose. `amplitude` is relative to the section's mean deep radius; muscles and furrows scale with muscularity, bones do not. `from`, `peak` and `to` are arm levels as in `LEVELS`. Courses follow Gray (1918) and Bridgman (1920, "Constructive Anatomy"): the brachioradialis wedge rises a third of the way up the arm and peaks above the medial flexor-pronator mass, which starts at the medial epicondyle and peaks lower, so the outer and inner contours never peak at one level; the deltoid insertion and the cubital fossa are hollows between bellies; the lower forearm is tendinous. Amplitudes are conventional, judged in the viewer.
 */
const FORMS: IForm[] = [
  { name: "biceps", kind: "muscle", angle: 10, width: 38, amplitude: 0.1, from: -1.4, peak: -0.55, to: -0.08 },
  { name: "brachialis lateral", kind: "muscle", angle: -60, width: 25, amplitude: 0.05, from: -0.75, peak: -0.28, to: 0.08 },
  { name: "brachialis medial", kind: "muscle", angle: 62, width: 25, amplitude: 0.04, from: -0.7, peak: -0.3, to: 0 },
  { name: "triceps long head", kind: "muscle", angle: 150, width: 35, amplitude: 0.08, from: -1.5, peak: -0.9, to: -0.35 },
  { name: "triceps lateral head", kind: "muscle", angle: -140, width: 32, amplitude: 0.07, from: -1.5, peak: -1, to: -0.45 },
  { name: "triceps tendon plane", kind: "muscle", angle: 180, width: 30, amplitude: -0.07, from: -0.6, peak: -0.25, to: -0.02 },
  { name: "deltoid insertion", kind: "muscle", angle: -90, width: 25, amplitude: -0.035, from: -1.3, peak: -1, to: -0.7 },
  { name: "medial bicipital groove", kind: "muscle", angle: 95, width: 20, amplitude: -0.04, from: -1.3, peak: -0.8, to: -0.35 },
  { name: "cubital fossa", kind: "muscle", angle: 0, width: 28, amplitude: -0.07, from: -0.2, peak: -0.02, to: 0.15 },
  { name: "brachioradialis", kind: "muscle", angle: -65, width: 32, amplitude: 0.12, from: -0.42, peak: 0.06, to: 0.6 },
  { name: "flexor-pronator mass", kind: "muscle", angle: 50, width: 38, amplitude: 0.11, from: -0.05, peak: 0.22, to: 0.75 },
  { name: "extensor mass", kind: "muscle", angle: -125, width: 32, amplitude: 0.07, from: 0, peak: 0.25, to: 0.8 },
  { name: "anconeus", kind: "muscle", angle: -158, width: 20, amplitude: 0.03, from: 0, peak: 0.08, to: 0.2 },
  { name: "ulnar furrow", kind: "muscle", angle: 150, width: 18, amplitude: -0.05, from: 0.05, peak: 0.4, to: 1 },
  { name: "abductor pollicis longus", kind: "muscle", angle: -105, width: 25, amplitude: 0.04, from: 0.55, peak: 0.74, to: 0.92 },
  { name: "medial epicondyle", kind: "bone", angle: 90, width: 20, amplitude: 0.06, from: -0.25, peak: -0.08, to: 0.1 },
  { name: "lateral epicondyle", kind: "bone", angle: -90, width: 20, amplitude: 0.03, from: -0.25, peak: -0.08, to: 0.08 },
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
 * 3. The deep shape is scaled and the fat layer laid over it so the section's girth equals the level's girth: the identity's upper arm circumference at the upper cut, its forearm circumference at the forearm's maximum, its wrist circumference at the wrist, and between them a girth interpolated without fat, where the elbow is a fixed fraction of the forearm.
 * 4. Bones pin the radii they reach: the olecranon fixes the back of the elbow and the styloids the breadth of the wrist, and the epicondyles keep the elbow at least as broad as the bone.
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
  const deep: (girth: number, level: number) => number = (
    girth: number,
    level: number,
  ): number => girth - 2 * Math.PI * mean(fat(level));
  const upper: number = deep(arm.upperArmCircumference, -1);
  const forearm: number = deep(arm.forearmCircumference, FOREARM_PEAK);
  const wrist: number = deep(arm.wristCircumference, 1);
  const elbow: number = ELBOW_PER_FOREARM * forearm;
  const deepGirth: (level: number) => number = (level: number): number =>
    interpolate(
      [
        [-1, upper],
        [-0.62, upper],
        [-0.3, upper + 0.55 * (elbow - upper)],
        [-0.09, elbow],
        [0, elbow],
        [0.1, elbow + 0.7 * (forearm - elbow)],
        [FOREARM_PEAK, forearm],
        [0.42, forearm + 0.25 * (wrist - forearm)],
        [0.64, forearm + 0.62 * (wrist - forearm)],
        [0.83, forearm + 0.88 * (wrist - forearm)],
        [1, wrist],
      ],
      level,
    );
  return LEVELS.map((level: number): sectionAutoMovieHumanArm.ISection => {
    const thickness: number[] = fat(level);
    const girth: number = deepGirth(level) + 2 * Math.PI * mean(thickness);
    const shape: number[] = deepShape(level, tissue.muscularity);
    const levelling: number =
      mean(thickness) / (mean(thickness) + FAT_LEVELLING);
    const average: number = mean(shape);
    const soft: number[] = shape.map(
      (s: number): number => (1 - levelling) * s + levelling * average,
    );
    const pinned: Map<number, number> = new Map();
    const floor: Map<number, number> = new Map();
    if (level === 0)
      pinned.set(
        4,
        ELBOW_BONE.olecranon * tissue.elbowBreadth + SKIN + thickness[4]!,
      );
    if (level === -0.09 || level === 0) {
      floor.set(2, ELBOW_BONE.medial * tissue.elbowBreadth + SKIN + thickness[2]!);
      floor.set(6, ELBOW_BONE.lateral * tissue.elbowBreadth + SKIN + thickness[6]!);
    }
    if (level === 1) {
      pinned.set(2, tissue.wristBreadth / 2 + SKIN + thickness[2]!);
      pinned.set(6, tissue.wristBreadth / 2 + SKIN + thickness[6]!);
    }
    return {
      level,
      twist: level <= 0 ? 0 : NEUTRAL_TWIST * level * level * (3 - 2 * level),
      radii: fitGirth(soft, thickness, girth, pinned, floor),
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
 * Scale the deep shape so the section through its radii plus the fat has the target girth, holding pinned radii and raising any radius under its floor.
 */
const fitGirth = (
  shape: number[],
  fat: number[],
  girth: number,
  pinned: Map<number, number>,
  floor: Map<number, number>,
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
    if (!raised) return result;
  }
  throw new Error("arm section cannot meet its girth above its bones");
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
