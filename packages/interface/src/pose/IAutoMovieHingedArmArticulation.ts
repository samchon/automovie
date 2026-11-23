import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieHingedChainGeometry } from "./IAutoMovieHingedChainGeometry";
import type { IAutoMovieSwivelNear } from "./IAutoMovieSwivelNear";

/**
 * Geometry and scoring policy for a hinged chain's swivel search. Callers
 * supply finite geometry, unit rest rotations and valid ranges; the solver
 * checks continuation tolerance and returns null for its documented degenerate
 * geometry.
 */
export namespace IAutoMovieHingedArmArticulation {
  /**
   * Two-bone arm IK whose mid joint bends only about its own flexion hinge,
   * with the chain root's free swivel spent on the rig's range of motion.
   *
   * The elbow rotates by `θ` about `hinge` alone, so its abduction and twist
   * decompose to zero, which is what an elbow's immobile axes require, and the
   * bend plane is the hinge's own plane. Splitting the far segment into the
   * part along the hinge and the part it swings gives the root-to-effector
   * span
   *
   *     |m(θ)|² = k + α·cos θ + β·sin θ
   *
   * So the span equals the target distance where `R·cos(θ − φ) = distance² −
   * k`, with `R = hypot(α, β)` and `φ = atan2(β, α)`: an arccos whose two roots
   * are the chain's two bend branches. A target outside the reachable span
   * takes the fully extended or fully folded root, so the effector stops on the
   * reachable shell along the line to the target. A root outside the mid
   * joint's own `range` stops at the nearer limit in the same way, the effector
   * resting on the legal shell along that line and the result reporting the
   * `shortfall`; of two branches the one stopping nearer the target is swept,
   * because a candidate past the hinge's limit would be clamped by the caller
   * afterwards and land somewhere no candidate was scored at.
   *
   * The root joint first aims `m(θ)` at the target, then any extra rotation
   * about `m(θ)` leaves the effector where it is. The function sweeps that
   * swivel in `SWIVEL_STEP` increments on each branch, ordering candidates by
   * the least `overshoot` (legal, zero, ahead of any other exactly; two
   * positive ones tied within the decomposition's rounding,
   * `OVERSHOOT_ROUNDING`), then the least `deviation`, both from `score`. Every
   * local minimum of a sweep is then refined between its neighbouring steps by
   * golden-section search under the same ordering, and the best of the sweeps
   * and the refinements is returned. A pass whose two probes tie closes the
   * bracket onto both, so a request mirrored left to right, whose probes are
   * the same two exchanged, refines to the mirrored swivel. So the chosen pose
   * follows a moving target continuously rather than in swivel steps, a legal
   * interval narrower than one step is still found from the dip it leaves in
   * the sweep, and between two basins the truly better one wins rather than the
   * one a sample happened to fall nearer the bottom of. The caller owns the
   * decomposition and the rig's ROM, so the geometry here holds no rig policy.
   *
   * A caller that can certify swivels its score refuses (`excluded`) spares
   * their scoring, and the pose is still the full sweep's. A step is skipped
   * when every swivel within two steps of it is refused, and a step whose
   * bracket, a step either way, is refused is not refined; every other step is
   * scored and compared with its true neighbours, since a step that is not
   * skipped and could be refined has both neighbours scored. When the pruned
   * sweep finds a legal candidate, the full sweep's answer is that candidate: a
   * refused swivel, a step or a refinement inside a refused bracket, is never
   * legal, so it can never be ahead of a legal candidate (legality is compared
   * exactly); every legal candidate of the full sweep is a scored step or the
   * refinement of a step that is scored with the same neighbours, so it is the
   * same candidate in both; and the ordering among legal candidates, met in the
   * same order, is the same. When the pruned sweep finds none, the full sweep
   * decides, so a chain that cannot reach legally still returns its least
   * overshoot.
   *
   * A caller continuing a fit of a nearby target (`near`) skips the sweep: the
   * seed's branch, its swivel refined within one step either way by the same
   * golden-section search under the same ordering, to the seed's `tolerance`
   * (`IAutoMovieSwivelNear`). Every result names its branch and swivel, the
   * seed a nearby fit continues from.
   *
   * Returns `null` for a degenerate chain: a mid or end offset shorter than
   * `1e-6`, a target within `1e-6` of the chain root, a hinge shorter than
   * `1e-6`, or `R` below `1e-9`, a hinge parallel to the far segment that
   * cannot change the span ({@link armChainFault} reports that rig).
   */
  export type IProps = IAutoMovieHingedChainGeometry & {
    /**
     * Score one candidate's bone-local root and mid rotations: `overshoot` is
     * the total ROM overshoot in degrees, compared first, and `deviation` the
     * effort tie-break, compared second. The caller owns the decomposition
     * convention and the rig's constraints. With `exact`, `deviation` is a
     * lower bound of the tie-break and `exact` gives it exactly: a caller whose
     * tie-break ends in a costly non-negative term passes the rest as the
     * bound, and the term is computed only for a comparison the bound cannot
     * decide. With `tie`, `tiebreak` is a second key: two deviations within
     * `tie` of each other are one, and the lesser `tiebreak` decides (task
     * priority, Siciliano and Slotine 1991: the second objective only among the
     * first's optima). Scoring is synchronous and may evaluate many candidates;
     * the callback must be deterministic, leave its borrowed rotations
     * unchanged and return finite scores. Exceptions abort the solve, and no
     * score callback is kept after the result is returned.
     */
    score: (
      upper: IAutoMovieQuaternion,
      lower: IAutoMovieQuaternion,
    ) => {
      /**
       * Nonnegative total ROM excess in degrees, with zero strictly preferred
       * over every positive value.
       */
      overshoot: number;
      /**
       * Finite effort objective in caller-defined units, or a lower bound when
       * exact is supplied.
       */
      deviation: number;
      /**
       * Lazy exact deviation, no smaller than the bound. Called at most once
       * per scored candidate, synchronously during comparison; exceptions
       * propagate and the callback is not retained after the solve.
       */
      exact?: () => number;
      /**
       * Lazy secondary objective in caller-defined units when tie is supplied;
       * missing means zero. Cached per candidate within this solve, with
       * exceptions propagated.
       */
      tiebreak?: () => number;
    };

    /**
     * Given the root's bone-local rotation at a swivel on one bend branch,
     * degrees, a test of whether every swivel from `low` to `high` degrees is
     * certain to score a positive `overshoot` (`boxExcludedSwivels`); omitted,
     * every step is scored. Only a certainty may be returned: the returned pose
     * is then the one the full sweep gives. The factory and returned predicate
     * run synchronously during this solve; exceptions propagate and neither is
     * retained after return. They must not mutate rotations supplied by upper.
     */
    excluded?: (
      upper: (swivel: number) => IAutoMovieQuaternion,
    ) => (low: number, high: number) => boolean;

    /**
     * The seed of a fit of a nearby target to continue
     * (`IAutoMovieSwivelNear`): its branch, or the last branch when the target
     * has fewer (two branches meet at the span's ends), and its swivel refined
     * within one step either way to its tolerance, with no sweep; omitted,
     * every swivel is swept.
     */
    near?: IAutoMovieSwivelNear;

    /**
     * How far apart two deviations may lie and still be one, the unit of
     * `deviation`, for a score with a second key (`tiebreak`); omitted,
     * deviations are compared exactly and `tiebreak` is not read.
     */
    tie?: number;
  };
}
