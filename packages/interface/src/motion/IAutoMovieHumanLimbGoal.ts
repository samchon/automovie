import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieSwivelSeed } from "../pose/IAutoMovieSwivelSeed";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieHumanEffectorPointLimit } from "./IAutoMovieHumanEffectorPointLimit";
import type { IAutoMovieHumanLimbReference } from "./IAutoMovieHumanLimbReference";
import type { IAutoMovieMotionHumanColliders } from "./IAutoMovieMotionHumanColliders";

/**
 * An arm or leg effector goal with its bend direction, optional contact
 * constraints and reference configuration. Coordinates are world metres unless
 * on names the posed bone frame; resolveHumanPosture admits attachment order
 * and fits the goal.
 */
export interface IAutoMovieHumanLimbGoal {
  /** Where the end joint (wrist or ankle) goes, world metres. */
  point: IAutoMovieVector3;

  /** A world point the middle joint (elbow or knee) bends toward. */
  bend: IAutoMovieVector3;

  /**
   * Where an arm's elbow goes when the law leaves it to the body: `"strain"`
   * takes, among the places that leave the hand's rotation error least, the one
   * where the arm strains least, read from the fit's own sweep
   * (`AutoMovieMotionHumanBend.strainOf`), with `bend` serving only where no
   * place is legal. `"placed"` says `bend` is itself the elbow's place, which
   * the law's own elbow search chose (`AutoMovieMotionHumanBend.solve`): the
   * fit takes the swivel that puts the elbow there, refined locally, and sweeps
   * only where that is not legal, so the place is searched once. Absent, `bend`
   * decides; a leg ignores it.
   */
  elbow?: IAutoMovieHumanLimbGoal.Elbow;

  /** The hand's or foot's world rotation from its rest, when the law sets it. */
  rotation?: IAutoMovieQuaternion;

  /** Whether the limb bears on a fixed contact the transition must not move. */
  planted?: boolean;

  /**
   * The contact the hand or foot turns about, in its rest frame relative to its
   * joint (a heel, a ball, a palm): when `rotation` cannot be met exactly
   * within the limb's range, the end joint is re-aimed so this point stays
   * where the goal puts it, and the rotation gives way, as a foot pivots on its
   * ball.
   */
  contact?: IAutoMovieVector3;

  /**
   * Points in the end joint's own frame whose world positions must remain
   * within their bounds of the asked frame. Requires rotation. These hard task
   * limits accompany the contact when a path is planned; a held tool names both
   * ends of its working line.
   */
  limits?: readonly IAutoMovieHumanEffectorPointLimit[];

  /**
   * The bone the goal is attached to, when it moves with the body rather than
   * staying in the world: `point` and `bend` are then in the bone's posed frame
   * (relative to its posed world position and rotation) and `rotation` composes
   * after the bone's. The resolver carries them into the world from the pose
   * being fitted, after the trunk, the head, any layer and any transition
   * offset have placed the bone, so a palm on the chin or in a pocket stays
   * there when breathing or a glance moves the body. A limb attached to another
   * limb's bone is fitted after it; a bone of the limb's own chain, or two
   * limbs attached to each other, is refused (`resolveHumanPosture.order`,
   * `resolveHumanPosture.world`).
   */
  on?: AutoMovieHumanoidBone;

  /**
   * The limb's own solution at one instant of the action the law names (the
   * grasp, the clasp, the placement): the clinical angles of its upper and
   * lower bones there, as `resolveHumanPosture.reference` reads them. Where the
   * goal can be met by more than one arm or leg configuration, the fit keeps
   * the one nearest this reference, so the limb stays on one side of the choice
   * for the whole stroke. It is a constant of the plan, never a previous frame,
   * so the pose stays a function of time alone. A degree of joint turn from the
   * reference counts like a degree of hand or foot rotation error, so a law
   * gives it in full from the named instant on (the hold after a grasp) and,
   * over the reach toward that instant, raises its `weight` from 0 to 1 with
   * the reach's own progress: the reference is that instant's solution, so the
   * reach arrives at it exactly, and on the way the growing weight keeps the
   * limb on the reference's side where two configurations nearly tie instead of
   * letting it switch between them.
   */
  reference?: IAutoMovieHumanLimbReference;

  /**
   * The swivel and bend branch the law's own plan places this limb at, at this
   * second: a course of the limb planned once over the action, a fit at each of
   * its knots continuing the one before from the limb as the action was
   * entered, and the course's continuous interpolation between them. Every
   * reader of the goal (the display, the arm planner's base, a law reading its
   * own posture's bones) places the limb there in closed form with no search,
   * so all of them read one limb. The plan guarantees it stands; a read never
   * refines it. None when absent: each reader fits the limb itself.
   */
  seed?: IAutoMovieSwivelSeed;

  /**
   * Another body's colliders, placed in the world, an arm keeps clear of on its
   * way and at its goal (a partner whose head, cheek or back the hand is sent
   * to): its forearm keeps the clearance it keeps from its own trunk, except
   * that the wrist's own depth in them excuses nothing, since no goal put the
   * wrist inside another person (`HumanArmClearance`). Ignored on a leg.
   */
  clear?: readonly IAutoMovieMotionHumanColliders.IPlaced[];

  /**
   * Colliders of subjects that are no human body (a prop, an animal: the horse
   * a rider's sabre must clear), placed in the world, which the arm keeps clear
   * of as it does `clear`, each named in a refusal by its subject and part.
   * Ignored on a leg.
   */
  clearExternal?: readonly IAutoMovieMotionHumanColliders.IExternal[];

  /**
   * Another body's colliders, placed in the world, the goal lays the hand on
   * (the partner's segment a palm rests on): the forearm keeps clear of them as
   * of `clear`, except that near the wrist it asks no more room than the goal
   * gives, since the goal puts the hand on their surface (`HumanArmClearance`).
   * Ignored on a leg.
   */
  rests?: readonly IAutoMovieMotionHumanColliders.IPlaced[];

  /**
   * The performer's own segments the hand is laid on (a pocket's thigh, a
   * holster's hip): on the hold the hand's and its digits' contact with them is
   * its placement, not a collision; the rest of the arm keeps clear of them.
   * None when absent.
   */
  restsOwn?: IAutoMovieHumanLimbGoal.OwnRests;

  /** Collider frames of a rigidly carried partner in this goal's `on` frame. */
  clearanceOn?: IAutoMovieHumanLimbGoal.IClearance;
}

/** Companion types of {@link IAutoMovieHumanLimbGoal}. */
export namespace IAutoMovieHumanLimbGoal {
  /** The performer's own bones a hand is laid on. */
  export type OwnRests = readonly AutoMovieHumanoidBone[];

  /** Clear and resting segments expressed in the goal's attachment frame. */
  export interface IClearance {
    /** Segments the arm clears throughout its fit. */
    clear: readonly IAutoMovieMotionHumanColliders.IPlaced[];

    /** Segments the hand is placed on, with the same allowances as `rests`. */
    rests: readonly IAutoMovieMotionHumanColliders.IPlaced[];
  }

  /**
   * How an arm's elbow is decided (`IAutoMovieHumanLimbGoal.elbow`): by its own
   * sweep's least strain, or at the place the law's elbow search chose.
   */
  export type Elbow = "strain" | "placed";
}
