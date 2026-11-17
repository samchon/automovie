import {
  type IAutoMovieHingedArmSwivel,
  type IAutoMovieHingedChainGeometry,
} from "@automovie/interface";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";
import { aimRotation } from "./aimRotation";
import { hingedArmSpan } from "./hingedArmSpan";

/**
 * The geometry of a two-bone chain whose mid joint bends only about its own
 * hinge, as `hingedArmArticulation` poses it: the hinge angles that reach a
 * target's distance (the chain's bend branches, each stopped inside the mid
 * joint's range), and the root rotation that aims the chain at the target
 * and then turns it by a swivel about its own root-to-effector line, which
 * leaves the effector where it is (Tolani, Goswami and Badler 2000). A
 * swivel and a branch name one pose of the chain for any target, so a
 * caller that holds them while the target moves poses the chain exactly as
 * the articulation does, and `read` recovers them from a posed chain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the branches, the aim and swivel, and what a held swivel means.
 * @evidence contracts/development/design.md#principled-representation The swivel parameterisation of Tolani, Goswami and Badler 2000: a hinge angle per branch and a swivel about the root-to-effector line.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Direct branches, pose and read share their geometric helpers with explicit source/target preparation; hingedArmArticulation consumes those actual readers and owns all scoring/search policy.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `aimRotation`; the scoring and the sweep stay with `hingedArmArticulation`.
 */
export namespace hingedArmSwivel {
  /**
   * Swivel resolution of `hingedArmArticulation`'s candidate sweep, in
   * degrees.
   *
   * Every candidate lands the effector on the same point, so the step decides
   * only which of the equally exact poses is chosen, never how close the hand
   * gets. One degree gives 360 candidates per bend branch, and the solve runs
   * once per authored action rather than per frame.
   */
  export const STEP: number = 1;

  /** The golden-section ratio, `(sqrt(5) - 1) / 2`, by which each refinement pass shrinks the swivel bracket. */
  export const GOLDEN: number = (Math.sqrt(5) - 1) / 2;

  /**
   * Golden-section passes refining the swivel inside the two-step bracket
   * around each local minimum of the sweep: the fewest that shrink the
   * bracket, `2 STEP`, by `GOLDEN` a pass to within the joint's tolerance
   * (`ROM_TOLERANCE`), since a swivel turns the chain root's joint by itself
   * and a solver need resolve a joint's angle no finer.
   */
  export const REFINEMENTS: number = Math.ceil(
    Math.log(ROM_TOLERANCE / (2 * STEP)) / Math.log(GOLDEN),
  );

  /** The width the refinement leaves of a swivel's bracket, degrees: the two-step bracket shrunk by `GOLDEN` per pass, the swivel's resolution, within `ROM_TOLERANCE`. */
  export const RESOLUTION: number = 2 * STEP * GOLDEN ** REFINEMENTS;

