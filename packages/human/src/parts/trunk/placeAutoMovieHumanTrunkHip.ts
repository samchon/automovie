import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { IAutoMovieHumanTrunkTune } from "./IAutoMovieHumanTrunkTune";
import { profileAutoMovieHumanTrunk } from "./profileAutoMovieHumanTrunk";

/**
 * Cage radius over limit-surface radius of a regular ring of twelve: (4 + 2 cos 30°) / 6.
 */
const TWELVE_SPAN_LIMIT: number = (4 + 2 * Math.cos(Math.PI / 6)) / 6;

/**
 * The thigh root's slots on loop 0 (left side): torso column, angle about the thigh from the front toward the lateral side in degrees, the level the height rises from, its share of the way from there to the hip joint centre, and an offset in statures. The inguinal fold runs across the front, drops around the lateral side below the greater trochanter to the gluteal fold, which curves up laterally behind, lowest beside the natal cleft, as the lower border of gluteus maximus crosses it obliquely (Gray 1918). Shares and offsets were fitted with the relief to twelve MakeHuman CC0 bodies, sliced at four levels below the crotch around the thigh (see the relief's terms); the fitted front shares alternated 0.685, 0.599, 0.682 and 0.597 between neighbouring columns, finer than four levels resolve, so their mean is used across the front. Grade: fitted to a CC0 reference.
 */
const ROOT: Array<[number, number, "crotch" | "gluteal", number, number]> = [
  [2, -30, "crotch", 0.64, 0],
  [3, 0, "crotch", 0.64, 0],
  [4, 30, "crotch", 0.64, 0],
  [5, 60, "crotch", 0.64, 0],
  [6, 90, "crotch", 0.357, 0],
  [7, 120, "gluteal", 0.35, -0.001],
  [8, 150, "gluteal", 0, 0.0155],
  [9, 180, "gluteal", 0, 0.0095],
  [10, -150, "gluteal", 0, 0.0082],
  [11, -120, "gluteal", 0, -0.0014],
];

/**
 * Squareness exponents of the thigh section at the gluteal furrow: the lateral half rounded, the medial half flattened where the two thighs press together, so the section is shallower than an ellipse of the same breadth and girth and the buttock overhangs its back. Conventional, judged on renders against the MakeHuman CC0 bodies.
 */
const THIGH_SQUARENESS: Record<"medial" | "lateral", number> = {
  medial: 3.6,
  lateral: 2.2,
};

/**
 * Place the hip of one side: the thigh root on loop 0, its half of the perineum, and the thigh down to the mid-thigh cut.
 *
 * The upper thighs meet at the midline, so each thigh section spans half the hip breadth and takes the rest of its measured girth in depth: rounded laterally and flattened medially, its front just behind the lower abdomen and its back overhung by the buttock at the gluteal fold. The first ring below the fold carries the measured thigh circumference, the next is halfway to the cut, and the last is the `thigh` cut on the site's shared ring shape.
 *
 * @param frame The side's trunk frame, left frame
 * @param profile The side's continuous body
 * @param tune Corrections from the girth fit
 * @param loops Left half torso loops, loop 0 placed here
 * @param layout The shared ring shape at this side's mid thigh
 * @returns The perineum's side vertex and the midline one, left frame, and the thigh rings: two in the left frame in the left ring order, then the cut on the shared shape in the model frame
 */
