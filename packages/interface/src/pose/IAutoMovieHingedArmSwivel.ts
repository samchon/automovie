import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieHingedChainGeometry } from "./IAutoMovieHingedChainGeometry";

/**
 * Rest-chain geometry and swivel parameterization shared by hingedArmSwivel and hingedArmArticulation. Hinge angles are radians; swivel arguments are degrees.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives each rest offset's bone frame, world target and radian hinge interval. Defines the allowed hinge angle and unsigned radial shortfall.
 * @evidence contracts/development/design.md#principled-representation branches rejects its small-segment, target-at-root, small-hinge and invariant-span cases with null; callers supply finite geometry, unit rest frames and valid ranges. theta is radians and shortfall nonnegative metres between attained span and requested radius; legal reachable branches report zero.
 * @evidence contracts/development/design.md#minimal-and-owned-surface hingedArmSwivel and hingedArmArticulation use this same prepared rest-chain geometry for span branches and swivel posing. hingedArmSwivel.branches returns these stops for hinge-limit and geometric-shell selection.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contract reuses IAutoMovieChainBone and keeps clinical ROM scoring out of geometric branch construction. A zero shortfall concerns radial geometry only and does not certify all joints' ROM or effector orientation.
 */
export namespace IAutoMovieHingedArmSwivel {
  /**
   * One bend branch after the hinge's range.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the allowed hinge angle and unsigned radial shortfall.
   * @evidence contracts/development/design.md#principled-representation theta is radians and shortfall nonnegative metres between attained span and requested radius; legal reachable branches report zero.
   * @evidence contracts/development/design.md#minimal-and-owned-surface hingedArmSwivel.branches returns these stops for hinge-limit and geometric-shell selection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A zero shortfall concerns radial geometry only and does not certify all joints' ROM or effector orientation.
   */
  export interface IStop {
    /** The hinge angle, radians, inside the range when one is given. */
    theta: number;

    /** Metres between the chain's span at `theta` and the target distance; `0` for a branch that reaches the distance inside the range. */
    shortfall: number;
  }

  /**
   * The chain posed at a hinge angle, for any swivel: the mid joint turned by
   * the hinge angle, the root aimed so the chain's root-to-effector line
   * points at the target (`aimRotation`), then turned about that line by the
   * swivel in degrees. The returned closure retains the precomputed aim and
   * hinge quaternion. Each evaluation makes a new upper rotation but shares
   * its lower quaternion with other evaluations, so treat both as read-only.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes degree swivel input, bone-local output and shared lower quaternion ownership.
   * @evidence contracts/development/design.md#principled-representation For a fixed radian hinge branch, any degree swivel preserves effector radius; unit quaternions express root and mid articulations in their respective rest frames.
   * @evidence contracts/development/design.md#minimal-and-owned-surface hingedArmSwivel.pose returns this closure, retaining its precomputed aim and lower rotation for repeated candidate scoring.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The reader makes a fresh upper quaternion but shares lower, so it promises no deep copy of each sample.
   */
  export type IPoseResult = (swivel: number) => {
    /** Root articulation in its bone-local rest frame; unit quaternion. */
    upper: IAutoMovieQuaternion;
    /** Mid articulation about its bone-local hinge; unit quaternion shared across this closure's samples. */
    lower: IAutoMovieQuaternion;
  };

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
     */
    target(point: IAutoMovieVector3, range?: IAutoMovieHingedChainGeometry["range"]): IPreparedTarget;
  }

  /**
   * One target's geometric readers under one unchanged prepared source.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States ordered branch roots and degree swivel posing, plus optional algebraic upper half-angle coefficients with fixed lower articulation.
   * @evidence contracts/development/design.md#principled-representation The target's local aim direction is shared by its two bend branches, while their lower rotations and swivel axes remain distinct.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Ordinary articulation consumes ordered stops/poser; explicit orientation-root continuation uses only the same branch's harmonic coefficients. No score or target result cache is exposed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Degenerate branches return null under the same thresholds; the poser does not clamp, score or change a requested target.
   */
  export interface IPreparedTarget {
    /**
     * Actual hinge roots in direct order, or null at the same degeneracy gates.
     */
    branches(): IAutoMovieHingedArmSwivel.IStop[] | null;

    /**
     * Build one actual branch's poser for a swivel in degrees, without rig policy.
     */
    pose(theta: number): IAutoMovieHingedArmSwivel.IPoseResult;

    /**
     * Read one radian hinge branch's algebraic upper half-angle family.
     * The returned coefficients use bone-local frames and degree swivels as
     * defined by IHarmonic; this query does not admit goals or constraints.
     */
    harmonic?(theta: number): IHarmonic;
  }

  /**
   * One branch's exact algebraic quaternion half-angle family in bone-local frames.
   * Keep its returned coefficient/lower records unchanged while constructing
   * or using the same branch's poser.
   *
   * @evidence contracts/development/common.md#meaningful-documentation upper(psi)=cosine*cos(psi/2)+sine*sin(psi/2) uses degree swivels after radians conversion; lower is the fixed hinge articulation.
   * @evidence contracts/development/design.md#principled-representation Fixed aim times the unit-axis quaternion gives its two half-angle coefficients; the hinge lower rotation is independent of swivel.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the explicit two-axis orientation-root dispatcher needs these three numeric quaternion records and their same-branch poser factory; no score, curve state or fitted answer is exposed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Coefficients come from the known geometric rotation law, not sampled equality or a solved pose. Actual constraints/FK/goals remain the consumer's admission responsibility.
   */
  export interface IHarmonic {
    /** Upper articulation's cosine half-angle coefficient. */
    cosine: IAutoMovieQuaternion;
    /** Upper articulation's sine half-angle coefficient. */
    sine: IAutoMovieQuaternion;
    /** Actual fixed lower articulation about its hinge. */
    lower: IAutoMovieQuaternion;
    /**
     * Build the degree-swivel reader from this completed branch's unchanged geometry.
     */
    pose(): IAutoMovieHingedArmSwivel.IPoseResult;
  }
}
