import type {
  AutoMovieVector3Tuple,
  IAutoMovieLoftChain,
  IAutoMovieLoftSurfaceJet,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieLoftCapRead } from "./AutoMovieLoftCapRead";
import { AutoMovieLoftCapSource } from "./AutoMovieLoftCapSource";
import { AutoMovieLoftChain } from "./AutoMovieLoftChain";
import { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieLoftJet } from "./AutoMovieLoftJet";
import { AutoMovieLoftPoint } from "./AutoMovieLoftPoint";
import { AutoMovieLoftSection } from "./AutoMovieLoftSection";
import { AutoMovieSeamStation } from "./AutoMovieSeamStation";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

/**
 * A lofted chain read as a solid surface: `u` its station in mm, `v` its phase
 * in radians with period `2 pi`.
 *
 * The derivatives are the actual local generating field's total2 combined with
 * frame/lift/relief product rules (`AutoMovieLoftJet.at`). Qualification
 * requires actual native local2 or complete legacy station/basis2, plus the
 * frame derivatives (`AutoMovieLoftJet.carries`). Missing required physical
 * derivatives refuse the surface rather than turning a finite Point0 into a
 * different curve. An unframed layer's exact horizontal frame may be supplied
 * without changing its original scalar owner or compatibility binding.
 *
 * The producer's explicit orientation is authoritative, including an annulus
 * whose storage origin is not an interior tube axis. Without it, the middle
 * station at phase 0 compares `S_u x S_v` with the section's radial direction,
 * and `mirrored` turns that inferred tube side. Either path requires a finite
 * regular 2-jet at this anchor; this local check does not certify the entire
 * chain against folds or nonfinite values elsewhere.
 */
