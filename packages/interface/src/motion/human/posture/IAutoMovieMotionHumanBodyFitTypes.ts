import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanFitGoals } from "./IAutoMovieMotionHumanFitGoals";
import type { IAutoMovieMotionHumanJacobian } from "./IAutoMovieMotionHumanJacobian";
import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanSequentialConvex } from "./IAutoMovieMotionHumanSequentialConvex";

/**
 * A whole-body fit: the static posture nearest a preferred one in which points
 * of the body reach their goals, the parts that bear rest on the floor, nothing
 * passes under it, the centre of mass stands over the base of support and the
 * folded segments stay apart, all within the joint ranges and solved together:
 * the static multi-contact posture problem of Bouyarmane and Kheddar 2010 (IEEE
 * Humanoids, "Static multi-contact inverse problem for multiple humanoid robots
 * and manipulated objects") and Escande, Kheddar and Miossec 2013 (Robot Auton
 * Syst 61:428).
 *
 * The variables are any set of the posture's own (`HumanFitVariables`), the
 * whole body's when none is given, and the objective keeps them nearest the
 * preferred posture in joint space. A target brings a point riding a bone to a
 * world goal on the axes it names, a rotation to a goal, or, as a planar
 * contact, the contact frame's normal parallel to the surface's with its turn
 * about it free. Included angles between bone-carried landmarks and projections
 * of the physical centre of mass are constrained by the same fit, with their
 * own analytic Jacobians (`HumanFitGoals`). Goals may ride another bone, whose
 * frame and Jacobian move with the fit. A physical point radius is one distance
 * inequality, without widening it by the equality rows' numerical band
 * (`HumanFitTargets`). A bearing part touches the floor at its lowest point and
 * every other point of it stays out of the floor, so a rigid curved part rests
 * on one point and a planar contact's normal lays it flat. Every row is an
 * exact penalty at its price (an elastic l1 sequential quadratic program;
 * Fletcher 1985) linearised by the analytic Jacobian of the posed body
 * (`HumanJacobian`), and the merit (`HumanBodyFitMerit`) prices exactly what
 * the rows do, so the model and the merit agree at every iterate (Nocedal and
 * Wright 2006, section 18.5). The steps are taken by the shared penalty
 * sequential convex loop (`HumanSequentialConvex`), its penalty steered at each
 * iterate (Byrd, Nocedal and Waltz 2008), each convex model solved by the
 * shared quadratic program (`HumanQuadraticProgram`) inside a trust region,
 * with one second-order correction of a rejected step (Nocedal and Wright 2006,
 * (15.36) and Algorithm 15.2).
 */
export namespace IAutoMovieMotionHumanBodyFitTypes {
  /** One point or orientation goal on a bone. */
  export interface ITarget {
    /** The bone. */
    bone: AutoMovieHumanoidBone;

    /** The point in the bone's frame, metres; its origin when absent. */
    point?: IAutoMovieVector3;

    /** The bone carrying the goal frame; world coordinates when absent. */
    on?: AutoMovieHumanoidBone;

    /** Where it goes, metres in the goal frame. */
    goal: IAutoMovieVector3;

    /**
     * The goal-frame axes it is held on; all three when absent, none for a
     * target that holds only a rotation or a normal.
     */
    axes?: readonly ("x" | "y" | "z")[];

    /**
     * Allowed Euclidean point distance over the selected axes, finite
     * nonnegative metres; componentwise exact contact when absent.
     */
    bound?: number;

    /**
     * Its price per millimetre missed, and per milliradian for a turn; `PRICE`,
     * the floor's, when absent.
     */
    price?: number;

    /**
     * The bone's rotation in the goal frame it is brought to as well; none when
     * absent.
     */
    rotation?: IAutoMovieQuaternion;

