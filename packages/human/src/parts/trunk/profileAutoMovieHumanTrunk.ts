import { AUTOMOVIE_HUMAN_TRUNK_FORM } from "./AUTOMOVIE_HUMAN_TRUNK_FORM";
import { IAutoMovieHumanTrunkForm } from "./IAutoMovieHumanTrunkForm";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { curveAutoMovieHumanTrunk } from "./curveAutoMovieHumanTrunk";

/**
 * The trunk's level sections: at every height, the front and back of the midline, the half breadth, the depth of the widest point and the squareness of the front and back halves.
 *
 * Key levels carry the measured sections: the buttock level (buttock depth, hip breadth, buttock circumference), the natural waist and the chest point (their depths, breadths and circumferences), with the iliac crest, the costal arch and the axilla between or beside them. Each key section's back lies a share of its depth behind the vertebral column, so the skeleton's lordosis and kyphosis show on the back, and its front lies the depth ahead of the back. Where a circumference is measured, the squareness is solved so the section's perimeter is that circumference, which is what a tape around the convex section reads; the front and back halves keep a fitted ratio of exponents. Between key levels every quantity follows the monotone interpolant of `curveAutoMovieHumanTrunk`, so no section bulges past its neighbours.
 *
 * @param frame The side's trunk frame
 * @returns The profile
 */
export function profileAutoMovieHumanTrunk(
  frame: IAutoMovieHumanTrunkFrame,
): profileAutoMovieHumanTrunk.IProfile {
  const F: IAutoMovieHumanTrunkForm = AUTOMOVIE_HUMAN_TRUNK_FORM;
  const L: IAutoMovieHumanTrunkFrame.ILevels = frame.levels;
  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
  const B = frame.buttock;
  const W = frame.waist;
  const C = frame.chest;
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
    measured(
      frame,
      L.costal,
      lerp(W.depth, C.depth, F.underbust.depth),
      lerp(W.breadth, C.breadth, F.underbust.breadth),
      frame.underbust,
      F.underbust,
    ),
    measured(frame, L.chestPoint, C.depth, C.breadth, C.girth, F.chest),
    derived(
      frame,
      L.axilla,
      C.depth * F.axilla.depth,
      C.breadth * F.axilla.breadth,
      F.axilla,
    ),
  ];
  const through = (pick: (key: IKey) => number): Array<[number, number]> =>
    keys.map((key: IKey): [number, number] => [key.y, pick(key)]);
  const buttock: IKey = keys[0]!;
  const hipLevel: number = lerp(L.buttock, frame.iliocristale.y, F.hip.level);
  const front: (y: number) => number = curveAutoMovieHumanTrunk([
    [L.gluteal, buttock.back + F.gluteal.front * buttock.depth],
    ...through((k: IKey): number => k.back + k.depth),
    [frame.suprasternale.y, frame.suprasternale.z],
  ]);
  const back: (y: number) => number = curveAutoMovieHumanTrunk([
    [L.gluteal, buttock.back + F.gluteal.back * buttock.depth],
    ...through((k: IKey): number => k.back),
    [frame.cervicale.y, frame.cervicale.z],
  ]);
  const half: (y: number) => number = curveAutoMovieHumanTrunk([
    ...through((k: IKey): number => k.breadth / 2),
    [hipLevel, (F.hip.breadth * B.breadth) / 2],
  ]);
  const widest: (y: number) => number = curveAutoMovieHumanTrunk(
    through((k: IKey): number => k.back + k.widest * k.depth),
  );
  const frontSquareness: (y: number) => number = curveAutoMovieHumanTrunk(
    through((k: IKey): number => k.front),
  );
  const backSquareness: (y: number) => number = curveAutoMovieHumanTrunk(
    through((k: IKey): number => k.rear),
  );
  return {
    front,
    back,
    half,
    widest: (y: number): number =>
      Math.min(front(y) - MINIMUM_HALF, Math.max(back(y) + MINIMUM_HALF, widest(y))),
    squareness: (y: number): { front: number; back: number } => ({
      front: frontSquareness(y),
      back: backSquareness(y),
    }),
  };
}
/** Profile type of {@link profileAutoMovieHumanTrunk}. */
export namespace profileAutoMovieHumanTrunk {
  /**
   * The trunk's level sections, read by height in millimetres.
   *
   * @author Samchon
   */
  export interface IProfile {
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

/** Smallest front or back half-depth a section keeps, millimetres. */
const MINIMUM_HALF: number = 10;

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

/** A key level whose squareness is solved from its circumference. */
const measured = (
  frame: IAutoMovieHumanTrunkFrame,
  y: number,
  depth: number,
  breadth: number,
  girth: number,
  form: IAutoMovieHumanTrunkForm.IMeasured,
): IKey => {
  const back: number = frame.column(y) - form.behind * depth;
  const ahead: number = (1 - form.widest) * depth;
  const behind: number = form.widest * depth;
  const ratio: number = Math.exp(form.skew / 2);
  const perimeter = (n: number): number =>
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

/** A key level whose squareness is given. */
const derived = (
  frame: IAutoMovieHumanTrunkFrame,
  y: number,
  depth: number,
  breadth: number,
  form: IAutoMovieHumanTrunkForm.IDerived,
): IKey => ({
  y,
  depth,
  breadth,
  back: frame.column(y) - form.behind * depth,
  widest: form.widest,
  front: form.front,
  rear: form.back,
});

/** Length of the superellipse quarter `x = a cos^(2/n) t`, `y = b sin^(2/n) t` for `t` from 0 to a right angle. */
const quarter = (a: number, b: number, n: number): number => {
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
