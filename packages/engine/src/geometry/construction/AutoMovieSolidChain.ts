import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieLoftCapSource } from "./AutoMovieLoftCapSource";
import { AutoMovieLoftChain } from "./AutoMovieLoftChain";
import { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieLoftJet } from "./AutoMovieLoftJet";
import { AutoMovieLoftSection } from "./AutoMovieLoftSection";
import { AutoMovieSeamStation } from "./AutoMovieSeamStation";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * A lofted chain read as a solid surface: `u` its station in mm, `v` its phase
 * in radians with period `2 pi`.
 *
 * The derivatives are the actual local generating field's total2 combined
 * with frame/lift/relief product rules (`AutoMovieLoftJet.at`). Qualification
 * requires actual native local2 or complete legacy station/basis2, plus the
 * frame derivatives (`AutoMovieLoftJet.carries`). Missing required physical
 * derivatives refuse the surface rather than turning a finite Point0 into a
 * different curve. An unframed layer's exact horizontal frame may be supplied
 * without changing its original scalar owner or compatibility binding.
 *
 * The producer's explicit orientation is authoritative, including an
 * annulus whose storage origin is not an interior tube axis. Without it,
 * the middle station at phase 0 compares `S_u x S_v` with the section's
 * radial direction, and `mirrored` turns that inferred tube side. Either
 * path requires a finite regular 2-jet at this anchor; this local check does
 * not certify the entire chain against folds or nonfinite values elsewhere.
 *
 * @evidence contracts/common.md#principled-implementation A lofted chain becomes a solid surface with station as `u` and phase as `v`, its jets the chain's own and its outward sign read once on a regular point.
 * @evidence contracts/common.md#clear-and-simple-design Two functions: the framed twin of a chain and its surface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Outside actual owned bounds the reader fails before evaluating; retained original caps use their actual source and no Cartesian Taylor value with inconsistent phase derivatives is supplied.
 * @evidence contracts/common.md#meaningful-documentation States the chart, orientation and actual-domain policy; finite tip Point0 is separate from unavailable physical2.
 * @evidence contracts/performance.md#efficient-algorithms One chain jet evaluation per surface jet.
 * @evidence contracts/performance.md#reuse-equivalent-work A chain that already carries its jets is returned as it is by `framed`.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The surface keeps a reference to the chain and nothing else.
 */