  /**
   * The chain's bend branches toward its target: the two hinge angles whose
   * span is the target's distance, `phase + acos` first, or the fully
   * extended or folded one outside the span, each stopped at the nearer limit
   * of the range. The fully extended branch is the rest hinge angle, zero,
   * wherever zero's span is the extended span itself in floating point: a
   * limb straight at rest to within rounding of its bones' offsets then
   * stands straight, on either side of a mirrored body alike.
   *
   * @param chain The chain.
   * @returns The branches, in that order, or null for a degenerate chain (`hingedArmArticulation`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order, the stops, the extended branch's rest choice and the null.
   * @evidence contracts/development/implementation.md#principled-implementation The span is an exact sinusoid in the hinge angle, so its two arccos roots are the only hinge angles reaching the distance. Outside the span the extended branch is the sinusoid's maximum; when the rest angle's evaluated span equals the maximum's, every hinge angle between them is a maximum of the computed span, and the fit's own effort tie-break (least clinical articulation) chooses the rest angle among them. Without it a rest offset's rounding residue (2e-16 radian on the average man's arms) chose the bend's sign, which mirrored bones read opposite, so one arm stood straight at its range's edge and the other bent by the residue.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The sinusoid, its roots, then the range.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The degeneracy thresholds are the engine's shared length scale.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function branches(chain: IAutoMovieHingedChainGeometry): IAutoMovieHingedArmSwivel.IStop[] | null {
    return branchStops(chain);
  }

  /**
   * The chain posed at a hinge angle, for any swivel: the mid joint turned by
   * the hinge angle, the root aimed so the chain's root-to-effector line
   * points at the target (`aimRotation`), then turned about that line by the
   * swivel.
   *
   * @param chain The chain.
   * @param theta The hinge angle, radians.
   * @returns The bone-local root and mid rotations at a swivel about the root-to-effector line, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order of the turns and the units.
   * @evidence contracts/development/implementation.md#principled-implementation The swivel about the root-to-effector line is an exact null space of the effector's position.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The hinge, the line and the aim once, then the swivel per call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Mid direction/aim and the lazy swivel-axis magnitude/norm are read once for a branch; each swivel retains its actual half-angle sine/cosine and original quaternion product.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares aimRotation and Quaternion.prepareAxisAngle's actual fixed-line arithmetic, with no prior angle or rotation result reused.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned branch closure owns its mid rotation, line, aim and bounded lazy axis reader until caller release, with no target history or handles.
   */
  export function pose(
    chain: IAutoMovieHingedChainGeometry,
    theta: number,
  ): (swivel: number) => {
    upper: IAutoMovieQuaternion;
    lower: IAutoMovieQuaternion;
  } {
    return poseBranch(chain, theta);
  }

  /** The interface contract (`IAutoMovieHingedArmSwivel.IPrepared`). */
  export type IPrepared = IAutoMovieHingedArmSwivel.IPrepared;

  /** The interface contract (`IAutoMovieHingedArmSwivel.IPreparedTarget`). */
  export type IPreparedTarget = IAutoMovieHingedArmSwivel.IPreparedTarget;

  /** The interface contract (`IAutoMovieHingedArmSwivel.IHarmonic`). */
  export type IHarmonic = IAutoMovieHingedArmSwivel.IHarmonic;

  /**
   * Borrow unchanged source frames/offsets for one synchronous chain operation.
   * Construction performs no numeric admission. Branch queries lazily share
   * exact lengths, normalized hinge and span coefficients; pose queries share
   * the exact inverse root frame and each target's local aim goal. Target
   * roots, range stops, branch directions, aims and every swivel remain actual.
   *
   * Constant-size source/target records retain no candidate or score history.
   * The caller releases each target after its search and the source after all
   * fits; changed frames, offsets or hinge require a new preparation.
   *
   * An optional span holder (`hingedArmSpan.ISpan`) lends the segment-length gate and the
   * span coefficients, which depend on the offsets, the mid rest and the
   * hinge alone and not on the root's frame, to every source that has those
   * same four records: the first branch query of any of them fills it and
   * the others read it. The root-frame inverse stays each source's own.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines borrowed immutable source scope, lazy original-use geometry, independent target/range scope and caller release.
   * @evidence contracts/development/implementation.md#principled-implementation The hinge-span sinusoid depends only on source offsets/rest/axis, and the lowered goal depends only on source root and target; their unchanged completed arithmetic can serve both bend branches and all target swivel probes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Direct and prepared entries share branchStops, geometry, aimed and poseBranch, keeping the exact hinge law with one owner and leaving all search/ROM policy to callers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps root/segment/hinge/span degeneracy thresholds, root order, range wrapping, shortfall formula and actual branch/quaternion formulas; no reached-point proxy or cached answer replaces a demand.
   * @evidence contracts/development/implementation.md#efficient-algorithms One constant source sinusoid/inverse preparation serves all targets, and one constant lowered goal serves each target's branches. Every requested root, branch aim and swivel still runs; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only source-fixed scalars/vectors and a target's unchanged local goal are shared. Each target owns its own point/range and outputs, with no seed, score, clamp or user callback cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One source owns a boolean, optional fixed geometry and inverse frame; each target owns one borrowed chain request and optional goal until caller release, with no growing collection, handles or tasks.
   */
  export function prepare(
    source: Omit<IAutoMovieHingedChainGeometry, "target" | "range">,
    shared?: hingedArmSpan.ISpan,
  ): IPrepared {
    const state: IPreparation = { span: shared ?? {} };
    return {
      target: (point: IAutoMovieVector3, range?: IAutoMovieHingedChainGeometry["range"]): IPreparedTarget => {
        const chain: IAutoMovieHingedChainGeometry = { ...source, target: point, ...(range === undefined ? {} : { range }) };
        const target: ITargetPreparation = {};
        return {
          branches: (): IAutoMovieHingedArmSwivel.IStop[] | null => branchStops(chain, state),
          pose: (theta: number): ReturnType<typeof hingedArmSwivel.pose> =>
            poseBranch(chain, theta, state, target),
          harmonic: (theta: number): IHarmonic => {
            const branch: ReturnType<typeof aimed> =
              aimed(chain, theta, state, target);
            const { lower, line, aim }: ReturnType<typeof aimed> =
              branch;
            const axis: IAutoMovieQuaternion = Quaternion.fromAxisAngle(line, 180);

            // The pure generator has scalar zero algebraically; do not
            // leak floating cos(pi/2) from an evaluated pose into it.
            axis.w = 0;
            return { lower, cosine: aim, sine: Quaternion.multiply(aim, axis),
              pose: (): ReturnType<typeof hingedArmSwivel.pose> =>
                poseBranch(chain, theta, state, target, branch) };
          },
        };
      },
    };
  }

