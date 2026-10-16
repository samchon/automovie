import { AUTOMOVIE_HUMAN_TRUNK_FORM } from "./AUTOMOVIE_HUMAN_TRUNK_FORM";
import { IAutoMovieHumanTrunkForm } from "./IAutoMovieHumanTrunkForm";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { interpolateAutoMovieHumanTrunkSection } from "./interpolateAutoMovieHumanTrunkSection";

/**
 * The trunk's level sections: at every height, the front and back of the midline, the half breadth, the depth of the widest point and the squareness of the front and back halves.
 *
 * Key levels carry the measured sections: the buttock level (buttock depth, hip breadth, buttock circumference), the natural waist and the chest point (their depths, breadths and circumferences), with the iliac crest, the underbust at the inframammary fold and the axilla between or beside them. Each key section's back lies a share of its depth behind the vertebral column, so the skeleton's lordosis and kyphosis show on the back, and its front lies the depth ahead of the back. Where a circumference is measured, the squareness is solved so the section's perimeter is that circumference, which is what a tape around the convex section reads; the front and back halves keep a fitted ratio of exponents. Every longitudinal guide is the same `point(height, angle)` family at a fixed polar angle. The shared section centre and positive half-dimensions interpolate together at the anatomical key heights; front and back supports derive from those values, with no independent coordinate clamps. Dimensionless log interpolation keeps half-dimensions positive and C2 between keys, under the engine's sampled-tension policy. This does not prove monotonicity or a final-skin bound. The spinal axis is unchanged. The underbust uses its own measured girth and a shape ratio calibrated at its actual fold plane, independently of the waist and chest depths.
 *
 * @param frame The side's trunk frame
 * @returns The profile
 */
export function profileAutoMovieHumanTrunk(
  frame: IAutoMovieHumanTrunkFrame,
): profileAutoMovieHumanTrunk.IProfile {
  const F: IAutoMovieHumanTrunkForm = AUTOMOVIE_HUMAN_TRUNK_FORM;
  const L: IAutoMovieHumanTrunkFrame.ILevels = frame.levels;
  const lerp: (a: number, b: number, t: number) => number = (a: number, b: number, t: number): number => a + (b - a) * t;
  const B: IAutoMovieHumanTrunkFrame.ISection = frame.buttock;
  const W: IAutoMovieHumanTrunkFrame.ISection = frame.waist;
  const C: IAutoMovieHumanTrunkFrame.ISection = frame.chest;
  const chest: IKey = encircled(frame, L.chestPoint, C.depth, C.girth, F.chest);
  const keys: IKey[] = [
    measured(frame, L.buttock, B.depth, B.breadth, B.girth, F.buttock),
    derived(
      frame,
      frame.iliocristale.y,
      lerp(B.depth, W.depth, F.crest.depth),
      lerp(B.breadth, W.breadth, F.crest.breadth),
      F.crest,
    ),
    measured(frame, L.waist, W.depth, W.breadth, W.girth, F.waist),
    encircled(
      frame,
      L.underbust,
      frame.underbust * F.underbust.depth,
      frame.underbust,
      F.underbust,
    ),
    chest,
    derived(
      frame,
      L.axilla,
      C.depth * F.axilla.depth,
      chest.breadth * F.axilla.breadth,
      F.axilla,
    ),
  ];
  const buttock: IKey = keys[0]!;
  const crest: IKey = keys[1]!;
  const hipLevel: number = lerp(L.buttock, frame.iliocristale.y, F.hip.level);
  const hip: IKey = {
    y: hipLevel,
    depth: lerp(buttock.depth, crest.depth, F.hip.level),
    breadth: F.hip.breadth * B.breadth,
    back: lerp(buttock.back, crest.back, F.hip.level),
    widest: lerp(buttock.widest, crest.widest, F.hip.level),
    front: Math.exp(lerp(Math.log(buttock.front), Math.log(crest.front), F.hip.level)),
    rear: Math.exp(lerp(Math.log(buttock.rear), Math.log(crest.rear), F.hip.level)),
  };
  function fork(y: number, form: IAutoMovieHumanTrunkForm.IFork): IKey {
    const back: number = buttock.back + form.back * buttock.depth;
    const front: number = buttock.back +
      (form.front + form.fat * (frame.fat - REFERENCE_FAT)) * buttock.depth;
    return {y, back, depth:front-back, breadth:form.breadth*B.breadth,
      widest:0.5, front:buttock.front, rear:buttock.rear};
  }
  const family: interpolateAutoMovieHumanTrunkSection.IFamily =
    interpolateAutoMovieHumanTrunkSection([
      fork(L.gluteal, F.gluteal), fork(L.crotch, F.crotch), ...keys, hip,
    ].map((key: IKey): interpolateAutoMovieHumanTrunkSection.ISection => ({
      height:key.y, centre:key.back + key.widest*key.depth,
      forward:(1-key.widest)*key.depth, backward:key.widest*key.depth,
      half:key.breadth/2, frontExponent:key.front, backExponent:key.rear,
    })));
  return {
    ...family,
    front: (y: number): number => {
      const section: interpolateAutoMovieHumanTrunkSection.ISection = family.at(y);
      return section.centre + section.forward;
    },
    back: (y: number): number => {
      const section: interpolateAutoMovieHumanTrunkSection.ISection = family.at(y);
      return section.centre - section.backward;
    },
    half: (y: number): number => family.at(y).half,
    widest: (y: number): number => family.at(y).centre,
    squareness: (y: number): {front:number;back:number} => {
      const section: interpolateAutoMovieHumanTrunkSection.ISection = family.at(y);
      return {front:section.frontExponent,back:section.backExponent};
    },
  };
}
/** Profile type of {@link profileAutoMovieHumanTrunk}. */
export namespace profileAutoMovieHumanTrunk {
  /**
   * The trunk's level sections, read by height in millimetres.
   *
   * @author Samchon
   */
  export interface IProfile extends interpolateAutoMovieHumanTrunkSection.IFamily {
    /** Front of the midline at a height. */
    front: (y: number) => number;

