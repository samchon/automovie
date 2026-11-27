import type {
  AutoMovieVector3Tuple,
  IAutoMovieLoftChain,
  IAutoMovieLoftSurfaceJet,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieEngineLoftAdmissionError } from "./AutoMovieEngineLoftAdmissionError";
import { AutoMovieEngineLoftCapSource } from "./AutoMovieEngineLoftCapSource";
import { AutoMovieEngineLoftChain } from "./AutoMovieEngineLoftChain";
import { AutoMovieEngineLoftFrame } from "./AutoMovieEngineLoftFrame";
import { AutoMovieEngineLoftJet } from "./AutoMovieEngineLoftJet";
import { AutoMovieEngineLoftSection } from "./AutoMovieEngineLoftSection";
import { AutoMovieEngineSeamStation } from "./AutoMovieEngineSeamStation";
import { AutoMovieEngineSolidVector } from "./AutoMovieEngineSolidVector";

/**
 * A lofted chain read as a solid surface: `u` its station in mm, `v` its phase
 * in radians with period `2 pi`.
 *
 * The derivatives are the actual local generating field's total2 combined with
 * frame/lift/relief product rules (`AutoMovieEngineLoftJet.at`). Qualification
 * requires actual native local2 or complete legacy station/basis2, plus the
 * frame derivatives (`AutoMovieEngineLoftJet.carries`). Missing required physical
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
export namespace AutoMovieEngineSolidChain {
  /**
   * The chain's twin that carries jets, so a host built without them (the
   * trunk's and the neck's horizontal layers, an arm chain not made C2) reads
   * as a solid surface.
   *
   * Each unframed layer takes its own plane, the level plane at its height
   * (`AutoMovieEngineLoftFrame.horizontal`), which is where the chain already draws
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
    if (AutoMovieEngineLoftJet.carries(chain)) return chain;
    const local: boolean = AutoMovieEngineLoftSection.regular(chain);
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
            frame: AutoMovieEngineLoftFrame.horizontal(l.y),
            frameSlopes: { origin: [0, 1, 0], u: [0, 0, 0], v: [0, 0, 0] },
            frameCurvatures: { origin: [0, 0, 0], u: [0, 0, 0], v: [0, 0, 0] },
          }),
        ),
      };
    return AutoMovieEngineSeamStation.continuous({
      ...chain,
      layers: chain.layers.map(
        (l: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer => ({
          ...l,
          frame: l.frame ?? AutoMovieEngineLoftFrame.horizontal(l.y),
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
    if (!AutoMovieEngineLoftJet.carries(chain)) return null;

    // The outward sign at one regular point; a smooth closed tube keeps it
    // everywhere, since its normal never passes through zero.
    const first: number = chain.layers[0]!.y;
    const last: number = chain.layers[chain.layers.length - 1]!.y;
    const domain: [number, number] = AutoMovieEngineLoftCapSource.bounds(chain);
    const middle: number = (first + last) / 2;
    let j: IAutoMovieLoftSurfaceJet;
    try {
      j = AutoMovieEngineLoftJet.at(chain, middle, 0);
    } catch (error: unknown) {
      if (error instanceof AutoMovieEngineLoftAdmissionError) return null;
      throw error;
    }
    const normal: AutoMovieVector3Tuple = AutoMovieEngineSolidVector.cross(j.s, j.t);
    const size: number = Math.hypot(...normal);
    if (!(size > 0)) return null;
    let sign: 1 | -1;
    if (chain.orientation !== undefined) {
      if (chain.orientation !== 1 && chain.orientation !== -1) return null;
      sign = chain.orientation;
    } else {
      const out: AutoMovieVector3Tuple = AutoMovieEngineSolidVector.sub(
        j.p,
        AutoMovieEngineLoftChain.axis(chain, middle),
      );
      const facing: number = AutoMovieEngineSolidVector.dot(normal, out);
      if (!(Math.abs(facing) > 0)) return null;
      sign = facing > 0 !== (chain.mirrored === true) ? 1 : -1;
    }

    return {
      name: chain.name,
      period: 2 * Math.PI,
      domain,
      orientation: sign,
      point: (u: number, v: number): AutoMovieVector3Tuple => {
        if (!(u >= domain[0] && u <= domain[1]))
          throw new AutoMovieEngineLoftAdmissionError(
            "The requested point is outside the loft's owned original domain.",
          );
        return AutoMovieEngineLoftChain.point(chain, u, v);
      },
      jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => {
        if (!(u >= domain[0] && u <= domain[1]))
          throw new AutoMovieEngineLoftAdmissionError(
            "The requested jet is outside the loft's owned original domain.",
          );
        const q: IAutoMovieLoftSurfaceJet = AutoMovieEngineLoftJet.at(chain, u, v);
        return { p: q.p, u: q.s, v: q.t, uu: q.ss, uv: q.st, vv: q.tt };
      },
    };
  }
}