  /** A branch's fixed pose generator, shared by direct and prepared entries. */
  function poseBranch(
    chain: IAutoMovieHingedChainGeometry,
    theta: number,
    source?: IPreparation,
    target?: ITargetPreparation,
    branch?: ReturnType<typeof aimed>,
  ): ReturnType<typeof hingedArmSwivel.pose> {
    const { lower, line, aim }: ReturnType<typeof aimed> =
      branch ?? aimed(chain, theta, source, target);
    const swivelRotation: ReturnType<typeof Quaternion.prepareAxisAngle> =
      Quaternion.prepareAxisAngle(line);
    return (swivel: number): ReturnType<ReturnType<typeof hingedArmSwivel.pose>> => ({
      upper: Quaternion.multiply(aim, swivelRotation(swivel)),
      lower,
    });
  }

  /**
   * The swivel of a posed chain: the root's turn about the chain's
   * root-to-effector line past the aim `pose` gives for its hinge angle.
   *
   * @param chain The chain, its target where the posed effector lies.
   * @param upper The posed bone-local root rotation.
   * @param theta The posed hinge angle, radians.
   * @returns Degrees, in (-180, 180].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read and its range.
   * @evidence contracts/development/implementation.md#principled-implementation The inverse of `pose`: the aim removed, the rest is a turn about the line.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The aim, the remainder, its angle.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares `pose`'s aim.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function read(
    chain: IAutoMovieHingedChainGeometry,
    upper: IAutoMovieQuaternion,
    theta: number,
  ): number {
    const { line, aim }: ReturnType<typeof aimed> = aimed(chain, theta);
    const rest: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.inverse(aim),
      upper,
    );
    const along: number = rest.x * line.x + rest.y * line.y + rest.z * line.z;
    const degrees: number = (2 * Math.atan2(along, rest.w) * 180) / Math.PI;
    return degrees > 180
      ? degrees - 360
      : degrees <= -180
        ? degrees + 360
        : degrees;
  }

  /** The mid rotation, the root-to-effector line in the root's frame and the aim at a hinge angle. */
  function aimed(
    chain: IAutoMovieHingedChainGeometry,
    theta: number,
    source?: IPreparation,
    target?: ITargetPreparation,
  ): {
    lower: IAutoMovieQuaternion;
    line: IAutoMovieVector3;
    aim: IAutoMovieQuaternion;
  } {
    const lower: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      source?.span.geometry?.hinge ?? Vector3.normalize(chain.hinge),
      theta * RAD2DEG,
    );
    const mid: IAutoMovieVector3 = Vector3.add(
      chain.midOffset,
      Quaternion.rotateVector(
        chain.midRest,
        Quaternion.rotateVector(lower, chain.endOffset),
      ),
    );
    let goal: IAutoMovieVector3 | undefined = target?.goal;
    if (goal === undefined) {
      let inverse: IAutoMovieQuaternion | undefined = source?.inverse;
      if (inverse === undefined) {
        inverse = Quaternion.inverse(chain.upper.worldRotation);
        if (source !== undefined) source.inverse = inverse;
      }
      goal = Quaternion.rotateVector(inverse,
        Vector3.subtract(chain.target, chain.upper.worldPosition));
      if (target !== undefined) target.goal = goal;
    }
    return {
      lower,
      line: Vector3.normalize(mid),
      aim: aimRotation(mid, goal),
    };
  }

  /** Source-only hinge span coefficients (`hingedArmSpan.IGeometry`). */
  type IGeometry = hingedArmSpan.IGeometry;

  /** Lazy source quantities, retained only by explicit unchanged preparation. */
  interface IPreparation {
    /** Segment-length and hinge/span admission, this source's own or lent by its owner. */
    span: hingedArmSpan.ISpan;
    /** Root-frame inverse, first read during branch posing. */
    inverse?: IAutoMovieQuaternion;
  }

  /** The exact target goal lowered through the unchanged source root frame. */
  interface ITargetPreparation {
    /** Shared between branch aims, never between targets. */
    goal?: IAutoMovieVector3;
  }

  /** Preserve root/length/target/hinge admission, root order and range stops. */
  function branchStops(chain: IAutoMovieHingedChainGeometry, source?: IPreparation): IAutoMovieHingedArmSwivel.IStop[] | null {
    const root: IAutoMovieVector3 = chain.upper.worldPosition;
    let valid: boolean | undefined = source?.span.valid;
    if (valid === undefined) {
      valid = !(Vector3.length(chain.midOffset) < 1e-6 ||
        Vector3.length(chain.endOffset) < 1e-6);
      if (source !== undefined) source.span.valid = valid;
    }
    if (!valid) return null;
    const distance: number = Vector3.length(Vector3.subtract(chain.target, root));
    if (distance < 1e-6) return null;
    let fixed: IGeometry | null | undefined = source?.span.geometry;
    if (fixed === undefined) {
      fixed = hingedArmSpan.of(chain);
      if (source !== undefined) source.span.geometry = fixed;
    }
    if (fixed === null) return null;
    const { k, alpha, beta, span, phase }: IGeometry = fixed;
    const ratio: number = (distance * distance - k) / span;
    const squared: (theta: number) => number = (theta: number): number =>
      k + alpha * Math.cos(theta) + beta * Math.sin(theta);

    // The extended branch is the rest angle wherever its computed span is the
    // maximum's: the hinge angles between them are equal maxima, and the
    // least articulation among them is the rest.
    const extended: number = squared(0) === squared(phase) ? 0 : phase;
    const thetas: number[] = ratio >= 1 ? [extended] : ratio <= -1
      ? [phase + Math.PI] : [phase + Math.acos(ratio), phase - Math.acos(ratio)];
    const outside: boolean = ratio >= 1 || ratio <= -1;
    const short: (theta: number) => number = (theta: number): number => Math.abs(
      Math.sqrt(Math.max(0, squared(theta))) - distance,
    );
    const range: IAutoMovieHingedChainGeometry["range"] = chain.range;
    return thetas.map((theta: number): IAutoMovieHingedArmSwivel.IStop => {
      if (range === undefined) return { theta, shortfall: outside ? short(theta) : 0 };
      const centre: number = (range.min + range.max) / 2;
      const wrapped: number = theta - 2 * Math.PI * Math.round((theta - centre) / (2 * Math.PI));
      const legal: number = Math.min(range.max, Math.max(range.min, wrapped));
      return { theta: legal, shortfall: legal === wrapped && !outside ? 0 : short(legal) };
    });
  }

  /** Degrees per radian. */
  const RAD2DEG: number = 180 / Math.PI;
}
