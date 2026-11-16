import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";
import { IAutoMovieChainBone } from "./IAutoMovieChainBone";
import { aimRotation } from "./aimRotation";

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
   * A hinged chain toward a target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame.
   * @evidence contracts/development/design.md#principled-representation The chain's rest geometry, its root's frame and the target, as `hingedArmArticulation` takes them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seven members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `IAutoMovieChainBone`.
   */
  export interface IChain {
    /** Chain-root bone (the shoulder or the hip) resolved under the rig's rest FK. */
    upper: IAutoMovieChainBone;

    /** Mid bone's rest offset from the chain root, in the root's bone frame. */
    midOffset: IAutoMovieVector3;

    /** Mid bone's rest rotation relative to the chain root. */
    midRest: IAutoMovieQuaternion;

    /** Effector's rest offset from the mid joint, in the mid bone's frame. */
    endOffset: IAutoMovieVector3;

    /** The mid joint's flexion axis in the mid bone's frame; any length. */
    hinge: IAutoMovieVector3;

    /** World target the effector should land on. */
    target: IAutoMovieVector3;

    /** The mid joint's legal rotation about `hinge`, radians, `min <= max` and no wider than a full turn; every hinge angle is legal when absent. */
    range?: { min: number; max: number };
  }

  /**
   * One bend branch after the hinge's range.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit.
   * @evidence contracts/development/design.md#principled-representation A hinge angle and how far short of the target it stops.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStop {
    /** The hinge angle, radians, inside the range when one is given. */
    theta: number;

    /** Metres between the chain's span at `theta` and the target distance; `0` for a branch that reaches the distance inside the range. */
    shortfall: number;
  }

  /**
   * The chain's bend branches toward its target: the two hinge angles whose
   * span is the target's distance, `phase + acos` first, or the fully
   * extended or folded one outside the span, each stopped at the nearer limit
   * of the range.
   *
   * @param chain The chain.
   * @returns The branches, in that order, or null for a degenerate chain (`hingedArmArticulation`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order, the stops and the null.
   * @evidence contracts/development/implementation.md#principled-implementation The span is an exact sinusoid in the hinge angle, so its two arccos roots are the only hinge angles reaching the distance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The sinusoid, its roots, then the range.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The degeneracy thresholds are the engine's shared length scale.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function branches(chain: IChain): IStop[] | null {
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
   * @evidence contracts/development/implementation.md#efficient-algorithms The mid direction and the aim are read once for every swivel of a branch.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `aimRotation`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the branch's mid rotation, line and aim in the returned function only.
   */
  export function pose(
    chain: IChain,
    theta: number,
  ): (swivel: number) => {
    upper: IAutoMovieQuaternion;
    lower: IAutoMovieQuaternion;
  } {
    return poseBranch(chain, theta);
  }

  /**
   * Source geometry and one target's independent branch/pose readers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines unchanged borrowed source geometry, model-metre target points and per-target range ownership.
   * @evidence contracts/development/design.md#principled-representation The source fixes span coefficients and inverse root frame; a target fixes its reach distance and local aim goal independently of the swivel and bend branch.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The hinged articulation consumes branches and a branch poser; source workspaces need only target construction, with no score, seed or search policy exposed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every target computes its actual roots and every branch computes its actual aim; no candidate, target history, callback result or approximate key is retained.
   */
  export interface IPrepared {
    /**
     * Borrow one unchanged model-metre point and optional radian hinge range.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines point/range units, unchanged target scope and target-reader ownership.
     * @evidence contracts/development/implementation.md#principled-implementation prepare's target factory combines the same fixed source with this actual target/range, preserving all later root, shell and aim formulas.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Construction creates branch/pose readers over one target request; source geometry remains with the existing shared preparation.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No solve, admission, clamping, score or reached-point substitution runs at construction; only the supplied actual target is borrowed.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant-size request/state and two closures are allocated; numeric work remains lazy at the original reader sites.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Both readers share this unchanged point/range and one lowered goal, and borrow only the matching source's fixed geometry/inverse.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns one request, optional lowered goal and two readers until this target search ends; no target population, handles or tasks are stored.
     */
    target(point: IAutoMovieVector3, range?: IChain["range"]): IPreparedTarget;
  }

  /**
   * One target's geometric readers under one unchanged prepared source.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the same ordered branch roots and degree-valued swivel poser as the direct functions.
   * @evidence contracts/development/design.md#principled-representation The target's local aim direction is shared by its two bend branches, while their lower rotations and swivel axes remain distinct.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The articulation search consumes only the ordered stops and one poser for each hinge angle.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Degenerate branches return null under the same thresholds; the poser does not clamp, score or change a requested target.
   */
  export interface IPreparedTarget {
    /**
     * Actual hinge roots in direct order, or null at the same degeneracy gates.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines ordered radian roots, actual model-metre shortfalls and null meaning through IStop and the source's original degeneracy contract.
     * @evidence contracts/development/implementation.md#principled-implementation branchStops uses the same exact source span sinusoid, actual root-target distance, arccos root order and range wrapping/shell formula as direct branches.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The reader delegates to the common branchStops owner; source coefficient preparation and per-target roots remain separate.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps segment/root/hinge/span gates, original target and legal range stops, without cached branches, altered thresholds or clamped-success claims.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant root/range work returns at most two fresh stops; source coefficients and successful length/hinge preparation are shared rather than recomputed.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The source remains unchanged, so only its coefficients/length gate are reused; every call recomputes this target's distance, roots and shortfalls.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Fresh stop records belong to the caller and no branch result is stored in the target reader; borrowed source/request state ends with caller release.
     */
    branches(): IStop[] | null;

    /**
     * Build one actual branch's poser for a swivel in degrees, without rig policy.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines radian hinge input, degree swivel input and bone-local upper/lower output; the returned poser owns one fixed lower rotation reused within that branch and fresh upper rotations.
     * @evidence contracts/development/implementation.md#principled-implementation poseBranch and aimed turn about the actual hinge, aim the branch's root-to-end direction at the actual target, then apply its position-preserving swivel.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The same branch poser/aim owners serve direct and prepared entries; this reader supplies only the matching source/target metadata.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No branch angle, target, quaternion or ROM policy is approximated, replaced or remembered from a previous request.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant branch direction/aim work precedes constant per-swivel axis-angle/product work; exact source inverse and this target's lowered goal avoid repeated fixed preparation.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the unchanged source inverse/normalized hinge and this unchanged target's lowered goal are shared; every branch aim and requested swivel is actual.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned branch closure owns its lower rotation, line and aim until caller release, with no score/target history or handles; callers keep its borrowed lower record unchanged during use.
     */
    pose(theta: number): ReturnType<typeof hingedArmSwivel.pose>;
  }

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
   * @evidence contracts/development/common.md#meaningful-documentation Defines borrowed immutable source scope, lazy original-use geometry, independent target/range scope and caller release.
   * @evidence contracts/development/implementation.md#principled-implementation The hinge-span sinusoid depends only on source offsets/rest/axis, and the lowered goal depends only on source root and target; their unchanged completed arithmetic can serve both bend branches and all target swivel probes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Direct and prepared entries share branchStops, geometry, aimed and poseBranch, keeping the exact hinge law with one owner and leaving all search/ROM policy to callers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps root/segment/hinge/span degeneracy thresholds, root order, range wrapping, shortfall formula and actual branch/quaternion formulas; no reached-point proxy or cached answer replaces a demand.
   * @evidence contracts/development/implementation.md#efficient-algorithms One constant source sinusoid/inverse preparation serves all targets, and one constant lowered goal serves each target's branches. Every requested root, branch aim and swivel still runs; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only source-fixed scalars/vectors and a target's unchanged local goal are shared. Each target owns its own point/range and outputs, with no seed, score, clamp or user callback cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One source owns a boolean, optional fixed geometry and inverse frame; each target owns one borrowed chain request and optional goal until caller release, with no growing collection, handles or tasks.
   */
  export function prepare(
    source: Omit<IChain, "target" | "range">,
  ): IPrepared {
    const state: IPreparation = {};
    return {
      target: (point: IAutoMovieVector3, range?: IChain["range"]): IPreparedTarget => {
        const chain: IChain = { ...source, target: point, ...(range === undefined ? {} : { range }) };
        const target: ITargetPreparation = {};
        return {
          branches: (): IStop[] | null => branchStops(chain, state),
          pose: (theta: number): ReturnType<typeof hingedArmSwivel.pose> =>
            poseBranch(chain, theta, state, target),
        };
      },
    };
  }

  /** A branch's fixed pose generator, shared by direct and prepared entries. */
  function poseBranch(
    chain: IChain,
    theta: number,
    source?: IPreparation,
    target?: ITargetPreparation,
  ): ReturnType<typeof hingedArmSwivel.pose> {
    const { lower, line, aim }: ReturnType<typeof aimed> = aimed(chain, theta, source, target);
    return (swivel: number): ReturnType<ReturnType<typeof hingedArmSwivel.pose>> => ({
      upper: Quaternion.multiply(aim, Quaternion.fromAxisAngle(line, swivel)),
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
    chain: IChain,
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
    chain: IChain,
    theta: number,
    source?: IPreparation,
    target?: ITargetPreparation,
  ): {
    lower: IAutoMovieQuaternion;
    line: IAutoMovieVector3;
    aim: IAutoMovieQuaternion;
  } {
    const lower: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      source?.geometry?.hinge ?? Vector3.normalize(chain.hinge),
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

  /** Source-only hinge span coefficients, independent of target and range. */
  interface IGeometry {
    /** Actual normalized hinge, shared with branch posing after admission. */
    hinge: IAutoMovieVector3;
    /** Constant term of the squared root-to-effector span. */
    k: number;
    /** Cosine coefficient of that span. */
    alpha: number;
    /** Sine coefficient of that span. */
    beta: number;
    /** Magnitude of the two harmonic coefficients. */
    span: number;
    /** Phase of that sinusoid, radians. */
    phase: number;
  }

  /** Lazy source quantities, retained only by explicit unchanged preparation. */
  interface IPreparation {
    /** Segment-length admission, before the target gate. */
    valid?: boolean;
    /** Hinge/span admission, after a nondegenerate target. */
    geometry?: IGeometry | null;
    /** Root-frame inverse, first read during branch posing. */
    inverse?: IAutoMovieQuaternion;
  }

  /** The exact target goal lowered through the unchanged source root frame. */
  interface ITargetPreparation {
    /** Shared between branch aims, never between targets. */
    goal?: IAutoMovieVector3;
  }

  /** Read the hinge-only sinusoid after the existing length/target gates. */
  function geometry(chain: IChain): IGeometry | null {
    if (Vector3.length(chain.hinge) < 1e-6) return null;
    const hinge: IAutoMovieVector3 = Vector3.normalize(chain.hinge);
    const along: number = Vector3.dot(hinge, chain.endOffset);
    const swung: IAutoMovieVector3 = Vector3.subtract(
      chain.endOffset, Vector3.scale(hinge, along),
    );
    const radius: number = Vector3.length(swung);
    const k: number = Vector3.dot(chain.midOffset, chain.midOffset) +
      Vector3.dot(chain.endOffset, chain.endOffset) +
      2 * along * Vector3.dot(chain.midOffset,
        Quaternion.rotateVector(chain.midRest, hinge));
    let alpha: number = 0;
    let beta: number = 0;
    if (radius >= SPAN_EPSILON) {
      const unit: IAutoMovieVector3 = Vector3.scale(swung, 1 / radius);
      alpha = 2 * radius * Vector3.dot(chain.midOffset,
        Quaternion.rotateVector(chain.midRest, unit));
      beta = 2 * radius * Vector3.dot(chain.midOffset,
        Quaternion.rotateVector(chain.midRest, Vector3.cross(hinge, unit)));
    }
    const span: number = Math.hypot(alpha, beta);
    return span < SPAN_EPSILON ? null
      : { hinge, k, alpha, beta, span, phase: Math.atan2(beta, alpha) };
  }

  /** Preserve root/length/target/hinge admission, root order and range stops. */
  function branchStops(chain: IChain, source?: IPreparation): IStop[] | null {
    const root: IAutoMovieVector3 = chain.upper.worldPosition;
    let valid: boolean | undefined = source?.valid;
    if (valid === undefined) {
      valid = !(Vector3.length(chain.midOffset) < 1e-6 ||
        Vector3.length(chain.endOffset) < 1e-6);
      if (source !== undefined) source.valid = valid;
    }
    if (!valid) return null;
    const distance: number = Vector3.length(Vector3.subtract(chain.target, root));
    if (distance < 1e-6) return null;
    let fixed: IGeometry | null | undefined = source?.geometry;
    if (fixed === undefined) {
      fixed = geometry(chain);
      if (source !== undefined) source.geometry = fixed;
    }
    if (fixed === null) return null;
    const { k, alpha, beta, span, phase }: IGeometry = fixed;
    const ratio: number = (distance * distance - k) / span;
    const thetas: number[] = ratio >= 1 ? [phase] : ratio <= -1
      ? [phase + Math.PI] : [phase + Math.acos(ratio), phase - Math.acos(ratio)];
    const outside: boolean = ratio >= 1 || ratio <= -1;
    const short: (theta: number) => number = (theta: number): number => Math.abs(
      Math.sqrt(Math.max(0, k + alpha * Math.cos(theta) + beta * Math.sin(theta))) - distance,
    );
    const range: IChain["range"] = chain.range;
    return thetas.map((theta: number): IStop => {
      if (range === undefined) return { theta, shortfall: outside ? short(theta) : 0 };
      const centre: number = (range.min + range.max) / 2;
      const wrapped: number = theta - 2 * Math.PI * Math.round((theta - centre) / (2 * Math.PI));
      const legal: number = Math.min(range.max, Math.max(range.min, wrapped));
      return { theta: legal, shortfall: legal === wrapped && !outside ? 0 : short(legal) };
    });
  }

  /** Below this the mid joint cannot change the chain's span at all. */
  const SPAN_EPSILON: number = 1e-9;

  /** Degrees per radian. */
  const RAD2DEG: number = 180 / Math.PI;
}
