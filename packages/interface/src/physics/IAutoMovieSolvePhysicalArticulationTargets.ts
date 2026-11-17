import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/**
 * Bounded geometric articulation fitting, residual callbacks and accepted motor-goal results.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Bounded joint-coordinate fitting of borrowed world goals against a caller's geometric residual. Accepted world motor goals and the remaining Euclidean geometric residual.
 * @evidence contracts/development/design.md#principled-representation At most 64 free coordinates and 1024 finite residual entries are allowed; iterations is an integer in [1,64], and tolerance uses the residual's metre norm. targets retains fixed pivots and projected angular coordinates; residual is the nonnegative norm of the final measure vector in metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface solvePhysicalArticulationTargets clones the initial goals, calls synchronous measure/linearize during fitting and retains no callbacks after return; callbacks must not mutate supplied poses. solvePhysicalArticulationTargets returns an owned initial clone with subsequent accepted branches updated without mutating caller goals.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The solver checks budgets, selected bones and residual size/finiteness, and propagates callback exceptions. The caller supplies an admitted acyclic profile and complete world poses; a fixed residual dimension is required across all probes. Backtracking accepts only actual residual decreases, but exhausted budgets or unreachable goals can leave residual above tolerance. No simulated body is moved and no success flag conceals that residual.
 */
export namespace IAutoMovieSolvePhysicalArticulationTargets {
  /**
   * Bounded joint-coordinate fitting of borrowed world goals against a caller's geometric residual.
   *
   * At most 64 free coordinates and 1024 finite residual entries are allowed; iterations is an integer in [1,64], and tolerance uses the residual's metre norm. solvePhysicalArticulationTargets clones the initial goals, calls synchronous measure/linearize during fitting and retains no callbacks after return; callbacks must not mutate supplied poses. The solver checks budgets, selected bones and residual size/finiteness, and propagates callback exceptions. The caller supplies an admitted acyclic profile and complete world poses; a fixed residual dimension is required across all probes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Bounded joint-coordinate fitting of borrowed world goals against a caller's geometric residual.
   * @evidence contracts/development/design.md#principled-representation At most 64 free coordinates and 1024 finite residual entries are allowed; iterations is an integer in [1,64], and tolerance uses the residual's metre norm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface solvePhysicalArticulationTargets clones the initial goals, calls synchronous measure/linearize during fitting and retains no callbacks after return; callbacks must not mutate supplied poses.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The solver checks budgets, selected bones and residual size/finiteness, and propagates callback exceptions. The caller supplies an admitted acyclic profile and complete world poses; a fixed residual dimension is required across all probes.
   */
  export type IInput = {
    /** Admitted fixed-pivot tree. */
    profile: IAutoMoviePhysicalProfile;

    /** Actuated child bones, including branches solved together. */
    bones: readonly string[];

    /** Borrowed admitted world motor goals. */
    targets: Readonly<Record<string, IAutoMovieRigidTransform>>;

    /** Synchronous deterministic residual vector in metres for borrowed world poses, with 1..1024 finite entries and invariant length. Do not mutate poses or returned residuals during the solve; exceptions propagate.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Specifies the measure callback or sampling contract, including its clock and ownership obligations.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
     */
    measure: (
      poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
    ) => number[];

    /** Optional synchronous model factory refreshed at each accepted pose. Its probe callback receives borrowed trial poses and optionally the moved bone set, and must return finite residuals with the same dimension. Omission uses measure; actual acceptance always re-evaluates measure. Callbacks are not retained after return.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Specifies the linearize callback or sampling contract, including its clock and ownership obligations.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
     */
    linearize?: (
      poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
    ) => (
      probe: Readonly<Record<string, IAutoMovieRigidTransform>>,
      moved?: ReadonlySet<string>,
    ) => number[];

    /** Positive update budget, at most 64. */
    iterations: number;

    /** Positive metre residual early-out. */
    tolerance: number;
  };

  /**
   * Accepted world motor goals and the remaining Euclidean geometric residual.
   *
   * targets retains fixed pivots and projected angular coordinates; residual is the nonnegative norm of the final measure vector in metres. solvePhysicalArticulationTargets returns an owned initial clone with subsequent accepted branches updated without mutating caller goals. Backtracking accepts only actual residual decreases, but exhausted budgets or unreachable goals can leave residual above tolerance. No simulated body is moved and no success flag conceals that residual.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Accepted world motor goals and the remaining Euclidean geometric residual.
   * @evidence contracts/development/design.md#principled-representation targets retains fixed pivots and projected angular coordinates; residual is the nonnegative norm of the final measure vector in metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface solvePhysicalArticulationTargets returns an owned initial clone with subsequent accepted branches updated without mutating caller goals.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Backtracking accepts only actual residual decreases, but exhausted budgets or unreachable goals can leave residual above tolerance. No simulated body is moved and no success flag conceals that residual.
   */
  export type IResult = {
    /** Owned fitted world motor-goal record with metre positions and unit rotations; callers may change it without editing input targets. */
    targets: Record<string, IAutoMovieRigidTransform>;

    /** Euclidean norm of the final actual measure vector, metres; may exceed tolerance for unreachable goals or an exhausted/stalled solve. */
    residual: number;
  };
}
