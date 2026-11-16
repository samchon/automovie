import type { HumanQuadraticProgram as Q } from "../posture/HumanQuadraticProgram";
import type { walkStanceCourse } from "./walkStanceCourse";

/**
 * One fixed-window stance problem consumed by penalty sequential-convex
 * optimization. Coordinates retain their course units and knot layout;
 * only held swivel readings may change under the same fixed geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Members define course coordinates, raw/aggregate merit, convex rows, trust units, continuation records and held-prefix behavior.
 * @evidence contracts/development/design.md#principled-representation Separates one physical stance problem from the generic optimizer; world goals and degree-scaled constraints remain the shared course types, while compatible vector lengths and finite inputs are owning-problem premises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The existing stance solver and stagger sequential consumer read every field; walkStanceCourse.IProblem preserves their original namespace entry while this interface owns the callable contracts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Contains no action/body preset, solver-success override or rounded result key; physical functions and actual optimized coordinates remain authoritative.
 */
export interface IWalkStanceProblem {
  /** Flat initial variables in the original WIDTH-per-knot layout. */
  start: Float64Array;

  /** Read the actual objective and signed constraint intervals at a course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns dimensionless quadratic cost, degree-scaled violation aggregates and raw bounds in convex-row order for the supplied course vector.
   * @evidence contracts/development/implementation.md#principled-implementation Implementations run the original physical residual/constraint sweep without gradient probes, retaining signed excess before nonnegative l1 aggregation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One sweep supplies both generic merit and the correction's actual ordered constraint reading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every nonlinear constraint is read, including negative excess; no penalty, predicted row or stale trial substitutes for its physical value.
   * @evidence contracts/development/implementation.md#efficient-algorithms Costs one value-only knot/stance sweep and O(m) raw-bound output for m constraints, without unused Jacobian or P/q construction.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A caller may share this exact evaluation with its same trial correction; current course/held-swivel inputs are otherwise evaluated afresh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns one returned aggregate/bounds record until acceptance/correction completes; the evaluator retains no query history.
   */
  evaluate: (x: Float64Array) => walkStanceCourse.IEvaluation;

  /** Build the convex step model without its trust-region rows.
   *
   * @evidence contracts/development/common.md#meaningful-documentation mu weights the original nonlinear l1 rows; objective=false retains those rows and original diagonal regularization while omitting cost curvature/gradient.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original Gauss-Newton cost and finite-difference constraint linearizations in compatible step coordinates.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The physical model owns derivatives; walkStanceConvexify owns their numeric assembly and exact latest-course preparation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves all residuals, row order/keys, probe steps and the 1e-9 diagonal guard without changing physical bounds or solver accuracy.
   * @evidence contracts/development/implementation.md#efficient-algorithms A changed course/swivel costs one original derivative sweep and banded assembly; repeated steering choices copy O(n*b+R+m) numeric data for n variables, band b and R row entries.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only exact course scalars and immutable held-swivel identity under fixed problem geometry share private derivatives; each returned P/q and row array is fresh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The problem retains one O(n*b+R+m) private linearization until replacement/release, and each caller owns its returned model.
   */
  convexify: (x: Float64Array, mu: number, objective?: boolean) => Q.IProblem;

  /** Hard step rows around x inside radius units of the existing TRUST table.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States step-relative hard intervals, fixed layout and dimensionless trust-radius scale. borrowedTopology=true permits a prepared numeric consumer to borrow fixed index/coefficient arrays read-only; default calls keep independent array storage.
   * @evidence contracts/development/implementation.md#principled-implementation Substitutes current coordinates into original held/fixed/range/join rows and intersects free-coordinate intervals with their original scaled trust limits.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepared row topology owns invariant schedule/contact decisions; this reader applies only coordinates and radius.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps all held coordinates, foot/trunk claims and continuing-stance equalities in original order without a relaxed interval.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reads O(m) prepared rows with no repeated placement or side search for m hard rows.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Row topology belongs to fixed geometry/holds, independent of swivel changes; default queries copy every array, while an explicit prepared-solver loan shares only read-only index/coefficient arrays and always returns fresh rows/bounds.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The problem retains O(m) immutable descriptions until release; current returned rows belong to their solve and no radius history grows.
   */
  region: (x: Float64Array, radius: number, borrowedTopology?: boolean) => Q.IRow[];