    /** Back of the midline at a height. */
    back: (y: number) => number;

    /** Half breadth at a height. */
    half: (y: number) => number;

    /** Front-back position of the widest point at a height, strictly between the back and the front. */
    widest: (y: number) => number;

    /** Exponents of the front and back halves at a height; 2 is an ellipse. */
    squareness: (y: number) => { front: number; back: number };
  }
}

/** Exponents a solved section stays within: near a diamond at the low end, near a rectangle at the high end. */
const EXPONENT: { low: number; high: number } = { low: 1.2, high: 12 };

/** Bisection steps on the exponent's logarithm; each halves the interval. */
const BISECTIONS: number = 40;

/** Polyline segments per quarter when a perimeter is summed. */
const QUARTER_SEGMENTS: number = 96;

/** One key level's section. */
interface IKey {
  y: number;
  depth: number;
  breadth: number;
  back: number;
  widest: number;
  front: number;
  rear: number;
}

/** Body fat percentage at which a placement's `behind` share holds. */
const REFERENCE_FAT: number = 15;

/** Share of the depth the back lies behind the column at the frame's body fat. */
const behindOf: (frame: IAutoMovieHumanTrunkFrame, form: IAutoMovieHumanTrunkForm.IPlacement) => number = (
  frame: IAutoMovieHumanTrunkFrame,
  form: IAutoMovieHumanTrunkForm.IPlacement,
): number => form.behind + form.fat * (frame.fat - REFERENCE_FAT);

