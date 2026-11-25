import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/**
 * Independent endpoint goals, bounded chain-fitting inputs and residual-bearing
 * motor poses.
 */
export namespace IAutoMovieSolvePhysicalChainTarget {
  /**
   * A proximal-to-distal physical chain and an independent world endpoint goal.
   *
   * Goal and optional terminal localPoint are metres; iterations is an integer
   * in [1,64] and tolerance a positive finite metre residual.
   * solvePhysicalChainTarget borrows the admitted profile and pose record, then
   * detaches only pose shells it writes; omitted localPoint targets the
   * terminal bone origin. The producer validates the budget, finite goal and
   * chain length of at least two; caller admission owns coherent chain topology
   * and complete poses. The original endpoint goal remains unchanged when
   * unreachable.
   */
  export type IInput = {
    /** Admitted physical tree and angular coordinates. */
    profile: IAutoMoviePhysicalProfile;

    /** Proximal-to-distal support path. */
    chain: readonly string[];

    /**
     * Borrowed admitted world placements. The solver copies the record and
     * detaches written branches; untouched poses remain shared in its result.
     */
    targets: Readonly<Record<string, IAutoMovieRigidTransform>>;

    /**
     * Fixed requested terminal support point in world metres; retained as the
     * residual reference even when unreachable.
     */
    goal: IAutoMovieVector3;

    /**
     * Optional terminal bone-local support offset in metres; omission selects
     * the terminal bone origin.
     */
    localPoint?: IAutoMovieVector3;

    /** Fixed coordinate-descent iteration budget, integer 1..64. */
    iterations: number;

    /** Metre early-out residual; no target is silently relocated. */
    tolerance: number;
  };

  /**
   * World motor-goal poses after bounded chain fitting and the remaining
   * endpoint error.
   *
   * Residual is the Euclidean world distance in metres between the fitted
   * terminal support point and the unchanged requested goal.
   * solvePhysicalChainTarget creates a new target record and detaches changed
   * pose shells; unchanged branches still borrow the input poses and must not
   * be mutated through this result. The solve projects all declared joint
   * coordinates while updating descendants; budget exhaustion may leave nonzero
   * error. Results do not change solved bodies or certify achieved contact.
   */
  export type IResult = {
    /**
     * New motor-goal record in world metres/unit rotations; unchanged pose
     * branches are borrowed from input and must be treated as read-only.
     */
    targets: Record<string, IAutoMovieRigidTransform>;

    /**
     * Remaining Euclidean distance to the original world endpoint goal, metres;
     * may exceed tolerance.
     */
    residual: number;
  };
}