export function placeAutoMovieHumanTrunkHip(
  frame: IAutoMovieHumanTrunkFrame,
  profile: profileAutoMovieHumanTrunk.IProfile,
  tune: IAutoMovieHumanTrunkTune,
  loops: IAutoMovieVector3[][],
  layout: IAutoMovieHumanRingShape,
): placeAutoMovieHumanTrunkHip.IOutput {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const S: number = frame.stature;
  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
  const crotch: number = frame.levels.crotch;
  const gluteal: number = frame.levels.gluteal;
  const hip: number = frame.hip.y;

  // the thigh section at the gluteal furrow: rounded laterally, flattened where the thighs press together medially
  const width: number = (frame.buttock.breadth * tune.hip.breadth) / 4;
  const girth: number = frame.thighGirth * tune.thigh;
  const outline = (t: number, depth: number): [number, number] => {
    const s: number = Math.sin(t);
    const c: number = Math.cos(t);
    const n: number = s < 0 ? THIGH_SQUARENESS.medial : THIGH_SQUARENESS.lateral;
    return [
      Math.sign(s) * width * Math.pow(Math.abs(s), 2 / n),
      Math.sign(c) * depth * Math.pow(Math.abs(c), 2 / n),
    ];
  };
  const perimeter = (depth: number): number => {
    let sum: number = 0;
    let previous: [number, number] = outline(0, depth);
    for (let k: number = 1; k <= 96; ++k) {
      const next: [number, number] = outline((2 * Math.PI * k) / 96, depth);
      sum += Math.hypot(next[0] - previous[0], next[1] - previous[1]);
      previous = next;
    }
    return sum;
  };
  let low: number = 1;
  let high: number = girth;
  for (let i: number = 0; i < 50; ++i) {
    const d: number = (low + high) / 2;
    if (perimeter(d) > girth) high = d;
    else low = d;
  }
  const depth: number = (low + high) / 2;
  const x0: number = width + 0.004 * S;
  const z0: number = profile.front(hip) - 0.008 * S - depth;
  const around = (degrees: number, y: number, scale: number): IAutoMovieVector3 => {
    const [x, z]: [number, number] = outline((degrees * Math.PI) / 180, depth);
    return V.of(x0 + x * scale, y, z0 + z * scale);
  };

  // the thigh root
  for (const [j, degrees, from, share, offset] of ROOT)
    loops[0]![j] = around(
      degrees,
      lerp(from === "crotch" ? crotch : gluteal, hip, share) + offset * S,
      1.04,
    );
  loops[0]![1] = V.of(0.006 * S, lerp(crotch, hip, 0.38), z0 + depth * 0.8);
  loops[0]![0] = V.of(0, lerp(crotch, hip, 0.45), z0 + depth * 0.84);
  loops[0]![12] = V.of(0, crotch + 0.02 * S, z0 - depth * 0.9);

  // the thigh: below the fold, halfway, and the cut
  const ring = (y: number, scale: number, medial: number): IAutoMovieVector3[] =>
    Array.from({ length: 12 }, (_: unknown, k: number): IAutoMovieVector3 => {
      const [x, z]: [number, number] = outline((-k * 30 * Math.PI) / 180, depth);
      return V.of(Math.max(medial, x0 + x * scale), y, z0 + z * scale);
    });
  const furrow: number = gluteal - 0.012 * S;
  const thighRadius: number = girth / (2 * Math.PI);
  const cutRadius: number =
    layout.radii.reduce((sum: number, r: number): number => sum + r, 0) / layout.radii.length;
  const rings: IAutoMovieVector3[][] = [
    ring(furrow, 1 / TWELVE_SPAN_LIMIT, 0.004 * S),
    ring(
      lerp(furrow, layout.frame.origin.y, 0.5),
      lerp(1 / TWELVE_SPAN_LIMIT, cutRadius / thighRadius, 0.55),
      0.006 * S,
    ),
  ];
  const cut: IAutoMovieVector3[] = layout.positions;
  return {
    perineum: [
      V.of(0, crotch + 0.002 * S, z0 - 0.12 * depth),
      V.of(0.005 * S, crotch - 0.002 * S, z0 - 0.12 * depth),
    ],
    rings,
    cut,
  };
}
/** Output type of {@link placeAutoMovieHumanTrunkHip}. */
export namespace placeAutoMovieHumanTrunkHip {
  /**
   * The hip's points beyond the torso loops.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** The perineum's midline vertex and this side's, left frame. */
    perineum: [IAutoMovieVector3, IAutoMovieVector3];

    /** Thigh rings below the root, left frame, the left thigh's ring order. */
    rings: IAutoMovieVector3[][];

    /** The `thigh` cut on the shared shape, layout order, model frame. */
    cut: IAutoMovieVector3[];
  }
}
