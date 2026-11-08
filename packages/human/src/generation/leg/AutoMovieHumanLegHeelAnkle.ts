import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";

import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanLegLandmarks } from "./AutoMovieHumanLegLandmarks";
import type { AutoMovieHumanLegSegmentFrames } from "./AutoMovieHumanLegSegmentFrames";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The heel-ankle tape's own loop on the lofted leg. ANSUR II's heel-ankle
 * circumference runs from the heel's first floor contact over the
 * front-ankle juncture, the crease where the instep meets the front of the
 * leg: a diagonal plane through those two points and the leg's lateral
 * axis, not the ankle's bisection plane (on f1 that plane measures 268.3 mm
 * against the 308.5 mm tape). The loop is the chain cut by that plane, each
 * meridian's crossing found between neighbouring stations, and its girth the
 * taut tape: the perimeter of the crossings' convex hull in the plane.
 */
export namespace AutoMovieHumanLegHeelAnkle {
  /** The tape's plane and its loop on a chain. */
  export interface IOutput {
    /** The heel's first floor contact, chain frame. */
    heel: Vec3;

    /** The front-ankle juncture: the anterior guide's point at IM's station, chain frame. */
    juncture: Vec3;

    /** The loop's crossings, chain frame. */
    points: Vec3[];

    /** The taut tape around them, mm. */
    girth: number;
  }

  /**
   * Cut the chain by the heel-ankle tape's plane.
   *
   * @param chain The leg chain.
   * @param frames The frames the chain was lofted at.
   * @param landmarks Their landmarks.
   * @param root The femur frame's placement the chain was lofted under.
   * @param im IM's chain station.
   */
  export function loop(chain: IAutoMovieLoftChain, frames: AutoMovieHumanLegSegmentFrames.IOutput, landmarks: AutoMovieHumanLegLandmarks.IOutput, root: AutoMovieHumanArmCurveSpec.ITransform, im: number): IOutput {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const world: AutoMovieHumanArmCurveSpec.ITransform = S.compose(root, frames.chain(frames.foot.name, S.IDENTITY));
    const heel: Vec3 = S.apply(world, landmarks.foot.heel);
    // The anterior guide: phase 3 pi / 2 on the left leg's chart (+v posterior), pi / 2 on the right's.
    const anterior: number = frames.medial > 0 ? (3 * Math.PI) / 2 : Math.PI / 2;
    const juncture: Vec3 = AutoMovieLoftChain.point(chain, im, anterior) as Vec3;
    const lateral: Vec3 = S.rotate(root, [0, 0, 1]);
    const along: Vec3 = S.unit(sub(juncture, heel));
    const normal: Vec3 = S.unit(S.cross(along, lateral));
    const across: Vec3 = S.cross(normal, along);
    const first: number = chain.layers[0]!.y;
    const last: number = chain.layers[chain.layers.length - 1]!.y;
    const from: number = Math.max(first, im - 120);
    const to: number = Math.min(last, im + 160);
    const points: Vec3[] = [];
    for (let k: number = 0; k < 180; ++k) {
      const phase: number = (2 * Math.PI * k) / 180;
      let previous: { s: number; p: Vec3; d: number } | null = null;
      for (let s: number = from; s <= to; s += 1) {
        const p: Vec3 = AutoMovieLoftChain.point(chain, s, phase) as Vec3;
        const d: number = S.dot(sub(p, heel), normal);
        if (previous !== null && (previous.d < 0) !== (d < 0)) points.push(add(previous.p, scale(sub(p, previous.p), previous.d / (previous.d - d))));
        previous = { s, p, d };
      }
    }
    const flat: [number, number][] = points.map((p: Vec3): [number, number] => [S.dot(sub(p, heel), along), S.dot(sub(p, heel), across)]);
    return { heel, juncture, points, girth: hullPerimeter(flat) };
  }
}

/** Perimeter of the convex hull of planar points (Andrew's monotone chain): the taut tape. */
function hullPerimeter(points: [number, number][]): number {
  if (points.length < 3) return NaN;
  const p: [number, number][] = [...points].sort((a: [number, number], b: [number, number]): number => a[0] - b[0] || a[1] - b[1]);
  const turn: (o: [number, number], a: [number, number], b: [number, number]) => number = (o: [number, number], a: [number, number], b: [number, number]): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half: (list: [number, number][]) => [number, number][] = (list: [number, number][]): [number, number][] => {
    const out: [number, number][] = [];
    for (const q of list) {
      while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, q) <= 0) out.pop();
      out.push(q);
    }
    out.pop();
    return out;
  };
  const hull: [number, number][] = [...half(p), ...half([...p].reverse())];
  let sum: number = 0;
  for (let k: number = 0; k < hull.length; ++k) sum += Math.hypot(hull[(k + 1) % hull.length]![0] - hull[k]![0], hull[(k + 1) % hull.length]![1] - hull[k]![1]);
  return sum;
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}
