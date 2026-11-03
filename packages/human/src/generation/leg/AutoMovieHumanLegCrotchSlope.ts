import type { AutoMovieHumanLegCrotchFillet } from "./AutoMovieHumanLegCrotchFillet";
import type { AutoMovieHumanLegCrotchRoot } from "./AutoMovieHumanLegCrotchRoot";
import { AutoMovieHumanLegSampling } from "./AutoMovieHumanLegSampling";
import { AutoMovieHumanLegVector } from "./AutoMovieHumanLegVector";

type Vec3 = AutoMovieHumanLegVector.Vec3;
const { dot, normalize, scale, smooth, sub } = AutoMovieHumanLegVector;

/**
 * The trunk's outward slope at the crotch ring, carried into the leg.
 *
 * Each point of the ring leaves it with the trunk's outward slope there, by a
 * quintic `x - 6x^3 + 8x^4 - 3x^5` that meets the leg's own surface with
 * neither place, slope nor curvature, over the longest reach that keeps its
 * lump within the event join's bound. The two chains therefore share one
 * tangent plane on the open arc by construction, and the join has nothing left
 * to bend there. Within a taper of each pinch the trunk's slope is its fold
 * opening, which a rounded corner cannot share, so it fades there, read over
 * the taper's length of ring so the fade turns no section.
 */
export namespace AutoMovieHumanLegCrotchSlope {
  /** The slope at each phase and the reach into the leg that carries it. */
  export interface IReading {
    /** The trunk's outward slope at each of the leg's phases, per mm down. */
    slopes: number[];

    /** Reach of each phase's slope into the leg, mm. */
    spans: number[];
  }

  /** Largest lump the trunk's slope may raise off the leg's own surface, as the event join's, mm. */
  export const BULGE: number = 4;

  /** Arc length from a pinch over which the trunk's slope comes in, as the event join's, mm. */
  export const TAPER: number = 6;

  /** Highest point of the quintic `x - 6x^3 + 8x^4 - 3x^5`, at a third. */
  export const HUMP: number = 16 / 81;

  /** Least cosine between a ring's ray and its normal a slope is carried along. */
  export const FACING: number = 0.3;

  /**
   * The slope and reach at each of the ring's phases.
   *
   * @param ring The ring at depth 0, with its normals, rates and pinch distances.
   * @param reach The longest reach under the ring over which the leg hands over to it, mm.
   */
  export function of(ring: AutoMovieHumanLegCrotchFillet.ILoop, reach: number): IReading {
    const order: number = AutoMovieHumanLegSampling.ORDER;

    // The trunk's outward slope at each phase. Near a pinch it is the fold
    // opening, which the leg's rounded corner does not share; it fades there
    // over the join's taper.
    const raw: number[] = ring.rates.map(
      (rate: Vec3, m: number): number => (smooth(ring.edges[m]! / TAPER) * dot(rate, ring.normals[m]!)) / rate[1],
    );

    // Each phase's reach is the longest whose lump stays within the bound, for
    // the steepest slope near it, read over the ring's own length so that the
    // reach changes along the ring no faster than the slopes do.
    const points: Vec3[] = ring.points;
    const along: number[] = [0];
    for (let m: number = 1; m <= order; m++) along.push(along[m - 1]! + AutoMovieHumanLegVector.norm(sub(points[m % order]!, points[m - 1]!)));
    const whole: number = along[order]!;
    const apart = (a: number, b: number): number => {
      const d: number = Math.abs(along[a]! - along[b]!);
      return Math.min(d, whole - d);
    };

    // The fade at a pinch is as fast as the join's, a few of the leg's
    // controls; carried into the skin it would turn the ring there, so the
    // slopes are read over a taper's length of ring, which leaves the open arc
    // as it is and widens only the fade.
    const slopes: number[] = points.map((_: Vec3, m: number): number => {
      let weight: number = 0;
      let sum: number = 0;
      for (let k: number = 0; k < order; k++) {
        const d: number = apart(m, k);
        if (d > 3 * TAPER) continue;
        const w: number = Math.exp(-((d / TAPER) ** 2) / 2);
        weight += w;
        sum += w * raw[k]!;
      }
      return sum / weight;
    });
    const steepest: number[] = points.map((_: Vec3, m: number): number => {
      let most: number = 0;
      for (let k: number = 0; k < order; k++) if (apart(m, k) <= 2 * TAPER) most = Math.max(most, Math.abs(slopes[k]!));
      return most;
    });
    const spans: number[] = points.map((_: Vec3, m: number): number => {
      let weight: number = 0;
      let sum: number = 0;
      for (let k: number = 0; k < order; k++) {
        const d: number = apart(m, k);
        if (d > 3 * TAPER) continue;
        const w: number = Math.exp(-((d / TAPER) ** 2) / 2);
        weight += w;
        sum += w * steepest[k]!;
      }
      return 1 / (1 / reach + (HUMP * (sum / weight)) / BULGE);
    });
    return { slopes, spans };
  }

  /**
   * The skin's move at a phase and a depth: along the ring's own ray, by what
   * moves it along its normal as far.
   *
   * @param root The crotch ring the leg takes.
   * @param m Index of the leg's phase.
   * @param depth Depth under the ring, mm.
   */
  export function carry(root: AutoMovieHumanLegCrotchRoot.IRoot, m: number, depth: number): Vec3 {
    const at: Vec3 = root.ring.points[m]!;
    const normal: Vec3 = root.ring.normals[m]!;
    const slope: number = root.slopes[m]!;
    const span: number = root.spans[m]!;
    const x: number = Math.min(1, depth / span);
    const ray: Vec3 = normalize([at[0] - root.centre[0], 0, at[2] - root.centre[1]]);
    const facing: number = Math.max(FACING, dot(ray, normal));
    const lever: number = x - 6 * x ** 3 + 8 * x ** 4 - 3 * x ** 5;
    return scale(ray, (-slope * span * lever) / facing);
  }
}