/** A key level whose squareness is solved from its circumference. */
const measured: (frame: IAutoMovieHumanTrunkFrame, y: number, depth: number, breadth: number, girth: number, form: IAutoMovieHumanTrunkForm.IMeasured) => IKey = (
  frame: IAutoMovieHumanTrunkFrame,
  y: number,
  depth: number,
  breadth: number,
  girth: number,
  form: IAutoMovieHumanTrunkForm.IMeasured,
): IKey => {
  const back: number = frame.column(y) - behindOf(frame, form) * depth;
  const ahead: number = (1 - form.widest) * depth;
  const behind: number = form.widest * depth;
  const ratio: number = Math.exp(form.skew / 2);
  const perimeter: (n: number) => number = (n: number): number =>
    2 *
    (quarter(ahead, breadth / 2, n * ratio) +
      quarter(behind, breadth / 2, n / ratio));
  // the geometric mean exponent whose section's perimeter is the girth, within the admitted exponents
  const low: number = Math.log(EXPONENT.low * Math.max(ratio, 1 / ratio));
  const high: number = Math.log(EXPONENT.high / Math.max(ratio, 1 / ratio));
  let a: number = low;
  let b: number = high;
  if (perimeter(Math.exp(a)) >= girth) b = a;
  else if (perimeter(Math.exp(b)) <= girth) a = b;
  else
    for (let step: number = 0; step < BISECTIONS; ++step) {
      const middle: number = (a + b) / 2;
      if (perimeter(Math.exp(middle)) < girth) a = middle;
      else b = middle;
    }
  const n: number = Math.exp((a + b) / 2);
  return {
    y,
    depth,
    breadth,
    back,
    widest: form.widest,
    front: n * ratio,
    rear: n / ratio,
  };
};

/** A key level whose breadth is solved so its section's perimeter is the girth at the given squareness. */
const encircled: (frame: IAutoMovieHumanTrunkFrame, y: number, depth: number, girth: number, form: IAutoMovieHumanTrunkForm.IEncircled) => IKey = (
  frame: IAutoMovieHumanTrunkFrame,
  y: number,
  depth: number,
  girth: number,
  form: IAutoMovieHumanTrunkForm.IEncircled,
): IKey => {
  const perimeter: (breadth: number) => number = (breadth: number): number =>
    2 *
    (quarter((1 - form.widest) * depth, breadth / 2, form.front) +
      quarter(form.widest * depth, breadth / 2, form.back));
  let a: number = BREADTH.low * depth;
  let b: number = BREADTH.high * depth;
  for (let step: number = 0; step < BISECTIONS; ++step) {
    const middle: number = (a + b) / 2;
    if (perimeter(middle) < girth) a = middle;
    else b = middle;
  }
  return {
    y,
    depth,
    breadth: (a + b) / 2,
    back: frame.column(y) - behindOf(frame, form) * depth,
    widest: form.widest,
    front: form.front,
    rear: form.back,
  };
};

/** Breadths a solved section stays within, as multiples of its depth. */
const BREADTH: { low: number; high: number } = { low: 0.5, high: 4 };

/** A key level whose squareness is given. */
const derived: (frame: IAutoMovieHumanTrunkFrame, y: number, depth: number, breadth: number, form: IAutoMovieHumanTrunkForm.IDerived) => IKey = (
  frame: IAutoMovieHumanTrunkFrame,
  y: number,
  depth: number,
  breadth: number,
  form: IAutoMovieHumanTrunkForm.IDerived,
): IKey => ({
  y,
  depth,
  breadth,
  back: frame.column(y) - behindOf(frame, form) * depth,
  widest: form.widest,
  front: form.front,
  rear: form.back,
});

/** Length of the superellipse quarter `x = a cos^(2/n) t`, `y = b sin^(2/n) t` for `t` from 0 to a right angle. */
const quarter: (a: number, b: number, n: number) => number = (a: number, b: number, n: number): number => {
  let length: number = 0;
  let px: number = a;
  let py: number = 0;
  for (let k: number = 1; k <= QUARTER_SEGMENTS; ++k) {
    const t: number = (k / QUARTER_SEGMENTS) * (Math.PI / 2);
    const x: number = a * Math.pow(Math.max(0, Math.cos(t)), 2 / n);
    const y: number = b * Math.pow(Math.sin(t), 2 / n);
    length += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return length;
};
