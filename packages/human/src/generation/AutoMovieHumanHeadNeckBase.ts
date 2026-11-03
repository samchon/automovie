import { AutoMovieHumanPolarSection } from "../lofting/AutoMovieHumanPolarSection";
import { AutoMovieHumanSeam } from "../lofting/AutoMovieHumanSeam";
import { AutoMovieHumanHeadRadius } from "./AutoMovieHumanHeadRadius";
import { AutoMovieHumanHeadSection } from "./AutoMovieHumanHeadSection";
import type { IAutoMovieHumanHeadCompiled } from "./IAutoMovieHumanHeadCompiled";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadSection } from "./IAutoMovieHumanHeadSection";

/**
 * The neck ring's hand-over to the head: its radial difference from the head
 * law, its slope with height and its height off its plane, per side, and the
 * quintic weights that fade them out over the jaw.
 */
export namespace AutoMovieHumanHeadNeckBase {
  /**
   * Weights of the neck ring's difference from the law, of its slope's and of
   * its second derivative's at a station, `[value, run, bend]`: the quintic
   * Hermite span from the ring's own place, slope and curvature to nothing, its
   * run in millimetres so that the jet it leaves the ring with is the ring's
   * own (rule J3 to G2). It reaches the law with level slope and curvature, so
   * the head above it is C2. A cubic span had stepped in curvature where it
   * ended under the chin; a span that left the ring with the law's own
   * curvature stepped there by the neck's curvature less the law's.
   */
  export function neckFade(plan: IAutoMovieHumanHeadLayout, s: number): [number, number, number] {
    const h: number = AutoMovieHumanHeadSection.NECK_FADE * (plan.menton - plan.y0);
    const [value, run, bend] = AutoMovieHumanSeam.quintic(
      [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
      h,
      (s - plan.y0) / h,
    );
    return [value!, run!, bend!];
  }

  /**
   * The neck's radial second derivative with height at its ring, over the
   * law's own there, along the same rays, per side: the neck's from the ring
   * and two under it, the law's from its section at the ring and two over it,
   * each a second difference over the same drop.
   *
   * @param compiled The head's compiled prior.
   * @param plan The head's layout.
   * @param rings The neck's top ring and the two under it, `[x, z]` plans, a drop apart.
   * @param drop The rings' spacing, millimetres.
   * @param sign 1 for the left side, -1 for the right.
   * @returns Per ray, per square millimetre.
   */
  export function neckCurve(
    compiled: IAutoMovieHumanHeadCompiled,
    plan: IAutoMovieHumanHeadLayout,
    rings: readonly [readonly [number, number][], readonly [number, number][], readonly [number, number][]],
    drop: number,
    sign: 1 | -1,
  ): number[] {
    const sections: IAutoMovieHumanHeadSection[] = [0, 1, 2].map(
      (k: number): IAutoMovieHumanHeadSection => AutoMovieHumanHeadSection.section(compiled, plan, plan.y0 + k * drop),
    );
    const ox: number = (sections[0]!.front + sections[0]!.back) / 2;
    const out: number[] = [];
    for (let j: number = 0; j <= AutoMovieHumanHeadSection.ANGLES; j++) {
      const theta: number = (Math.PI * j) / AutoMovieHumanHeadSection.ANGLES;
      const ray: number = Math.min(Math.PI - OFF_VERTEX, Math.max(OFF_VERTEX, theta));
      const [a, b, c]: number[] = rings.map((ring: readonly [number, number][]): number => AutoMovieHumanPolarSection.radius(ring, [ox, 0], sign * ray));
      const [p, q, r]: number[] = sections.map((m: IAutoMovieHumanHeadSection): number => AutoMovieHumanHeadRadius.radius(m, ox, theta));
      out.push((a! - 2 * b! + c! - (p! - 2 * q! + r!)) / (drop * drop));
    }
    return out;
  }

  /** The neck ring's polar difference from the law, per side. */
  export function neckDelta(
    compiled: IAutoMovieHumanHeadCompiled,
    plan: IAutoMovieHumanHeadLayout,
    ring: readonly [number, number][],
    sign: 1 | -1,
  ): number[] {
    const m: IAutoMovieHumanHeadSection = AutoMovieHumanHeadSection.section(compiled, plan, plan.y0);
    const ox: number = (m.front + m.back) / 2;
    const out: number[] = [];
    for (let j: number = 0; j <= AutoMovieHumanHeadSection.ANGLES; j++) {
      const theta: number = (Math.PI * j) / AutoMovieHumanHeadSection.ANGLES;
      const r: number = AutoMovieHumanHeadRadius.radius(m, ox, theta);

      // The midline's rays pass exactly through the ring's vertices there, and
      // rounding can drop that crossing from both edges beside it. The ray then
      // meets nothing and the point falls to the polar origin: on one person
      // that was a slit 38 mm deep up the front of the neck.
      const ray: number = Math.min(Math.PI - OFF_VERTEX, Math.max(OFF_VERTEX, theta));
      out.push(AutoMovieHumanPolarSection.radius(ring, [ox, 0], sign * ray) - r);
    }
    return out;
  }

  /**
   * The neck's radial slope with height at its ring, over the law's own there,
   * along the same rays, per side: from the ring and one just under it.
   */
  export function neckSlope(
    compiled: IAutoMovieHumanHeadCompiled,
    plan: IAutoMovieHumanHeadLayout,
    ring: readonly [number, number][],
    under: readonly [number, number][],
    drop: number,
    sign: 1 | -1,
  ): number[] {
    const m: IAutoMovieHumanHeadSection = AutoMovieHumanHeadSection.section(compiled, plan, plan.y0);
    const up: IAutoMovieHumanHeadSection = AutoMovieHumanHeadSection.section(compiled, plan, plan.y0 + drop);
    const ox: number = (m.front + m.back) / 2;
    const out: number[] = [];
    for (let j: number = 0; j <= AutoMovieHumanHeadSection.ANGLES; j++) {
      const theta: number = (Math.PI * j) / AutoMovieHumanHeadSection.ANGLES;
      const ray: number = Math.min(Math.PI - OFF_VERTEX, Math.max(OFF_VERTEX, theta));
      const neck: number =
        AutoMovieHumanPolarSection.radius(ring, [ox, 0], sign * ray) -
        AutoMovieHumanPolarSection.radius(under, [ox, 0], sign * ray);
      const law: number = AutoMovieHumanHeadRadius.radius(up, ox, theta) - AutoMovieHumanHeadRadius.radius(m, ox, theta);
      out.push((neck - law) / drop);
    }
    return out;
  }

  /** The neck ring's height off its plane along the same rays, per side. */
  export function neckRise(
    compiled: IAutoMovieHumanHeadCompiled,
    plan: IAutoMovieHumanHeadLayout,
    ring: readonly Vec3[],
    sign: 1 | -1,
  ): number[] {
    const m: IAutoMovieHumanHeadSection = AutoMovieHumanHeadSection.section(compiled, plan, plan.y0);
    const ox: number = (m.front + m.back) / 2;
    const out: number[] = [];
    for (let j: number = 0; j <= AutoMovieHumanHeadSection.ANGLES; j++) {
      const theta: number = (sign * Math.PI * j) / AutoMovieHumanHeadSection.ANGLES;
      let best: Vec3 = ring[0]!;
      let gap: number = Infinity;
      for (const p of ring) {
        const a: number = Math.atan2(p[2], p[0] - ox) - theta;
        const d: number = Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
        if (d < gap) {
          gap = d;
          best = p;
        }
      }
      out.push(best[1] - plan.y0);
    }
    return out;
  }

  /** Angle a ray keeps off the midline, radians: far under a ring's spacing. */
  export const OFF_VERTEX: number = 1e-6;

  /** Height under the neck's top ring its slope is read over, millimetres. */
  export const NECK_STEP: number = 2;
}

/** A point. */
type Vec3 = [number, number, number];
