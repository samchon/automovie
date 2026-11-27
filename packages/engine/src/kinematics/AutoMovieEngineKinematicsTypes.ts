import type {
  AutoMovieHumanoidBone,
  IAutoMovieHingedArmArticulation,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { hingedArmSwivel } from "./hingedArmSwivel";

/** Independent, type-only contracts for AutoMovieEngineKinematics operations. */
export namespace AutoMovieEngineKinematicsTypes {
  /** Current axes and limits already selected by the ordinary arm scorer. */
  export interface IReadPreparedBendClinicalInput {
    /** Bone identifier for the upper arm. */
    upperBone: AutoMovieHumanoidBone;
    /** Bone identifier for the lower arm. */
    lowerBone: AutoMovieHumanoidBone;
    /** Bone identifier for the hand. */
    handBone: AutoMovieHumanoidBone;
    /** Joint basis used to read the upper arm bend. */
    upperBasis: IAutoMovieJointAxes;
    /** Joint basis used to read the lower arm bend. */
    lowerBasis: IAutoMovieJointAxes;
    /** Prepared angular axes for the lower arm. */
    lowerAxes: IAutoMovieJointAxes;
    /** Prepared angular axes for the hand. */
    handAxes: IAutoMovieJointAxes;
    /** Upper arm joint constraint, or null when absent. */
    upperRange: IAutoMovieJointConstraint | null;
    /** Lower arm joint constraint, or null when absent. */
    lowerRange: IAutoMovieJointConstraint | null;
    /** Hand joint constraint, or null when absent. */
    handRange: IAutoMovieJointConstraint | null;
  }
  /**
   * Inputs for the hinged two-bone articulation solver.
   *
   * The solver's props: the interface chain and target with the engine's
   * certificates and prepared geometry.
   */
  export interface IAutoMovieEngineKinematicsHingedArmArticulationProps extends Omit<
    IAutoMovieHingedArmArticulation.IProps,
    "score" | "tie"
  > {
    /**
     * A seed the caller holds for a cold fit, a branch and swivel it chose for
     * a nearby target: never the answer by itself, only a legal candidate whose
     * exact deviation starts the bounded sweep's stop (`hingedSwivelBounded`),
     * which keeps it only where the sweep's choice is legal and no worse than
     * it; read only with `bound`, never with `near`.
     */
    incumbent?: IAutoMovieSwivelSeed;

    /**
     * Score one candidate's bone-local root and mid rotations: `overshoot` is
     * the total ROM overshoot in degrees, compared first, and `deviation` the
     * effort tie-break, compared second. The caller owns the decomposition
     * convention and the rig's constraints. With `exact`, `deviation` is a
     * lower bound of the tie-break and `exact` gives it exactly: a caller whose
     * tie-break ends in a costly non-negative term passes the rest as the
     * bound, and the term is computed only for a comparison the bound cannot
     * decide. With `tie`, `tiebreak` is a second key: two deviations in one
     * bucket of width `tie` are one, and the lesser `tiebreak` decides (task
     * priority, Siciliano and Slotine 1991: the second objective only among the
     * first's optima), so `exact` need then be right only to its bucket. The
     * score and its lazy readers describe the same unchanged objective
     * throughout this synchronous solve. The candidate's swivel, degrees, and
     * its branch's poser are passed for a caller that reads them.
     */
    score: (
      upper: IAutoMovieQuaternion,
      lower: IAutoMovieQuaternion,
      swivel: number,
      posed: ReturnType<typeof hingedArmSwivel.pose>,
    ) => {
      overshoot: number;
      deviation: number;
      exact?: () => number;
      tiebreak?: () => number;
    };

    /**
     * Given the root's bone-local rotation at a swivel on one bend branch,
     * degrees, and that branch's poser, a certified lower bound of the exact
     * `deviation` of every candidate at a swivel from `low` to `high` degrees;
     * omitted, every step is scored. The cold sweep then scores only the steps
     * the bound cannot place behind a legal candidate (`hingedSwivelBounded`),
     * with the full sweep's choice: under a `tie` by the deviation's bucket,
     * and after the `minimum` certificate's test of the sweep's first
     * candidate.
     */
    bound?: (
      upper: (swivel: number) => IAutoMovieQuaternion,
      posed: ReturnType<typeof hingedArmSwivel.pose>,
    ) => (low: number, high: number) => number;

    /**
     * Given a branch's poser, the closed-form start swivel, degrees: the pole
     * (mid joint toward the hint) or a term's own minimiser; null when none. A
     * cold fit with no `tie` or `minimum` searches from it (`hingedSwivelPole`)
     * and returns a legal result that `met` accepts; otherwise the sweep
     * decides.
     */
    pole?: (posed: ReturnType<typeof hingedArmSwivel.pose>) => number | null;

    /**
     * Given a branch's poser, every swivel on it, degrees, at which a requested
     * term that only isolated swivels can meet is met (`immobileAxisSwivels`),
     * in closed form; null or none when the analysis does not apply. A cold fit
     * with no `tie` or `minimum` scores those candidates alone and returns the
     * best when it is legal and `met` accepts it; otherwise the pole start and
     * the sweep decide as without it.
     */
    closed?: (
      posed: ReturnType<typeof hingedArmSwivel.pose>,
    ) => readonly number[] | null;

    /**
     * Given a branch's poser and a swivel, degrees, the swivel to which a
     * requested term met over intervals of swivels continues the interval the
     * seed was admitted in, in closed form: the given swivel itself where it is
     * admissible; null where the analysis does not apply or that interval
     * vanished. A continued fit centres its search there (`hingedSwivelNear`).
     */
    nearest?: (
      posed: ReturnType<typeof hingedArmSwivel.pose>,
      swivel: number,
    ) => number | null;

    /**
     * Whether a pole-started result meets every requested term; absent,
     * legality alone decides.
     */
    met?: (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion) => boolean;

    /**
     * Given a branch's poser, whether it is certain that no candidate on the
     * branch passes `met` (a certified lower bound of the requested term's miss
     * above its tolerance at every swivel). Where every branch is so certified,
     * a cold fit skips the pole start, whose result `met` would refuse, and the
     * sweep decides at once; omitted, nothing is certified.
     */
    unmet?: (posed: ReturnType<typeof hingedArmSwivel.pose>) => boolean;

    /**
     * Given a branch's root rotation by swivel, degrees, the swivels at which
     * each of the root joint's limits is least violated, in closed form
     * (`boxLeastSwivels`); null where the analysis does not apply. Read only by
     * a cold fit whose certified refusal (`excluded`) refuses every swivel of
     * every swept branch: no candidate is legal, and the least overshoot is
     * searched for locally from the best of these swivels instead of by the
     * sweep. A caller whose overshoot adds a term the root's limits do not
     * bound (an obstruction) omits it, since that term's least lies elsewhere.
     */
    least?: (
      upper: (swivel: number) => IAutoMovieQuaternion,
    ) => readonly number[] | null;

    /**
     * Called once with the answer's branch poser and swivel, degrees, before
     * the answer returns: a caller that reads its own closed forms at the
     * chosen swivel (the arc its requested end rotation is admitted in) reads
     * them there. Never called for a degenerate chain.
     */
    chosen?: (
      posed: ReturnType<typeof hingedArmSwivel.pose>,
      swivel: number,
    ) => void;

    /**
     * Whether `pole` is a place the law's own elbow search chose
     * (`IAutoMovieFitChainToTargetProps.placed`), authoritative as a hint is
     * not: a cold fit answers at the pole where it is legal and at the legal
     * swivel nearest it otherwise, on any branch; a continued fit walks from
     * its seed toward the pole and answers at the pole or at the edge of the
     * legal interval the seed lies in. Only where no swivel is legal does the
     * sweep decide. Read only with `pole`.
     */
    placed?: boolean;

    /**
     * Whether the score is the start's own term alone, so an unrefused start is
     * the answer.
     */
    direct?: boolean;

    /**
     * The positive width of the buckets two deviations are one in, the unit of
     * `deviation`, for a score with a second key (`tiebreak`); omitted,
     * deviations are compared exactly and `tiebreak` is not read.
     */
    tie?: number;

    /**
     * Certified global lower bounds of every actual score in this solve;
     * omission keeps the complete search. With no second key, only the original
     * first coarse candidate may stop early after both keys equal these bounds
     * exactly. The score and all raw inputs must already be admitted; this is a
     * mathematical certificate, not a reach or convergence tolerance.
     */
    minimum?: { overshoot: number; deviation: number };

    /**
     * Exact source/target geometry of this same unchanged chain, point and
     * hinge range.
     */
    prepared?: hingedArmSwivel.IPreparedTarget;
  }

  /**
   * Velocity records exchanged by native FK derivatives and mass reduction.
   *
   * One rigid frame's velocity in the resolved bones' common coordinate frame.
   * Angular and linear rates are simultaneous, with explicit zero vectors for a
   * producer-proven fixed frame. Finite admission belongs to propagation.
   */
  export interface IAutoMovieEngineKinematicsBoneRate {
    /** Velocity at the bone origin, common-frame metres per second. */
    linear: IAutoMovieVector3;

    /** World angular velocity, common-frame radians per second. */
    angular: IAutoMovieVector3;
  }

  /**
   * The FK root placement's instantaneous common-frame motion. Position is the
   * actual pose.root translation, or the common origin for null placement; the
   * derivative producer must independently prove its supplied rates.
   */
  export interface IAutoMovieEngineKinematicsRootRate extends IAutoMovieEngineKinematicsBoneRate {
    /** Reference point for linear velocity, common-frame metres. */
    position: IAutoMovieVector3;
  }

  /**
   * Numerical differential-equality outcomes without curve-admission flags.
   *
   * Actual solved relation and diagnostics, or the precise numerical refusal
   * category.
   */
  export type IAutoMovieEngineKinematicsSolveResolvedRateResult =
    | IAutoMovieEngineKinematicsSolveResolvedRateSolved
    | IAutoMovieEngineKinematicsSolveResolvedRateRefusal;

  /** A named tagged refusal for invalid, singular, or unrepresentable systems. */
  export interface IAutoMovieEngineKinematicsSolveResolvedRateRefusal {
    /**
     * Unsupported means invalid/non-square inputs; singular is the existing
     * LU pivot gate; unrepresentable means arithmetic or diagnostics lost
     * finite/nonzero data.
     */
    status: "unsupported" | "singular" | "unrepresentable";
  }
  /**
   * All arrays are fresh; no returned diagnostic is a certified physical error
   * bound.
   */
  export interface IAutoMovieEngineKinematicsSolveResolvedRateSolved {
    /**
     * Actual completed square numerical solve, subject to the measured
     * diagnostics.
     */
    status: "solved";
    /** Coordinate units/second, in the supplied Jacobian's column order. */
    velocity: number[];
    /** J*velocity-goalRate, in each original task row's units/second. */
    residual: number[];
    /** (J/rowScale)*velocity-goalRate/rowScale, in scaled row units/second. */
    scaledResidual: number[];
    /** ||A||inf times the computed inverse's infinity norm, A=J/rowScale; an estimate, not a certified upper bound. */
    conditionEstimate: number;
    /**
     * Computed ||A*computedInverse-I||inf, without a rigorous rounding
     * enclosure.
     */
    inverseDefect: number;
    /**
     * Max_i abs(originalResidual_i)/(abs(J)*abs(velocity)+abs(goalRate))_i;
     * exact 0/0 is represented by zero.
     */
    componentwiseBackwardError: number;
    /** ||scaledResidual||inf/(||A||inf\*||velocity||inf+||goalRate/rowScale||inf); exact 0/0 is zero. */
    normwiseBackwardError: number;
  }


}