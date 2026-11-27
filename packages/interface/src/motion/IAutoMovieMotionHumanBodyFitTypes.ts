import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "./IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanColliders } from "./IAutoMovieMotionHumanColliders";
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
 * on one point and a planar contact's normal lays it flat. Required targets are
 * hard bounds in each quadratic step. Other rows carry an exact penalty at
 * their price (an elastic l1 sequential quadratic program; Fletcher 1985)
 * linearised by the analytic Jacobian of the posed body (`HumanJacobian`), and
 * the merit (`HumanBodyFitMerit`) prices exactly what the rows do, so the model
 * and the merit agree at every iterate (Nocedal and Wright 2006, section 18.5).
 * The steps are taken by the shared penalty sequential convex loop
 * (`HumanSequentialConvex`), its penalty steered at each iterate (Byrd, Nocedal
 * and Waltz 2008), each convex model solved by the shared quadratic program
 * (`HumanQuadraticProgram`) inside a trust region, with one second-order
 * correction of a rejected step (Nocedal and Wright 2006, (15.36) and Algorithm
 * 15.2).
 */
export namespace IAutoMovieMotionHumanBodyFitTypes {
  /** One point or orientation goal on a bone in a fixed or carried frame. */
  export type ITarget = ITargetGoal & (ITargetBoneFrame | ITargetFixedFrame);

  /** A world goal or a goal in the current frame of a named bone. */
  interface ITargetBoneFrame {
    /** The bone carrying the goal frame. Omission leaves it in world axes. */
    on?: AutoMovieHumanoidBone;

    /** A bone-frame goal does not carry a fixed frame. */
    frame?: never;
  }

  /** A goal in a rigid scene frame held fixed throughout this static fit. */
  interface ITargetFixedFrame {
    /**
     * The world placement of the goal axes and coordinates, held constant
     * during the fit.
     */
    frame: IAutoMovieRigidTransform;

    /** A fixed-frame goal does not follow a moving bone. */
    on?: never;
  }

  /** The point, axes and optional turns shared by all target frames. */
  interface ITargetGoal {
    /** The bone. */
    bone: AutoMovieHumanoidBone;

    /** The point in the bone's frame, metres; its origin when absent. */
    point?: IAutoMovieVector3;

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
     * Hold this target in each linearised step and verify it from the final
     * pose. Start the fit close enough to meet the target within its trust
     * box.
     */
    required?: true;

    /**
     * The soft goal's price per millimetre or milliradian missed; `PRICE`, the
     * floor's, when absent.
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
       * Required normal direction in the goal's world, fixed or carried frame,
       * normalised for comparison.
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

    /** The closest exterior pair the fit read, when present. */
    exterior?: IExteriorResidual;

    /** Actual selected pairs of the requested exterior contacts, when present. */
    exteriorContacts?: readonly IExteriorContactResidual[];

    /**
     * How far the centre of mass lies outside the base of support, millimetres;
     * nought when inside or unasked.
     */
    balance: number;

    /**
     * Whether every requested constraint holds at the returned posture.
     * Exterior colliders must have nonnegative signed separation.
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

  /** Actual body and scene colliders kept apart during a static fit. */
  export interface IExterior {
    /** Body bones whose physical profile colliders must clear the obstacles. */
    bones: ReadonlySet<AutoMovieHumanoidBone>;

    /** Fixed scene colliders in the same world frame as the fitted posture. */
    obstacles: readonly IAutoMovieMotionHumanColliders.IExternal[];

    /** The named body-to-scene groups whose minimum signed gap must be zero. */
    contacts?: readonly IExteriorContact[];

    /**
     * Nonbearing bones whose ordinary pairs aim one solver precision inside
     * nonpenetration. Named contact groups keep their own contact bounds.
     */
    clearanceBones?: ReadonlySet<AutoMovieHumanoidBone>;
  }

  /** A required contact between body colliders and one named material part. */
  export interface IExteriorContact {
    /** Bones in the exterior selection whose actual shapes may bear together. */
    bone:
      | AutoMovieHumanoidBone
      | readonly [AutoMovieHumanoidBone, ...AutoMovieHumanoidBone[]];

    /** The fixed material's scene subject. */
    subject: string;

    /** The subject's physical part whose shapes may carry the contact. */
    part: string;
  }

  /** One actual exterior separation read at the fitted posture. */
  export interface IExteriorResidual {
    /** Signed separation, metres. Negative measures penetration. */
    separation: number;

    /** The body bone carrying the measured collider. */
    bone: AutoMovieHumanoidBone;

    /** The obstacle's scene subject. */
    subject: string;

    /** The measured part of that subject. */
    part: string;
  }

  /** A selected contact's surface witnesses read in the final world pose. */
  export interface IExteriorContactResidual extends IExteriorResidual {
    /** Unit normal from the body collider toward the material collider. */
    normal: IAutoMovieVector3;

    /** The point on the body collider's surface, world metres. */
    pointA: IAutoMovieVector3;

    /** The point on the named material's surface, world metres. */
    pointB: IAutoMovieVector3;
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

    /** Exterior collider pairs held at a signed gap of zero or more metres. */
    exterior?: IExterior;

    /**
     * Omit the default deep-fold pairs when a larger plan fits those parts
     * separately.
     */
    self?: false;

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