export namespace AutoMovieSolidChain {
  /**
   * The chain's twin that carries jets, so a host built without them (the
   * trunk's and the neck's horizontal layers, an arm chain not made C2) reads
   * as a solid surface.
   *
   * Each unframed layer takes its own plane, the level plane at its height
   * (`AutoMovieLoftFrame.horizontal`), which is where the chain already
   * draws it. A chain whose layers all carry their coefficients' curvatures
   * and are all unframed keeps every coefficient jet, and its planes take
   * their exact station derivatives (the origin rising 1 mm per mm, the axes
   * fixed), so the twin is the same surface. Native local2 also permits that
   * exact frame supply without projection curvatures. Otherwise the source-aware
   * coordinator prepares ordinary fields by their natural spline, preserving
   * native compatibility rows, complete endpoint owners and actual frame sources.
   * This may declare ordinary between-layer interpolation, but never substitutes
   * another local field for an unavailable native physical derivative.
   *
   * @param chain The chain; never modified.
   * @returns The twin; an unavailable actual-source boundary jet still prevents regular surface admission.
   *
   * @evidence contracts/common.md#principled-implementation Keeps carried jets, supplies exact horizontal frame2 to actual local2 or complete legacy rows, or prepares ordinary fields through the source-aware coordinator without replacing native scalar/endpoint ownership.
   * @evidence contracts/common.md#clear-and-simple-design One adapter preserves the chain definition before surface admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not respline an explicit source into another geometry or fabricate an unavailable source boundary 2-jet; final surface admission can still fail.
   * @evidence contracts/common.md#meaningful-documentation States borrowed input, new-layer ownership and regular-jet premises; the existing surviving-layer domain remains unchanged.
   * @evidence contracts/performance.md#efficient-algorithms Admission uses Section.regular's source-status/binary binding lookup and O(L*S) law scan plus frame checks; other inputs copy layers and pay only the source-aware coordinator's required ordinary solves/binding/changed-law work.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses already carried/source-owned derivatives and shares unchanged chain data.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the original chain or a caller-owned twin with shared unchanged fields; no additional cache or handle is retained.
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
   * explicit sign and a finite regular middle anchor. Without an explicit
   * sign, the radial direction must additionally give a finite nonzero facing.
   * Explicit unavailable-jet and pure numeric admission failures return null;
   * malformed source ownership and actual callback errors still propagate.
   *
   * @param chain The chain; never modified, and the surface keeps reading it.
   * @returns The surface.
   *
   * @evidence contracts/common.md#principled-implementation Uses the carried analytic 2-jet and a producer-owned outward sign, or the legacy radial tube inference. A finite nonzero chart cross product remains required for either path.
   * @evidence contracts/common.md#clear-and-simple-design One local admission and one actual-domain adapter preserve the chain owner; only an explicit unavailable returned jet or pure numeric admission error becomes null.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An explicit sign cannot admit a collapsed/nonfinite anchor or an invalid sign; no triangle-level reversal or origin-based annulus inference is substituted. Whole-surface regularity remains the producer's premise.
   * @evidence contracts/common.md#meaningful-documentation Gives sign precedence, local finite admission, numeric-null recovery, propagated ownership/callback failures, units and borrowed chain ownership; only validated surviving caps extend regular bounds and tip Point0 does not imply physical2.
   * @evidence contracts/performance.md#efficient-algorithms Section.regular's source-status/clipped binary lookups and O(L*S) law scan plus frame checks, O(K+N) cap binding checks and one anchor jet precede publication; later queries use existing Point/Jet station plans.
   * @evidence contracts/performance.md#reuse-equivalent-work Keeps the original chain and its existing jet station preparation; explicit orientation avoids an unnecessary radial-axis query.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The surface closure retains its chain and scalar bounds/sign; returned jets own their vectors and no new query cache is introduced here.
   */
  export function surface(
    chain: IAutoMovieLoftChain,
  ): IAutoMovieSolidSurface | null {
    if (!AutoMovieLoftJet.carries(chain)) return null;

    // The outward sign at one regular point; a smooth closed tube keeps it
    // everywhere, since its normal never passes through zero.
    const first: number = chain.layers[0]!.y;
    const last: number = chain.layers[chain.layers.length - 1]!.y;
    const domain: [number, number] = AutoMovieLoftCapSource.bounds(chain);
    const middle: number = (first + last) / 2;
    let j: AutoMovieLoftJet.IJet;
    try {
      j = AutoMovieLoftJet.at(chain, middle, 0);
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
    const normal: AutoMovieSolidVector.Vec3 = AutoMovieSolidVector.cross(
      j.s,
      j.t,
    );
    const size: number = Math.hypot(...normal);
    if (!(Number.isFinite(size) && size > 0)) return null;
    let sign: 1 | -1;
    if (chain.orientation !== undefined) {
      if (chain.orientation !== 1 && chain.orientation !== -1) return null;
      sign = chain.orientation;
    } else {
      const out: AutoMovieSolidVector.Vec3 = AutoMovieSolidVector.sub(
        j.p,
        AutoMovieLoftChain.axis(chain, middle),
      );
      const facing: number = AutoMovieSolidVector.dot(normal, out);
      if (!(Number.isFinite(facing) && Math.abs(facing) > 0)) return null;
      sign = facing > 0 !== (chain.mirrored === true) ? 1 : -1;
    }

    return {
      name: chain.name,
      period: 2 * Math.PI,
      domain,
      orientation: sign,
      point: (u: number, v: number): AutoMovieSolidVector.Vec3 => {
        if (
          !(
            Number.isFinite(u) &&
            Number.isFinite(v) &&
            u >= domain[0] &&
            u <= domain[1]
          )
        )
          throw new AutoMovieLoftAdmissionError(
            "The requested point is outside the loft's owned original domain.",
          );
        return AutoMovieLoftChain.point(chain, u, v);
      },
      jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => {
        if (
          !(
            Number.isFinite(u) &&
            Number.isFinite(v) &&
            u >= domain[0] &&
            u <= domain[1]
          )
        )
          throw new AutoMovieLoftAdmissionError(
            "The requested jet is outside the loft's owned original domain.",
          );
        const q: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(chain, u, v);
        return { p: q.p, u: q.s, v: q.t, uu: q.ss, uv: q.st, vv: q.tt };
      },
    };
  }
}