    /**
     * A planar contact's normal: the contact frame's normal in the bone's frame
     * (`local`, the palm socket's for a hand, the plantar side for a foot or
     * its toes) brought parallel to a goal-frame normal (`world`, away from the
     * surface it lies on), its turn about that normal left free. None when
     * absent.
     */
    normal?: {
      /**
       * Contact normal direction in the constrained bone's local frame;
       * HumanFitTargets normalises it before angular comparison.
       */
      local: IAutoMovieVector3;
      /**
       * Required normal direction in the goal frame: the on bone's frame when
       * supplied, world coordinates otherwise; normalised for comparison.
       */
      world: IAutoMovieVector3;
    };
  }

  /** The fitted posture and residuals measured on it. */
  export interface IResult {
    /**
     * The fitted root, heading and joint coordinates, with no unresolved limb
     * goals.
     */
    posture: IAutoMovieMotionHumanPosture;

    /**
     * Each target's actual point distance in millimetres over its selected
     * axes, without subtracting a permitted radius, and rotation or normal
     * error in degrees; laws compare these with their declared physical
     * bounds.
     */
    residuals: IAutoMovieMotionHumanBodyFitTypes.IResidual[];

    /**
     * How far the centre of mass lies outside the base of support, millimetres;
     * nought when inside or unasked.
     */
    balance: number;

    /**
     * Whether every requested physical constraint holds at the returned posture
     * to the fit's existing row tolerance.
     */
    feasible: boolean;

    /**
     * Whether the loop ended converged (sco's `OPT_CONVERGED`) at a posture
     * meeting every row to the tolerance.
     */
    converged: boolean;

    /**
     * Distance outside each included-angle goal or interval, degrees, in goal
     * order.
     */
    angles: number[];

    /**
     * Euclidean centre-position residual over the requested axes, millimetres;
     * zero when unasked.
     */
    centre: number;

    /** How the loop ended (sco's `OptStatus`). */
    reason: IAutoMovieMotionHumanSequentialConvex.Status;
  }

  /** One target's residual measured on the fitted posture. */
  export interface IResidual {
    /**
     * This target's Euclidean point error over selected axes, MILLIMETRES,
     * without subtracting the allowed radius.
     */
    point: number;

    /**
     * This target's rotation or normal-direction residual norm, degrees; zero
     * when neither is requested.
     */
    turn: number;
  }

  /** One whole-body static contact problem. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /**
     * The preferred root, heading and joint coordinates, with limb goals
     * already resolved into joints.
     */
    posture: IAutoMovieMotionHumanPosture;

    /**
     * The explicit posture the solve starts from: the previous stance's
     * solution, or the preferred posture when absent.
     */
    start?: IAutoMovieMotionHumanPosture;

    /**
     * The variables moved; the whole body's (`HumanFitVariables.BODY`) when
     * absent.
     */
    variables?: readonly IAutoMovieMotionHumanJacobian.IVariable[];

    /** The goals. */
    targets?: readonly IAutoMovieMotionHumanBodyFitTypes.ITarget[];

    /**
     * Included geometric angles constrained together with contacts and joint
     * ranges.
     */
    angles?: readonly IAutoMovieMotionHumanFitGoals.IAngle[];

    /** A world position of the physical centre of mass, on its selected axes. */
    centre?: IAutoMovieMotionHumanFitGoals.ICentre;

    /**
     * Each part that bears on the floor, as the bones it bears through; none
     * when absent. Every other collider is kept out of the floor either way.
     */
    bearing?: readonly RegExp[];

    /**
     * Whether the centre of mass is kept over the base of support
     * (`HumanFitBalance`), at the floor's price: `true` over the feet's bearing
     * outline, or over the hull of the points of the bearing parts named (each
     * of `bearing` that one of `parts` matches by its pattern's source), every
     * support candidate of theirs within the bearing margin of the part's
     * lowest; not when absent.
     */
    balance?:
      | boolean
      | {
          /**
           * Patterns selecting which bearing parts contribute support
           * candidates to the balance hull; matched against each bearing
           * pattern's source.
           */
          parts: readonly RegExp[];
        };
  }
}
