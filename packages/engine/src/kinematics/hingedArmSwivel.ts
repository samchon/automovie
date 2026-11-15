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
 * @evidence contracts/development/design.md#minimal-and-owned-surface The chain, the swivel and three functions: the branches, the pose and its reading; `hingedArmArticulation` poses its candidates through them.
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
    const root: IAutoMovieVector3 = chain.upper.worldPosition;
    if (
      Vector3.length(chain.midOffset) < 1e-6 ||
      Vector3.length(chain.endOffset) < 1e-6
    )
      return null;
    const distance: number = Vector3.length(
      Vector3.subtract(chain.target, root),
    );
    if (distance < 1e-6) return null;
    if (Vector3.length(chain.hinge) < 1e-6) return null;
    const hinge: IAutoMovieVector3 = Vector3.normalize(chain.hinge);
    // |m(θ)|² = k + α cos θ + β sin θ, with the far segment split into the part
    // the hinge cannot move (along the hinge) and the part it swings.
    const along: number = Vector3.dot(hinge, chain.endOffset);
    const swung: IAutoMovieVector3 = Vector3.subtract(
      chain.endOffset,
      Vector3.scale(hinge, along),
    );
    const radius: number = Vector3.length(swung);
    const rotated = (vector: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(chain.midRest, vector);
    const k: number =
      Vector3.dot(chain.midOffset, chain.midOffset) +
      Vector3.dot(chain.endOffset, chain.endOffset) +
      2 * along * Vector3.dot(chain.midOffset, rotated(hinge));
    let alpha: number = 0;
    let beta: number = 0;
    if (radius >= SPAN_EPSILON) {
      const unit: IAutoMovieVector3 = Vector3.scale(swung, 1 / radius);
      alpha = 2 * radius * Vector3.dot(chain.midOffset, rotated(unit));
      beta =
        2 *
        radius *
        Vector3.dot(chain.midOffset, rotated(Vector3.cross(hinge, unit)));
    }
    const span: number = Math.hypot(alpha, beta);
    if (span < SPAN_EPSILON) return null;
    const phase: number = Math.atan2(beta, alpha);
    const ratio: number = (distance * distance - k) / span;
    // Outside the span the chain clamps to its extreme, so the effector stops
    // on the reachable shell pointing at the target rather than failing.
    const thetas: number[] =
      ratio >= 1
        ? [phase]
        : ratio <= -1
          ? [phase + Math.PI]
          : [phase + Math.acos(ratio), phase - Math.acos(ratio)];
    const outside: boolean = ratio >= 1 || ratio <= -1;
    const short = (theta: number): number =>
      Math.abs(
        Math.sqrt(
          Math.max(0, k + alpha * Math.cos(theta) + beta * Math.sin(theta)),
        ) - distance,
      );
    // A hinge angle outside the joint's own range stops at the nearer limit,
    // so the effector rests on the legal shell along the line to the target.
    const range: { min: number; max: number } | undefined = chain.range;
    return thetas.map((theta: number): IStop => {
      if (range === undefined)
        return { theta, shortfall: outside ? short(theta) : 0 };
      const centre: number = (range.min + range.max) / 2;
      const wrapped: number =
        theta - 2 * Math.PI * Math.round((theta - centre) / (2 * Math.PI));
      const legal: number = Math.min(range.max, Math.max(range.min, wrapped));
      return {
        theta: legal,
        shortfall: legal === wrapped && !outside ? 0 : short(legal),
      };
    });
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
    const { lower, line, aim } = aimed(chain, theta);
    return (swivel: number) => ({
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
    const { line, aim } = aimed(chain, theta);
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
  ): {
    lower: IAutoMovieQuaternion;
    line: IAutoMovieVector3;
    aim: IAutoMovieQuaternion;
  } {
    const lower: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      Vector3.normalize(chain.hinge),
      theta * RAD2DEG,
    );
    const mid: IAutoMovieVector3 = Vector3.add(
      chain.midOffset,
      Quaternion.rotateVector(
        chain.midRest,
        Quaternion.rotateVector(lower, chain.endOffset),
      ),
    );
    const goal: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(chain.upper.worldRotation),
      Vector3.subtract(chain.target, chain.upper.worldPosition),
    );
    return {
      lower,
      line: Vector3.normalize(mid),
      aim: aimRotation(mid, goal),
    };
  }

  /** Below this the mid joint cannot change the chain's span at all. */
  const SPAN_EPSILON: number = 1e-9;

  /** Degrees per radian. */
  const RAD2DEG: number = 180 / Math.PI;
}
