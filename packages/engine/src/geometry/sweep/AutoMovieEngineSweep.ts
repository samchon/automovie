import { type IAutoMovieSweep, type IAutoMovieCompileSweepGuideOutput, type IAutoMoviePlanSurfaceRigPatchesOutput, type IAutoMoviePlanSurfaceRigPatches, type IAutoMovieSurfaceConstruction, type IAutoMoviePrepareSurfaceConstruction, type IAutoMoviePreserveSweepVolume } from "@automovie/interface";
import { checkAutoMovieSweepFeature as checkAutoMovieSweepFeatureImplementation } from "./internal/checkAutoMovieSweepFeature";
import { compileAutoMovieSweepGuide as compileAutoMovieSweepGuideImplementation } from "./internal/compileAutoMovieSweepGuide";
import { compileAutoMovieSweepProfile as compileAutoMovieSweepProfileImplementation } from "./internal/compileAutoMovieSweepProfile";
import { planAutoMovieSurfaceRigPatches as planAutoMovieSurfaceRigPatchesImplementation } from "./internal/planAutoMovieSurfaceRigPatches";
import { prepareAutoMovieSurfaceConstruction as prepareAutoMovieSurfaceConstructionImplementation } from "./internal/prepareAutoMovieSurfaceConstruction";
import { preserveAutoMovieSweepVolume as preserveAutoMovieSweepVolumeImplementation } from "./internal/preserveAutoMovieSweepVolume";
import { reachAutoMovieSurfaceCell as reachAutoMovieSurfaceCellImplementation } from "./internal/reachAutoMovieSurfaceCell";

/** Public operations for Auto Movie Engine Sweep. */
export namespace AutoMovieEngineSweep {
  /**
   * Refuse a feature whose band or points cannot define a finite sweep
   * displacement.
   *
   * @param f The feature, only read
   * @param index Its index for diagnostics
   * @throws Error for a non-positive width, fewer than two points, out-of-domain
   *   points, mixed value modes or non-finite values
   */
  export function checkSweepFeature(f: IAutoMovieSweep.IFeature, index: number): void {
    checkAutoMovieSweepFeatureImplementation(f, index);
  }

  /**
   * Compile one silhouette guide's angle and positive radius profile.
   *
   * @param guide Authored guide, read without mutation
   * @param index Its index for refusal diagnostics
   * @returns A wrapped angle and compiled positive finite radius query
   * @throws Error for a non-finite angle or an invalid profile or profile query
   */
  export function compileSweepGuide(guide: IAutoMovieSweep.IGuide, index: number): IAutoMovieCompileSweepGuideOutput {
    return compileAutoMovieSweepGuideImplementation(guide, index);
  }

  /**
   * Compile a positive radius or scale profile spanning the sweep's whole spine.
   *
   * The C2 scalar spline permits signed overshoot, even when all knots are
   * positive. Radius and scale consumers require positive finite values, so a
   * queried undershoot or arithmetic overflow is refused without clamping the
   * curve or changing its interpolation.
   *
   * @param entries Positive finite values on increasing knots from u 0 to 1
   * @param what The owning guide or scale's diagnostic name
   * @returns The compiled profile, refusing a non-positive or non-finite query
   *   result
   * @throws Error for a profile that does not span the spine, invalid knot/value
   *   data or an invalid queried result
   */
  export function compileSweepProfile(entries: readonly IAutoMovieSweep.IKnot[], what: string): (u: number) => number {
    return compileAutoMovieSweepProfileImplementation(entries, what);
  }

  /**
   * Lay out the sweep, transition, Coons and bridge blocks of a surface rig,
   * preserving vertex registration order and cell reaches. Bridge sweep probes
   * bind once after registry cell resolution and before sealing, so their normals
   * and axial derivatives use the same geometric field as their loop positions,
   * before control pins.
   *
   * @param props Network, registry and the rig's shared edge/sweep evaluators
   * @returns The checked patch layout and the blend-control vertex indices
   * @throws Error for duplicate names, invalid patch ranges or counts,
   *   incompatible sides or loops, or overlapping patches
   */
  export function planSurfaceRigPatches(props: IAutoMoviePlanSurfaceRigPatches.IProps): IAutoMoviePlanSurfaceRigPatchesOutput {
    return planAutoMovieSurfaceRigPatchesImplementation(props);
  }

  /**
   * Register observation writers while a network rig is still open, then read
   * them after its girth solve and final rest evaluation.
   *
   * Sweep observations use the same zero-cell writer as unsampled sweep nodes;
   * spine observations read the same registered section frame; network curves use
   * the actual tangent-constrained curve rig as patch boundaries, including its
   * resolved geometric endpoint cells. Those curves are not raw zero-cell sweep
   * observations. Feature observations read the compiled field's own smooth
   * domain course. No observation enters the cage registry, changes a sampling
   * cell or adds a vertex.
   *
   * @param props Network, shared rig lookups and optional segment counts
   * @returns A one-use reader producing caller-owned rest polylines; subsequent
   *   reads and requests without counts return an empty array
   * @throws Error for missing, invalid or unknown counts or any sweep/curve
   *   refusal
   */
  export function prepareSurfaceConstruction(props: IAutoMoviePrepareSurfaceConstruction.IProps): () => IAutoMovieSurfaceConstruction[] {
    return prepareAutoMovieSurfaceConstructionImplementation(props);
  }

  /**
   * Compile the volume-settled joint-scale update of a sealed sweep rig.
   *
   * Section moments and the authored sweep's rest-volume target are computed
   * once. Each pose updates the shared orientation first, then this writer
   * settles the joint factor and writes every registered scale slot. The
   * network's separate girth multipliers apply after that settlement, matching
   * the rig's existing ordering; the target is the authored sweep's volume before
   * girth correction.
   *
   * @param props.surface The immutable compiled authored sweep, metre units
   * @param props.orientation Current shared pose frames, updated before this
   *   writer
   * @param props.joints Which authored station indices are joints
   * @param props.scaleU Sealed registered scale parameters along u
   * @param props.girth Shared radial correction factors, refreshed in place by
   *   the owning rig
   * @param props.scales Receives the final scale per registered slot
   * @param props.writeFrame The rig's packed-frame serializer used during
   *   compilation
   * @returns A pose writer that updates the supplied scale buffer in place
   */
  export function preserveSweepVolume(props: IAutoMoviePreserveSweepVolume.IProps): () => void {
    return preserveAutoMovieSweepVolumeImplementation(props);
  }

  /**
   * The spacing a sample gives its cell below and above one axis, infinite where
   * that side is not reached.
   *
   * @param step Signed spacing between adjacent samples
   * @param first Whether this is the first sample
   * @param last Whether this is the last sample
   * @returns Below and above spacing; negative steps reverse the end roles
   */
  export function reachSurfaceCell(step: number, first: boolean, last: boolean): [number, number] {
    return reachAutoMovieSurfaceCellImplementation(step, first, last);
  }
}
