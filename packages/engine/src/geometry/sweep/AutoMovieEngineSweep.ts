import { sampleAutoMovieSurfaceNetwork as sampleAutoMovieSurfaceNetworkImplementation } from "./internal/sampleAutoMovieSurfaceNetwork";
import { sampleAutoMovieSweepSection as sampleAutoMovieSweepSectionImplementation } from "./internal/sampleAutoMovieSweepSection";

import { sampleAutoMovieParameterSweep as sampleAutoMovieParameterSweepImplementation } from "./internal/sampleAutoMovieParameterSweep";

import { type IAutoMovieSweep, type IAutoMovieCompileSweepGuideOutput, type IAutoMoviePlanSurfaceRigPatchesOutput, type IAutoMoviePlanSurfaceRigPatches, type IAutoMovieSurfaceConstruction, type IAutoMoviePrepareSurfaceConstruction, type IAutoMoviePreserveSweepVolume, type IAutoMovieSampleParameterSweep, type IAutoMovieSurfaceCage, type IAutoMovieSampleSurfaceNetwork, type IAutoMovieSampleSweepSection } from "@automovie/interface";
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

  /**
   * Register a fixed-cell Cartesian section average for parameter correspondence.
   *
   * Parameter correspondence pairs the curve parameter, so an off-axis, concave
   * section or an authored origin cannot be reconstructed from a polar radius.
   * The tensor trapezoid first averages the unscaled two-dimensional shape over
   * v, then its scaled points over u, in the centre frame just as the radial
   * writer does. The u-dependent scale belongs inside that second average.
   * Direction-correspondence radius averaging remains with rigAutoMovieSweep.
   *
   * Each signed coordinate is normalized by its largest magnitude before the
   * weighted sum. This avoids overflow in the sum and preserves an ordinary
   * positive subnormal constant. A genuine cancelling mean may be the origin;
   * only a nonzero normalized result lost in multiplication is refused. Scale
   * products, positive weights and world coordinates are admitted before output
   * publication. A rejected write leaves the caller's output buffer unchanged.
   *
   * @param props The compiled unscaled surface, fixed footprint and live rig
   *   views
   * @returns The allocation-free writer in model metres
   * @throws Error for nonfinite source coordinates, invalid or unrepresentable
   *   cell reaches/weights, scale products, signed means or world coordinates;
   *   write failures preserve the output buffer.
   */
  export function sampleParameterSweep(props: IAutoMovieSampleParameterSweep.IProps): (out: Float64Array, offset: number) => void {
    return sampleAutoMovieParameterSweepImplementation(props);
  }

  /**
   * Sample a surface network into a quad control cage at one tier.
   *
   * This is the rest cage of `rigAutoMovieSurfaceNetwork` without bindings, which
   * states every fill rule, the welding identity, the topology guarantee, the
   * limit fit and which vertices it holds, the UV default and every refusal. A
   * caller that poses the network every frame compiles the rig once and calls its
   * `pose` instead of sampling a posed network again.
   *
   * @param props.network The network, only read.
   * @param props.tier The tier to sample.
   * @param props.fit Whether to fit controls to the limit surface; omitted, true.
   * @returns The cage, its targets, coordinates, patch grids and rings.
   * @throws Error as `rigAutoMovieSurfaceNetwork` documents.
   */
  export function sampleSurfaceNetwork(props: IAutoMovieSampleSurfaceNetwork.IProps): IAutoMovieSurfaceCage {
    return sampleAutoMovieSurfaceNetworkImplementation(props);
  }

  /**
   * Sample a section's radius from its origin at evenly spaced polar angles.
   *
   * Radius `k` lies along angle `2 pi k / count`, measured counterclockwise from
   * the section plane's `+x` axis. A radial section is read through its periodic
   * spline, `interpolateAutoMovieSpline`. A superellipse centred on its origin is
   * read in closed form: in the quadrant holding the angle, with that quadrant's
   * half-axes `a` along `x` and `b` along `y` and exponent `n`, the curve is `|x
   * / a|^n + |y / b|^n = 1`, so the radius is `(|cos a / a|^n + |sin a /
   * b|^n)^(-1/n)`, and it is star-shaped and counterclockwise by construction.
   * Any other curve is first walked at 64 points per segment (at least 1,024) to
   * bracket each angle between two curve parameters, then the parameter is
   * bisected forty times against the curve's own polar angle, so the radius lies
   * on the exact curve rather than on a chord.
   *
   * The walk checks the sampled curve for star-shapedness about its origin and
   * winding counterclockwise: the polar angle must strictly increase between
   * successive points and turn once in total, or the curve is refused, because
   * the sampled walk would not pair its points by direction. This finite walk
   * does not certify monotone polar angle between probes.
   *
   * @param props.section The section, only read.
   * @param props.count Number of angles, an integer of at least 3.
   * @returns Radii in metres, one per angle, all positive.
   * @throws Error when the count is not an integer of at least 3, the section's
   *   numbers are not finite or out of range, or the curve passes through its
   *   origin, winds clockwise or is not star-shaped about it.
   */
  export function sampleSweepSection(props: IAutoMovieSampleSweepSection.IProps): number[] {
    return sampleAutoMovieSweepSectionImplementation(props);
  }
}