export namespace AutoMovieSolidChain {
  /**
   * The chain's twin that carries jets, so a host built without them (the
   * trunk's and the neck's horizontal layers, an arm chain not made C2) reads
   * as a solid surface.
   *
   * Each unframed layer takes its own plane, the level plane at its height
   * (`AutoMovieLoftFrame.horizontal`), which is where the chain already draws
   * it. A chain whose layers all carry their coefficients' curvatures and are
   * all unframed keeps every coefficient jet, and its planes take their exact
   * station derivatives (the origin rising 1 mm per mm, the axes fixed), so the
   * twin is the same surface. Native local2 also permits that exact frame
   * supply without projection curvatures. Otherwise the source-aware
   * coordinator prepares ordinary fields by their natural spline, preserving
   * native compatibility rows, complete endpoint owners and actual frame
   * sources. This may declare ordinary between-layer interpolation, but never
   * substitutes another local field for an unavailable native physical
   * derivative.
   *
   * @param chain The chain; never modified.
   * @returns The twin; an unavailable actual-source boundary jet still prevents
   *   regular surface admission.
   */
  export function framed(chain: IAutoMovieLoftChain): IAutoMovieLoftChain {
    if (AutoMovieLoftJet.carries(chain)) return chain;
    const local: boolean = AutoMovieLoftSection.regular(chain);
    const exact: boolean = chain.layers.every(
      (l: IAutoMovieLoftChain.ILayer): boolean =>
        l.frame === undefined && (local || l.curvatures !== undefined),
    );
    if (exact)
      return {
        ...chain,
        layers: chain.layers.map(
          (l: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer => ({
            ...l,
            frame: AutoMovieLoftFrame.horizontal(l.y),
            frameSlopes: { origin: [0, 1, 0], u: [0, 0, 0], v: [0, 0, 0] },
            frameCurvatures: { origin: [0, 0, 0], u: [0, 0, 0], v: [0, 0, 0] },
          }),
        ),
      };
    return AutoMovieSeamStation.continuous({
      ...chain,
      layers: chain.layers.map(
        (l: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer => ({
          ...l,
          frame: l.frame ?? AutoMovieLoftFrame.horizontal(l.y),
        }),
      ),
    });
  }

  /**
   * The chain as a solid surface, or null without carried jets, a valid
   * explicit sign and a finite regular middle anchor. Without an explicit sign,
   * the radial direction must additionally give a finite nonzero facing.
   * Explicit unavailable-jet and pure numeric admission failures return null;
   * malformed source ownership and actual callback errors still propagate.
   *
   * @param chain The chain; never modified, and the surface keeps reading it.
   * @returns The surface.
   */
  export function surface(
    chain: IAutoMovieLoftChain,
  ): IAutoMovieSolidSurface | null {
    if (!AutoMovieLoftJet.carries(chain)) return null;

    // The outward sign at one regular point; a smooth closed tube keeps it
    // everywhere, since its normal never passes through zero.
    const first: number = chain.layers[0]!.y;
    const last: number = chain.layers[chain.layers.length - 1]!.y;
    const ownership: ReturnType<typeof AutoMovieLoftCapSource.prepare> =
      AutoMovieLoftCapSource.prepare(chain);
    const domain: [number, number] = ownership.domain;
    const caps: ReturnType<typeof AutoMovieLoftCapRead.prepare> =
      AutoMovieLoftCapRead.prepare(chain, ownership);
    const sections: ReturnType<typeof AutoMovieLoftSection.prepare> =
      AutoMovieLoftSection.prepare(chain);
    const points: ReturnType<typeof AutoMovieLoftPoint.prepare> =
      AutoMovieLoftPoint.prepare(chain, sections, caps);
    const jets: ReturnType<typeof AutoMovieLoftJet.prepare> =
      AutoMovieLoftJet.prepare(chain, sections, caps);
    const middle: number = (first + last) / 2;
    let j: IAutoMovieLoftSurfaceJet;
    try {
      j = jets(middle)(0);
    } catch (error: unknown) {
      if (error instanceof AutoMovieLoftAdmissionError) return null;
      throw error;
    }
    if (
      ![j.p, j.s, j.t, j.ss, j.st, j.tt].every(
        (v: readonly number[]): boolean => v.every(Number.isFinite),
      )
    )
      return null;
    const normal: AutoMovieVector3Tuple = AutoMovieSolidVector.cross(j.s, j.t);
    const size: number = Math.hypot(...normal);
    if (!(Number.isFinite(size) && size > 0)) return null;
    let sign: 1 | -1;
    if (chain.orientation !== undefined) {
      if (chain.orientation !== 1 && chain.orientation !== -1) return null;
      sign = chain.orientation;
    } else {
      const out: AutoMovieVector3Tuple = AutoMovieSolidVector.sub(
        j.p,
        AutoMovieLoftChain.axis(chain, middle),
      );
      const facing: number = AutoMovieSolidVector.dot(normal, out);
      if (!(Number.isFinite(facing) && Math.abs(facing) > 0)) return null;
      sign = facing > 0 !== (chain.mirrored === true) ? 1 : -1;
    }

    /** The chart owns finite queries only inside the original station range. */
    const admit = (u: number, kind: "point" | "jet", v: number = 0): void => {
      if (
        !(
          Number.isFinite(u) &&
          Number.isFinite(v) &&
          u >= domain[0] &&
          u <= domain[1]
        )
      )
        throw new AutoMovieLoftAdmissionError(
          `The requested ${kind} is outside the loft's owned original domain.`,
        );
    };
    const pointAt: NonNullable<IAutoMovieSolidSurface["pointAt"]> = (u) => {
      admit(u, "point");
      const point: ReturnType<typeof points> = points(u);
      return (v: number): AutoMovieVector3Tuple => {
        admit(u, "point", v);
        return point(v);
      };
    };
    const jetAt: NonNullable<IAutoMovieSolidSurface["jetAt"]> = (u) => {
      admit(u, "jet");
      const jet: ReturnType<typeof jets> = jets(u, true);
      return (v: number): IAutoMovieSolidSurface.IJet => {
        admit(u, "jet", v);
        const q: IAutoMovieLoftSurfaceJet = jet(v);
        return { p: q.p, u: q.s, v: q.t, uu: q.ss, uv: q.st, vv: q.tt };
      };
    };
    return {
      name: chain.name,
      period: 2 * Math.PI,
      domain,
      orientation: sign,
      point: (u: number, v: number): AutoMovieVector3Tuple => {
        admit(u, "point", v);
        return points(u)(v);
      },
      jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => {
        admit(u, "jet", v);
        const q: IAutoMovieLoftSurfaceJet = jets(u)(v);
        return { p: q.p, u: q.s, v: q.t, uu: q.ss, uv: q.st, vv: q.tt };
      },
      pointAt,
      jetAt,
    };
  }
}
