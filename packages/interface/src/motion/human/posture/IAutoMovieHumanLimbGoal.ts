import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieHumanEffectorPointLimit } from "./IAutoMovieHumanEffectorPointLimit";
import type { IAutoMovieHumanLimbReference } from "./IAutoMovieHumanLimbReference";
import type { IAutoMovieMotionHumanColliders } from "./IAutoMovieMotionHumanColliders";

/**
 * An arm or leg effector goal with its bend direction, optional contact constraints and reference configuration. Coordinates are world metres unless on names the posed bone frame; resolveHumanPosture admits attachment order and fits the goal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation An arm or leg effector goal with its bend direction, optional contact constraints and reference configuration. Coordinates are world metres unless on names the posed bone frame; resolveHumanPosture admits attachment order and fits the goal.
 * @evidence contracts/development/design.md#principled-representation point: Where the end joint (wrist or ankle) goes, world metres. elbow: Where an arm's elbow goes when the law leaves it to the body: `"strain"` takes, among the places that leave the hand's rotation error least, the one where the arm strains least, read from the fit's own sweep (`AutoMovieMotionHumanBend.strainOf`), with `bend` serving only where no place is legal. Absent, `bend` decides; a leg ignores it. contact: The contact the hand or foot turns about, in its rest frame relative to its joint (a heel, a ball, a palm): when `rotation` cannot be met exactly within the limb's range, the end joint is re-aimed so this point stays where the goal puts it, and the rotation gives way, as a foot pivots on its ball.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Action laws and arm/leg primitives produce goals consumed by resolveHumanPosture and limb fitting; point limits and reference configurations have their own shared identities.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts resolveHumanPosture owns attachment ordering and fitting refusal; the goal preserves optional bone-relative coordinates, rigid contact constraints and clearance ownership without replacing them with untyped data.
 */
export interface IAutoMovieHumanLimbGoal {
  /** Where the end joint (wrist or ankle) goes, world metres. */
  point: IAutoMovieVector3;

  /** A world point the middle joint (elbow or knee) bends toward. */
  bend: IAutoMovieVector3;

  /**
   * Where an arm's elbow goes when the law leaves it to the body:
   * `"strain"` takes, among the places that leave the hand's rotation
   * error least, the one where the arm strains least, read from the fit's
   * own sweep (`AutoMovieMotionHumanBend.strainOf`), with `bend` serving only
   * where no place is legal. `"placed"` says `bend` is itself the elbow's
   * place, which the law's own elbow search chose (`AutoMovieMotionHumanBend.solve`):
   * the fit takes the swivel that puts the elbow there, refined locally, and
   * sweeps only where that is not legal, so the place is searched once.
   * Absent, `bend` decides; a leg ignores it.
   */
  elbow?: IAutoMovieHumanLimbGoal.Elbow;

  /** The hand's or foot's world rotation from its rest, when the law sets it. */
  rotation?: IAutoMovieQuaternion;

  /** Whether the limb bears on a fixed contact the transition must not move. */
  planted?: boolean;

  /**
   * The contact the hand or foot turns about, in its rest frame relative to
   * its joint (a heel, a ball, a palm): when `rotation` cannot be met
   * exactly within the limb's range, the end joint is re-aimed so this
   * point stays where the goal puts it, and the rotation gives way, as a
   * foot pivots on its ball.
   */
  contact?: IAutoMovieVector3;

  /** Points in the end joint's own frame whose world positions must remain within their bounds of the asked frame. Requires rotation. These hard task limits accompany the contact when a path is planned; a held tool names both ends of its working line. */
  limits?: readonly IAutoMovieHumanEffectorPointLimit[];

  /**
   * The bone the goal is attached to, when it moves with the body rather
   * than staying in the world: `point` and `bend` are then in the bone's
   * posed frame (relative to its posed world position and rotation) and
   * `rotation` composes after the bone's. The resolver carries them into the
   * world from the pose being fitted, after the trunk, the head, any layer
   * and any transition offset have placed the bone, so a palm on the chin or
   * in a pocket stays there when breathing or a glance moves the body. A
   * limb attached to another limb's bone is fitted after it; a bone of the
   * limb's own chain, or two limbs attached to each other, is refused
   * (`resolveHumanPosture.order`, `resolveHumanPosture.world`).
   */
  on?: AutoMovieHumanoidBone;

  /**
   * The limb's own solution at one instant of the action the law names (the
   * grasp, the clasp, the placement): the clinical angles of its upper and
   * lower bones there, as `resolveHumanPosture.reference` reads them. Where
   * the goal can be met by more than one arm or leg configuration, the fit
   * keeps the one nearest this reference, so the limb stays on one side of
   * the choice for the whole stroke. It is a constant of the plan, never a
   * previous frame, so the pose stays a function of time alone. A degree of
   * joint turn from the reference counts like a degree of hand or foot
   * rotation error, so a law gives it in full from the named instant on (the
   * hold after a grasp) and, over the reach toward that instant, raises its
   * `weight` from 0 to 1 with the reach's own progress: the reference is
   * that instant's solution, so the reach arrives at it exactly, and on the
   * way the growing weight keeps the limb on the reference's side where two
   * configurations nearly tie instead of letting it switch between them.
   */
  reference?: IAutoMovieHumanLimbReference;

  /**
   * Another body's colliders, placed in the world, an arm keeps clear of on
   * its way and at its goal (a partner whose head, cheek or back the hand
   * is sent to): its forearm keeps the clearance it keeps from its own
   * trunk, except that the wrist's own depth in them excuses nothing, since
   * no goal put the wrist inside another person (`HumanArmClearance`).
   * Ignored on a leg.
   */
  clear?: readonly IAutoMovieMotionHumanColliders.IPlaced[];

  /**
   * Another body's colliders, placed in the world, the goal lays the hand
   * on (the partner's segment a palm rests on): the forearm keeps clear of
   * them as of `clear`, except that near the wrist it asks no more room
   * than the goal gives, since the goal puts the hand on their surface
   * (`HumanArmClearance`). Ignored on a leg.
   */
  rests?: readonly IAutoMovieMotionHumanColliders.IPlaced[];

  /** Collider frames of a rigidly carried partner in this goal's `on` frame. */
  clearanceOn?: IAutoMovieHumanLimbGoal.IClearance;
}

/**
 * Companion types of {@link IAutoMovieHumanLimbGoal}.
 *
 */
export namespace IAutoMovieHumanLimbGoal {
  /**
   * Clear and resting segments expressed in the goal's attachment frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Clear segments obstruct the arm fit. Rests identify intentional hand contact in the same attachment frame.
   * @evidence contracts/development/design.md#principled-representation Separate arrays distinguish obstacles from permitted contact while preserving the same placed geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The limb goal supplies both sets to the fitter. The readonly arrays allow the fitter to borrow them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both lists use the collider owner's placed segments and share its geometry definition.
   */
  export interface IClearance {
    /** Segments the arm clears throughout its fit. */
    clear: readonly IAutoMovieMotionHumanColliders.IPlaced[];

    /** Segments the hand is placed on, with the same allowances as `rests`. */
    rests: readonly IAutoMovieMotionHumanColliders.IPlaced[];
  }

  /**
   * How an arm's elbow is decided (`IAutoMovieHumanLimbGoal.elbow`): by its
   * own sweep's least strain, or at the place the law's elbow search chose.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two decisions and where each comes from.
   * @evidence contracts/development/design.md#principled-representation A closed set of named decisions the fit reads.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two decisions a goal states today; absence leaves the bend hint to decide.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No decision is inferred from anything but this field.
   */
  export type Elbow = "strain" | "placed";
}
