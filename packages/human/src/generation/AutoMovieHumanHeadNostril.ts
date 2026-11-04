import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import { AutoMovieHumanHeadNoseBase } from "./AutoMovieHumanHeadNoseBase";
import { AutoMovieHumanHeadSkinReading } from "./AutoMovieHumanHeadSkinReading";
import type { IAutoMovieHumanHeadSurface } from "./IAutoMovieHumanHeadSurface";

/**
 * One nostril: a teardrop laid in the nose's base, its length running from
 * beside the tip back and out toward the alar base, facing as the base does,
 * down and a little forward; the right one the reflection of the left.
 */
export namespace AutoMovieHumanHeadNostril {
  /**
   * One nostril: a teardrop laid in the nose's base, its length running from
   * beside the tip back and out toward the alar base, where it is widest, with
   * the columella left between the two. It faces as the base does, down and a
   * little forward.
   */
  export function nostril(surface: IAutoMovieHumanHeadSurface, sign: 1 | -1): IAutoMovieHumanLoftAperture {
    const { plan, compiled } = surface;
    const f: AutoMovieHumanHeadPrior.IFace = compiled.prior.face;
    const w: number = plan.noseWidth;
    const order: number = 3;
    const count: number = 24;
    const sweep: number = (f.nostrilSweep * Math.PI) / 180;
    const lead: number = f.nostrilCentre[0]! * plan.noseLead;
    const out: number = f.nostrilCentre[1]! * w;
    const rise: number = Math.tan(plan.columella);
    const points: Vec3[] = Array.from(
      { length: count },
      (_: unknown, i: number): Vec3 => {
        // The right nostril is the left's reflection, its phase run backward.
        const t: number = (sign * 2 * Math.PI * i) / count;
        const along: number = f.nostrilSize[0]! * w * Math.cos(t);
        const across: number =
          f.nostrilSize[1]! * w * Math.sin(t) * (1 + f.nostrilTear * Math.cos(t));
        // In the base: forward from the face and out from the midline.
        const d: number = lead - along * Math.cos(sweep) + across * Math.sin(sweep);
        const z: number = out + along * Math.sin(sweep) + across * Math.cos(sweep);
        const y: number = AutoMovieHumanHeadNoseBase.line(plan, f, z)[0] + d * rise;
        return [AutoMovieHumanHeadSkinReading.frontAt(surface, y, sign * z), y, sign * z];
      },
    );
    const coefficients: number[] = [0, 1, 2].flatMap((c: number): number[] => {
      const out: number[] = [
        points.reduce((v: number, p: Vec3): number => v + p[c]!, 0) / count,
      ];
      for (let k: number = 1; k <= order; k++) {
        let a: number = 0;
        let b: number = 0;
        points.forEach((p: Vec3, i: number): void => {
          const t: number = (2 * Math.PI * k * i) / count;
          a += (2 * p[c]! * Math.cos(t)) / count;
          b += (2 * p[c]! * Math.sin(t)) / count;
        });
        out.push(a, b);
      }
      return out;
    });
    return {
      name: sign > 0 ? "nostril.left" : "nostril.right",
      order,
      coefficients,
      forward: facing(points),
      depth: 2,
      pocket: 8.8 * plan.scale,
    };
  }
}

/** Unit normal of a small closed loop on the skin, facing forward or down. */
function facing(loop: readonly Vec3[]): Vec3 {
  const n: number = loop.length;
  const across: Vec3 = AutoMovieHumanHeadMath.sub(loop[0]!, loop[n >> 1]!);
  const along: Vec3 = AutoMovieHumanHeadMath.sub(loop[n >> 2]!, loop[(3 * n) >> 2]!);
  const c: Vec3 = [
    across[1] * along[2] - across[2] * along[1],
    across[2] * along[0] - across[0] * along[2],
    across[0] * along[1] - across[1] * along[0],
  ];
  const l: number = Math.hypot(c[0], c[1], c[2]) || 1;
  const s: number = c[0] - c[1] >= 0 ? 1 / l : -1 / l;
  return [s * c[0], s * c[1], s * c[2]];
}

/** A point. */
type Vec3 = [number, number, number];
