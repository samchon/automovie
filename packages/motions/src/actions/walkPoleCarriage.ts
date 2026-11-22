import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionPropHold,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanGrip } from "../handling/HumanGrip";
import { HumanFrame } from "../posture/HumanFrame";

/**
 * A long held prop carried along a walk or a run: a prop held in a hand
 * whose `tip` lies farther from the grip than the hand hangs above the floor
 * at rest would drag that tip if it hung with the swinging hand, so the hand
 * holds the attitude that points the tip forward along the heading, level:
 * the entry's hand turned by the shortest such turn, kept in the heading's
 * frame through the strides, while the hand keeps its swung place. Level is the
 * attitude nearest a pole's plant ahead (`poleVault`, tip forward and down
 * to the floor) that keeps the tip off the floor at any hand height.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which props are carried, the carried attitude and why it is level.
 * @evidence contracts/development/design.md#principled-representation The held prop's tip in the hand's frame and one hand goal per carrying hand.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A preparation read once at the entry and one writer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tip and the grip are the prop's own and the hand's displayed frame.
 */
export namespace walkPoleCarriage {
  /** A hand carrying a long prop: the side and the tip's point from the grip in the hand's axes. */
  export interface IHold {
    /** The carrying hand. */
    side: "left" | "right";

    /** The carried prop. */
    prop: string;

    /** The prop's tip from the grip, metres, in the hand bone's axes. */
    tip: IAutoMovieVector3;

    /** The carrying hand's rotation in the heading's frame: the carrying arm's neutral hand turned so the tip points forward, level. */
    carried: IAutoMovieQuaternion;

    /** The wrist's place from the root in the heading's frame, metres. */
    place: IAutoMovieVector3;

    /** The elbow's place from the root in the heading's frame, metres: the arm's bend hint. */
    elbow: IAutoMovieVector3;
  }

