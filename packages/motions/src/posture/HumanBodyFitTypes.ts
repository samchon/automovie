import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanFitGoals } from "./HumanFitGoals";
import type { HumanJacobian } from "./HumanJacobian";
import type { HumanSequentialConvex } from "./HumanSequentialConvex";
import type { IHumanPosture } from "./IHumanPosture";

/**
 * Requests and measured outcomes of the whole-body contact fit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes point, orientation, angle, centre and support constraints and their reported residuals.
 * @evidence contracts/development/design.md#principled-representation Body-carried targets and physical constraints enter one static multi-contact fit, in world metres and degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The three existing HumanBodyFit public types, factored here to keep the numerical owner below its source-size bound.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, Jacobian variables and geometric-goal owners rather than cloning their types.
 */
export namespace HumanBodyFitTypes {
  /**
   * One point or orientation goal on a bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member gives its coordinate frame, units and absence convention.
   * @evidence contracts/development/design.md#principled-representation A rigid bone-local effector is constrained in a world or bone-carried goal frame; a physical radius bounds its Euclidean error separately from numerical equality precision.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The same fields read by the rows and merit.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Bone names use the canonical closed vocabulary and rotations use the existing quaternion type.
   */
  export interface ITarget {
    /** The bone. */
    bone: AutoMovieHumanoidBone;

    /** The point in the bone's frame, metres; its origin when absent. */
    point?: IAutoMovieVector3;

    /** The bone carrying the goal frame; world coordinates when absent. */
    on?: AutoMovieHumanoidBone;

    /** Where it goes, metres in the goal frame. */
    goal: IAutoMovieVector3;

    /** The goal-frame axes it is held on; all three when absent, none for a target that holds only a rotation or a normal. */
    axes?: readonly ("x" | "y" | "z")[];

    /** Allowed Euclidean point distance over the selected axes, finite nonnegative metres; componentwise exact contact when absent. */
    bound?: number;

    /** Its price per millimetre missed, and per milliradian for a turn; `PRICE`, the floor's, when absent. */
    price?: number;

    /** The bone's rotation in the goal frame it is brought to as well; none when absent. */
    rotation?: IAutoMovieQuaternion;

    /**
     * A planar contact's normal: the contact frame's normal in the bone's
     * frame (`local`, the palm socket's for a hand, the plantar side for a
     * foot or its toes) brought parallel to a goal-frame normal (`world`, away
     * from the surface it lies on), its turn about that normal left free.
     * None when absent.
     */
    normal?: { local: IAutoMovieVector3; world: IAutoMovieVector3 };
  }

  /**
   * The fitted posture and residuals measured on it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States every residual's unit and the convergence outcome.
   * @evidence contracts/development/design.md#principled-representation Residuals are measured after the fitted variables are written, not taken from a linear subproblem.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Posture, convergence reason and each requested constraint family's residuals.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unmet constraints remain visible even when the numerical loop stops.
   */
  export interface IResult {
    /** The fitted root, heading and joint coordinates, with no unresolved limb goals. */
    posture: IHumanPosture;

    /** Each target's actual point distance in millimetres over its selected axes, without subtracting a permitted radius, and rotation or normal error in degrees; laws compare these with their declared physical bounds. */
    residuals: { point: number; turn: number }[];

    /** How far the centre of mass lies outside the base of support, millimetres; nought when inside or unasked. */
    balance: number;

    /** Whether the loop settled (its model's own accuracy or a step under the least) at a posture meeting every row to the tolerance. */
    converged: boolean;

    /** Distance outside each included-angle goal or interval, degrees, in goal order. */
    angles: number[];

    /** Euclidean centre-position residual over the requested axes, millimetres; zero when unasked. */
    centre: number;

    /** Why the loop stopped. */
    reason: HumanSequentialConvex.Reason;
  }

  /**
   * One whole-body static contact problem.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input posture, variables, all supported goals and bearing and balance conventions.
   * @evidence contracts/development/design.md#principled-representation Contacts, angle relationships and a physical centre target are constraints on the same posture variables.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only current solver inputs; the sprint set is the consumer requiring angles and a positional centre.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Named goals do not alter the rig's joint ranges or substitute a bone for the mass centre.
   */
  export interface IProps {
    /** The body. */
    body: IHumanBody;

    /** The preferred root, heading and joint coordinates, with limb goals already resolved into joints. */
    posture: IHumanPosture;

    /** The explicit posture the solve starts from: the previous stance's solution, or the preferred posture when absent. */
    start?: IHumanPosture;

    /** The variables moved; the whole body's (`HumanFitVariables.BODY`) when absent. */
    variables?: readonly HumanJacobian.IVariable[];

    /** The goals. */
    targets?: readonly ITarget[];

    /** Included geometric angles constrained together with contacts and joint ranges. */
    angles?: readonly HumanFitGoals.IAngle[];

    /** A world position of the physical centre of mass, on its selected axes. */
    centre?: HumanFitGoals.ICentre;

    /** Each part that bears on the floor, as the bones it bears through; none when absent. Every other collider is kept out of the floor either way. */
    bearing?: readonly RegExp[];

    /**
     * Whether the centre of mass is kept over the base of support
     * (`HumanFitBalance`), at the floor's price: `true` over the feet's
     * bearing outline, or over the hull of the points of the bearing parts
     * named (each of `bearing` that one of `parts` matches by its pattern's
     * source), every support candidate of theirs within the bearing margin
     * of the part's lowest; not when absent.
     */
    balance?: boolean | { parts: readonly RegExp[] };
  }
}