  /** Largest step coordinate normalized by its original trust-region unit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns a dimensionless infinity norm over compatible WIDTH-layout coordinates.
   * @evidence contracts/development/implementation.md#principled-implementation Computes max(abs(step[i])/UNIT[i%WIDTH]) using the original metre/degree scaling.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One complete coordinate scan owns the physical trust-length conversion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses every original coordinate and unit with no cutoff or shortened vector.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(n) scalar work and O(1) scratch for n coordinates.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses only the fixed shared unit table; each actual step is read directly.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains neither the vector nor a result history.
   */
  length: (step: Float64Array) => number;

  /** Add a compatible step to x without mutating either input vector.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns the trial's original flat coordinate layout in a fresh Float64Array.
   * @evidence contracts/development/implementation.md#principled-implementation Applies the original componentwise x[i]+step[i] update.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One typed-array mapping materializes the selected proposal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not clamp, interpolate or alter any proposed coordinate.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(n) time/output for n coordinates, demanded only when the optimizer evaluates that proposal.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A step record may retain its same lazily materialized trial; distinct input steps receive independent arrays.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the output and the operation retains no state.
   */
  stepped: (x: Float64Array, step: Float64Array) => Float64Array;

  /** Degree-scaled excess under which every constraint is met, the unchanged MET. */
  tolerance: number;

  /** Record this exact course and its measured remaining constraint excess.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns all original knot series, planted goals and unmet degree-scaled excess, preserving a held prefix when this problem uses one.
   * @evidence contracts/development/implementation.md#principled-implementation Deinterleaves actual WIDTH coordinates, reads goal-only planted inputs and joins the unchanged settled prefix to the actual solved tail.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared record/join helpers own output assembly while physical goal construction stays with prepared geometry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Copies actual optimized coordinates and reported unmet value without substituting a successful or fitted trajectory.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(n*WIDTH+s) output for n knots and s scheduled stances; unused knee/constraint posing is omitted.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the original readonly knot references and settled prefix values, while each scalar output series is independently allocated.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the resulting course arrays/records and no extra course history is retained.
   */
  course: (x: Float64Array, unmet: number) => walkStanceCourse.ICourse;

  /** Current planted goals at a take-indexed knot, optionally on one side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns world hip/ankle goals and parent/foot rotations without fitted knees; held knots return no new goals.
   * @evidence contracts/development/implementation.md#principled-implementation Applies the original pelvis drop and foot turn/slide/pivot at the supplied course, selecting only actual scheduled stance sides.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Goal-only geometry serves seeded fits and final recording without traversing unrelated stance constraint calculations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original requested ankle and all body transforms; no reachable-shell pose or fit answer replaces the goal.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-size work for at most two stance goals; a side-specific probe reads only its requested leg's goal geometry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses fixed body/placement preparation and exact bounded pelvis/pivot readings; each goal wrapper and copied foot point/rotation is fresh.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The caller owns current goal wrappers; immutable prepared pelvis data remain with this problem and no time history is added.
   */
  planted: (x: Float64Array, knot: number, side?: "left" | "right") => walkStanceCourse.IPlanted[];

  /** One leg's own LEG-order indices for a knot indexed in the whole take.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Converts take knot/closed side to the original seven local solve indices, including the receding-window offset.
   * @evidence contracts/development/implementation.md#principled-implementation Subtracts this problem's held-prefix join and uses the original shared LEG slot mapping.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Window ownership stays here and the common terms table owns the slot layout.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains every original shared drop/trunk and side foot coordinate in the original order.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant seven-slot work and one result array.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the immutable side slot table; callers can prepare the fixed index list once per knot/side within this problem.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh index array and retains no query state.
   */
  variables: (knot: number, side: "left" | "right") => number[];

  /** First knot this problem moves, indexed in the complete take. */
  first: number;
}
