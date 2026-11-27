import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanDigitLine,
} from "@automovie/interface";

/**
 * A digit's centre line on its bones: straight legs, one per bone, from a
 * start point, each turning onto the next at its joint over the elbow's rule
 * (`docs/generalization.md`, Arm and hand): the heading blends from one leg's
 * direction to the next by a smoothstep over a half length of the joint's
 * turn, so the line keeps every leg's length along its arc and the
 * straightened digit reaches its full length. The joints are the centres the
 * rig turns about, at the legs' ends along the arc.
 *
 * Fingers and thumb share it: a finger's legs are its three phalanges from
 * its knuckle; the thumb's lead with the stretch of its metacarpal from its
 * root at the web to its MCP, then its two phalanges.
 */
export namespace AutoMovieHumanDigitLine {
  /**
   * Build a line.
   *
   * @param start First point.
   * @param legs Bones from the start, at least one.
   * @param step Spacing of the integrated points, mm.
   */
  export function build(
    start: AutoMovieVector3Tuple,
    legs: readonly IAutoMovieHumanDigitLine.ILeg[],
    step: number,
  ): IAutoMovieHumanDigitLine.ILine {
    if (legs.length === 0) throw new Error("A digit line needs a leg");
    const joints: number[] = [];
    let total: number = 0;
    for (const leg of legs) {
      if (!(leg.length > 0))
        throw new Error(
          `A digit's leg needs a positive length, not ${leg.length}`,
        );
      total += leg.length;
      joints.push(total);
    }
    const heading = (s: number): AutoMovieVector3Tuple => {
      let d: AutoMovieVector3Tuple = legs[0]!.direction;
      for (let i: number = 0; i + 1 < legs.length; i++) {
        const soft: number = Math.max(1e-6, legs[i]!.turn);
        const w: number = smooth((s - joints[i]! + soft) / (2 * soft));
        const next: AutoMovieVector3Tuple = legs[i + 1]!.direction;
        const prev: AutoMovieVector3Tuple = legs[i]!.direction;
        d = [
          d[0] + w * (next[0] - prev[0]),
          d[1] + w * (next[1] - prev[1]),
          d[2] + w * (next[2] - prev[2]),
        ];
      }
      return unit(d);
    };
    const count: number = Math.max(8, Math.ceil(total / step));
    const h: number = total / count;
    const points: AutoMovieVector3Tuple[] = [start];
    for (let k: number = 1; k <= count; k++) {
      const d: AutoMovieVector3Tuple = heading((k - 0.5) * h);
      const p: AutoMovieVector3Tuple = points[k - 1]!;
      points.push([p[0] + h * d[0], p[1] + h * d[1], p[2] + h * d[2]]);
    }
    const at = (s: number): AutoMovieVector3Tuple => {
      const x: number = Math.min(count, Math.max(0, s / h));
      const k: number = Math.min(count - 1, Math.floor(x));
      const a: AutoMovieVector3Tuple = points[k]!;
      const b: AutoMovieVector3Tuple = points[k + 1]!;
      const f: number = x - k;
      return [
        a[0] + f * (b[0] - a[0]),
        a[1] + f * (b[1] - a[1]),
        a[2] + f * (b[2] - a[2]),
      ];
    };
    const tangent = (s: number): AutoMovieVector3Tuple => {
      const a: AutoMovieVector3Tuple = at(Math.max(0, s - TANGENT));
      const b: AutoMovieVector3Tuple = at(Math.min(total, s + TANGENT));
      return unit([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
    };
    return { points, step: h, length: total, joints, at, tangent };
  }
}

/*
 * Unit vector; zero stays zero.
 */
function unit(a: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
  const l: number = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

/*
 * Smoothstep clamped to [0, 1].
 */
function smooth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

/*
 * Half step of a tangent read on the line, mm.
 */
const TANGENT: number = 0.2;