  /**
   * The hands that carry a long prop as the action enters.
   *
   * @param context The action's context.
   * @returns The carrying hands; none when no hand holds a prop whose tip would reach the floor hanging.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the long-prop rule and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The tip's distance from the grip against the hand's height above the entry's floor, both read from the displayed entry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the two hands.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A prop without a tip is left to the walk's swing.
   * @evidence contracts/development/implementation.md#efficient-algorithms One held-frame read per holding hand, once per plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The held-prop reader and the hand's displayed frame.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records and retains nothing.
   */
  export function prepare(
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry" | "prop">,
  ): IHold[] {
    const out: IHold[] = [];
    for (const side of ["left", "right"] as const) {
      const prop: string | undefined = context.entry.holds[side];
      if (prop === undefined) continue;
      const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
        context,
        side,
        prop,
      );
      if (
        !held.affordances.some(
          (a: IAutoMovieAffordance): boolean => a.id === "tip",
        )
      )
        continue;
      const tip: IAutoMovieVector3 = AutoMovieMotionHumanHeld.point(
        held,
        "tip",
      ).point;
      // The hand's height above the floor hanging at rest, where the walk's
      // swing carries it.
      const hanging: number =
        context.body.rest.get(`${side}Hand`)!.y -
        context.body.rest.get(`${side}Foot`)!.y +
        context.body.measure.ankleHeight;
      if (!(Vector3.length(tip) > hanging)) continue;
      // The carrying arm as a carrier holds a pole along the run: the upper
      // arm hanging, the elbow bent a right angle so the forearm points
      // forward, wrist and forearm at their neutral (every clinical angle
      // zero but the elbow's flexion). The prop's roll about its own axis is
      // free, so the hand takes the shortest turn from that neutral hand
      // that points the tip forward, level: the turn least away from the
      // neutral wrist and forearm twist, which stay inside their ranges as
      // the stride goes on, where an arm swung back and forth under a fixed
      // hand ran the wrist to its −80° and the twist between its ±90° ends.
      const heading: IAutoMovieQuaternion = HumanFrame.turn(
        context.entry.posture.yaw,
      );
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(heading);
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        HumanTrunk.resolve(
          context.body,
          {
            ...context.entry.posture,
            joints: {
              ...context.entry.posture.joints,
              [`${side}UpperArm`]: [0, 0, 0],
              [`${side}LowerArm`]: [RIGHT_ANGLE, 0, 0],
              [`${side}Hand`]: [0, 0, 0],
            },
          },
          undefined,
          undefined,
          new Set<AutoMovieHumanoidBone>([`${side}Hand`, `${side}LowerArm`]),
        );
      const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
      const root: IAutoMovieVector3 = context.entry.posture.root;
      const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Quaternion.rotateVector(inverse, Vector3.subtract(point, root));
      out.push({
        side,
        prop,
        tip,
        carried: Quaternion.normalize(
          Quaternion.multiply(
            inverse,
            Quaternion.multiply(
              shortest(
                Vector3.normalize(
                  Quaternion.rotateVector(hand.worldRotation, tip),
                ),
                Quaternion.rotateVector(heading, { x: 0, y: 0, z: 1 }),
              ),
              hand.worldRotation,
            ),
          ),
        ),
        place: local(hand.worldPosition),
        elbow: local(bones.get(`${side}LowerArm`)!.worldPosition),
      });
    }
    return out;
  }

  /** The shortest turn carrying one unit direction onto another. */
  function shortest(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
  ): IAutoMovieQuaternion {
    const axis: IAutoMovieVector3 = Vector3.cross(from, to);
    return Vector3.length(axis) < 1e-9
      ? Quaternion.identity()
      : Quaternion.fromAxisAngle(
          axis,
          (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(from, to)))) * 180) /
            Math.PI,
        );
  }

  /**
   * The grip windows by which the walk takes each carried prop over for the
   * whole action: a hand the action drives is not carried with the trunk by
   * the performance (`HumanSegment.drives`), and a driven held hand must take
   * its prop over (`IAutoMovieMotionHumanActionPlan.hands`), so the prop
   * rides the hand the walk's carriage turns.
   *
   * @param holds The carrying hands.
   * @returns One grip window per carrying hand, over the whole action.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States why the walk declares the grips and over what span.
   * @evidence contracts/development/implementation.md#principled-implementation The performance's own rule for a driven held hand: a carrying grip on the held prop.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One window per hold.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No hold without a long prop gains a window.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per hold.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The contact window form the other carrying laws declare.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records and retains nothing.
   */
  export function grips(
    holds: readonly IHold[],
  ): IAutoMovieMotionHumanContactWindow[] {
    return holds.map(
      (hold: IHold): IAutoMovieMotionHumanContactWindow => ({
        part: `${hold.side}Hand`,
        kind: "grip",
        from: 0,
        to: 1,
        support: { kind: "prop", subject: hold.prop },
      }),
    );
  }

  /**
   * The holds the walk keeps: each carried prop stays in its hand with the
   * fingers it entered with, from the walk's start, so an action cut into
   * the walk at any second (a vault out of its run) enters with the prop
   * held, as a draw from a carrier leaves its prop held (`drawFromCarrier`).
   *
   * @param context The action's context.
   * @param holds The carrying hands.
   * @returns One hold per carrying hand, from the action's start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is left held and with which fingers.
   * @evidence contracts/development/implementation.md#principled-implementation A grip window takes the prop over and releases it at its end unless a hold persists it, so the walk declares the hold from its start, which a cut at any second keeps.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One hold per carrying hand.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fingers are the entry's own.
   * @evidence contracts/development/implementation.md#efficient-algorithms One finger read per hold.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The grip's finger reader.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records and retains nothing.
   */
  export function kept(
    context: Pick<IAutoMovieMotionHumanActionContext, "entry">,
    holds: readonly IHold[],
  ): IAutoMovieMotionPropHold[] {
    return holds.map(
      (hold: IHold): IAutoMovieMotionPropHold => ({
        side: hold.side,
        prop: hold.prop,
        from: 0,
        fingers: HumanGrip.fingers(context.entry.pose, hold.side),
      }),
    );
  }

  /**
   * The posture with each carrying hand's goal: the carrying arm's place
   * and the tip forward, level, carried by the root and the heading, so the
   * arm holds the prop still against the body through the strides instead
   * of swinging it.
   *
   * @param posture The walk's posture.
   * @param holds The carrying hands.
   * @returns The posture with those hands' goals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the goal and that the carrying arm does not swing.
   * @evidence contracts/development/implementation.md#principled-implementation The prepared wrist place, elbow hint and attitude, carried rigidly by the posture's root and heading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One goal per hand.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A posture without carrying hands is returned unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per carrying hand per sample; no kinematics.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The heading frame the posture is read in.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function write(
    posture: IAutoMovieMotionHumanPosture,
    holds: readonly IHold[],
  ): IAutoMovieMotionHumanPosture {
    if (holds.length === 0) return posture;
    const heading: IAutoMovieQuaternion = HumanFrame.turn(posture.yaw);
    const world = (local: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(posture.root, Quaternion.rotateVector(heading, local));
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const hold of holds)
      limbs[`${hold.side}Arm`] = {
        point: world(hold.place),
        rotation: Quaternion.normalize(
          Quaternion.multiply(heading, hold.carried),
        ),
        bend: world(hold.elbow),
      };
    return { ...posture, limbs };
  }
}

/** The carrying elbow's flexion, degrees: a right angle, the forearm forward. */
const RIGHT_ANGLE: number = 90;
