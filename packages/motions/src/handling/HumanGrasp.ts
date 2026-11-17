import { Quaternion, Vector3, physicalShapeSpan } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieCurlChainUntilContact,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { HumanGraspReach } from "./HumanGraspReach";

/**
 * A prop's grip affordance as a grasp target, and the hand that grasps it:
 * where the grip socket goes, how the hand turns, how wide it opens on the
 * way and how its digits close.
 *
 * The affordance frame follows the one convention of
 * `AutoMovieAffordanceKind`: `+Y` points out of the contact, so the hand
 * arrives along `-Y` with its palm facing into the object, and the wrapped
 * axis runs along `+X`, the thumb side toward `+X`. The grasp lays the hand's
 * grip socket (the centre of a power grip, 25 mm out from the palm) on the
 * affordance point with the socket's palm normal along `-Y` and its thumb-side
 * forward along `+X` (`HumanHand.reach`), which fixes the hand's rotation, and
 * then sets the palm on the grasped part's near surface, half the grasped
 * width back from the affordance point on the part's axis, so a thick part
 * is not entered by a palm placed for the socket's nominal 50 mm handle; the
 * arm is then solved by inverse kinematics, the Final IK InteractionObject and
 * Unreal hand-socket practice of an effector frame laid on an object's
 * authored grip marker.
 *
 * The grasped width is the affordance's `aperture`, or else the extent along
 * the approach axis of the prop's collider nearest the grip point (the span
 * the closing hand must clear), read from the engine's `physicalShapeSpan`.
 * `HumanPreshape` opens the hand for it on the way.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame convention, the socket alignment, the width rule and who owns the pre-shape.
 * @evidence contracts/development/implementation.md#principled-implementation Affordance frame composition, socket-to-frame alignment, and collider extents along an axis read from the engine's shape span.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Target reading, hand placement and the reachable grip search as functions over one target record.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing prop affordance or collider throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per target; the reachable search fits the arm once per candidate turn and tilt and once per stroke key.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per planned grasp.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace HumanGrasp {
  /**
   * A prop affordance as a target at a film second, from its displayed frame.
   *
   * @param context The action's context.
   * @param subject The prop.
   * @param id The affordance id.
   * @param seconds Film seconds.
   * @returns The target.
   * @throws {HumanRefusal} When the prop declares no such affordance or no colliders.
   */
  export function target(
    context: Pick<IAutoMovieMotionHumanActionContext, "prop">,
    subject: string,
    id: string,
    seconds: number,
  ): IAutoMovieMotionHumanGrasp.ITarget {
    const prop: IAutoMovieMotionHumanPropReader = context.prop(subject);
    return HumanGrasp.at(prop.prop, id, prop.frame(seconds));
  }

  /**
   * A prop affordance as a target with the prop at a given world frame, such
   * as where another person's hand will hold it.
   *
   * @param prop The prop.
   * @param id The affordance id.
   * @param frame The prop's world frame.
   * @returns The target.
   * @throws {HumanRefusal} When the prop declares no such affordance or no colliders.
   */
  export function at(
    prop: IAutoMovieMotionHumanProp,
    id: string,
    frame: IAutoMovieRigidTransform,
  ): IAutoMovieMotionHumanGrasp.ITarget {
    const subject: string = prop.subject;
    const affordance: IAutoMovieAffordance | undefined = prop.affordances?.find(
      (a: IAutoMovieAffordance): boolean => a.id === id,
    );
    if (affordance === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "handle",
        value: id,
        feasible: {
          kind: "alternatives",
          values: (prop.affordances ?? []).map(
            (a: IAutoMovieAffordance): string => a.id,
          ),
        },
        reason: `Prop ${subject} has no affordance ${id}; it has ${(prop.affordances ?? []).map((a: IAutoMovieAffordance): string => a.id).join(", ") || "none"}`,
        fix: "name one of the prop's affordances, or declare this one on the prop",
      });
    const shapes: readonly IAutoMoviePhysicalShape[] = prop.shapes ?? [];
    if (shapes.length === 0)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "prop",
        value: subject,
        reason: `Prop ${subject} declares no colliders; a grasp closes the fingers on them`,
        fix: "give the prop the shapes the fingers close on",
      });
    const turn: IAutoMovieQuaternion = Quaternion.multiply(
      frame.rotation,
      affordance.frame.rotation,
    );
    const approach: IAutoMovieVector3 = Quaternion.rotateVector(turn, {
      x: 0,
      y: -1,
      z: 0,
    });
    const colliders: IAutoMovieCurlChainUntilContact.ICollider[] = shapes.map(
      (
        shape: IAutoMoviePhysicalShape,
      ): IAutoMovieCurlChainUntilContact.ICollider => ({ shape, frame }),
    );
    const point: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, affordance.frame.translation),
    );

    // Without an authored aperture, the grasped part is the collider whose
    // centre lies nearest the grip point (a mug's handle, not its body).
    const centre = (
      c: IAutoMovieCurlChainUntilContact.ICollider,
    ): IAutoMovieVector3 =>
      Vector3.add(
        c.frame.position,
        Quaternion.rotateVector(c.frame.rotation, c.shape.transform.position),
      );
    const nearest: IAutoMovieCurlChainUntilContact.ICollider = colliders.reduce(
      (best, c) =>
        Vector3.length(Vector3.subtract(centre(c), point)) <
        Vector3.length(Vector3.subtract(centre(best), point))
          ? c
          : best,
    );
    return {
      point,
      approach,
      axis: Quaternion.rotateVector(turn, { x: 1, y: 0, z: 0 }),
      grip: affordance.grip ?? "power",
      width: affordance.aperture ?? extent([nearest], approach),
      colliders,
    };
  }

  /**
   * The wrist goal that lays the grip socket on a target.
   *
   * @param body The body.
   * @param side The hand.
   * @param target The target.
   * @param tilt Degrees the hand turns about the approach, for an oblique grip; 0 when absent.
   * @returns The wrist point and the hand's rotation.
   */
  export function hand(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    target: IAutoMovieMotionHumanGrasp.ITarget,
    tilt: number = 0,
  ): IAutoMovieMotionHumanHand.IWrist {
    // The grip socket's frame fixes the hand's turn; the palm then lies on
    // the grasped part's near surface, half its width back from the axis. A
    // tilt turns the hand about the approach through the palm's point, an
    // oblique power grip (Feix et al. 2016), the part still across the palm.
    const turn = HumanHand.reach(
      body,
      side,
      "grip",
      { point: target.point, normal: target.approach, forward: target.axis },
      "flat",
    ).rotation;
    const tilted = Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.fromAxisAngle(target.approach, tilt),
        turn,
      ),
    );
    return HumanHand.place(
      body,
      side,
      "palm",
      Vector3.subtract(
        target.point,
        Vector3.scale(target.approach, target.width / 2),
      ),
      tilted,
      "flat",
    );
  }

  /**
   * The reachable variant of a symmetric hand goal: among the goals a
   * family of turns produces (about a grasped part's own axis, where any
   * azimuth wraps it alike, or about the palm's normal, where the palm's
   * contact is unchanged), the one the arm can actually take from a posture,
   * by the error left after the arm's fit over its three goals: the hand's
   * rotation in degrees, the wrist's position in millimetres and the elbow's
   * turn from its hint about the shoulder-to-wrist line in degrees, the one
   * freedom a placed wrist leaves the elbow (Tolani, Goswami and Badler
   * 2000). The fit gives up the elbow hint before the hand, so a hand turn
   * the wrist's range cannot hold with the hinted elbow is reached by the
   * other arm pose, the elbow raised; counting that turn as error ranks the
   * grip the arm takes as the law asked above one it takes by leaving its
   * bend. The authored turn wins ties by a hundredth of a
   * degree per degree of turn. Grasp planners rank a part's symmetric grasps
   * by reachability the same way (Miller et al. 2003, Automatic grasp
   * planning using shape primitives), since an authored grip frame alone may
   * ask the wrist for more deviation than it has.
   *
   * A grip is held through a stroke, not at one instant: a lifted bottle is
   * still in the same grip at the top of the lift, a clasped hand at both
   * ends of the pump. `stroke` names those further key poses for a candidate
   * grip, and a candidate's error is the worst over the grasp and its keys,
   * so the chosen grip is the one the arm keeps over the whole stroke. Each
   * key is fitted with the grasp's own arm solution as its reference, the way
   * the law will show it. The returned `reference` is that solution, for the
   * law to pass on every goal of the stroke
   * (`HumanPosture.IGoal.reference`).
   *
   * @param body The body.
   * @param posture The posture the arm is fitted in (its other limbs and trunk).
   * @param side The arm.
   * @param bend The elbow hint.
   * @param goal The wrist goal of a turn and a tilt, degrees.
   * @param tilts The tilts tried at each turn; only the authored one when absent.
   * @param stroke The further key poses the same grip must reach, from its grasp goal and from the hand the arm shows for that goal: what is held is rigid in the shown hand, so a key that places the held thing is built from the shown one. None when absent.
   * @param turns The turns tried, degrees; -90 to 90 in steps of 15 when absent.
   * @param required What a grip must hold before its cost counts: a measure of its per-key errors, judgements and the bounds the keys hold their judgements to (the grasp's, then each stroke key's; `NaN` where none) and the most it may be. A grip within the bound is chosen before any beyond it; with none within, the one nearest the bound is returned for the caller to refuse. Absent, the least cost alone decides.
   * @param admits Whether the caller can take a candidate's grasp goal at all: a candidate it refuses is tried only when it refuses every one. Every candidate when absent.
   * @returns The best turn and tilt, their goal, the hand the arm achieves for it, and the arm's solution there.
   */
  export function reachable(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    bend: IAutoMovieVector3,
    goal: (turn: number, tilt: number) => IAutoMovieMotionHumanHand.IWrist,
    tilts: readonly number[] = [0],
    stroke?: (
      wrist: IAutoMovieMotionHumanHand.IWrist,
      shown: IAutoMovieMotionHumanHand.IWrist,
    ) => Iterable<IAutoMovieMotionHumanGrasp.IKey>,
    turns: readonly number[] = TURNS,
    required?: IAutoMovieMotionHumanGrasp.IReachableRequired,
    admits?: (wrist: IAutoMovieMotionHumanHand.IWrist) => boolean,
  ): IAutoMovieMotionHumanGrasp.IReach {
    return HumanGraspReach.reachable(
      body,
      posture,
      side,
      bend,
      goal,
      tilts,
      stroke,
      turns,
      required,
      admits,
    );
  }

  /** The turns {@link reachable} tries by default, degrees: a quarter turn either way in steps of 15. */
  export const TURNS: readonly number[] = Array.from(
    { length: 13 },
    (_: unknown, i: number): number => -90 + 15 * i,
  );

  /**
   * The standing posture a person settles into from where they stand: the
   * stand law's posture centred over the person's displayed feet, facing the
   * way the pelvis faces. A law predicting another person's arm (a
   * handshake's partner, a handover's receiver) reads it, so the prediction
   * starts from the same root the partner's own stand law will hold.
   *
   * @param body The person's body.
   * @param bones The person's displayed world bones.
   * @returns The posture.
   */
  export function standing(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
    >,
  ): IAutoMovieMotionHumanPosture {
    return HumanGraspReach.standing(body, bones);
  }

  /**
   * A target turned about its wrapped axis through the axis point, as a
   * cylinder's grip may be taken from any side.
   *
   * @param target The target.
   * @param turn Degrees about the wrapped axis.
   * @returns The turned target.
   */
  export function around(
    target: IAutoMovieMotionHumanGrasp.ITarget,
    turn: number,
  ): IAutoMovieMotionHumanGrasp.ITarget {
    return HumanGraspReach.around(target, turn);
  }

  /**
   * The width of colliders along an axis: the extent of their union's
   * projection.
   *
   * @param colliders Placed colliders.
   * @param axis A unit direction.
   * @returns Metres.
   */
  export function extent(
    colliders: readonly IAutoMovieCurlChainUntilContact.ICollider[],
    axis: IAutoMovieVector3,
  ): number {
    const [lo, hi]: readonly [number, number] = span(colliders, axis);
    return hi - lo;
  }

  /**
   * The interval colliders cover along an axis: the lowest and highest
   * projections of their union onto it, so an object's middle along the
   * vertical is the mean of the two.
   *
   * @param colliders Placed colliders.
   * @param axis A unit direction.
   * @returns The low and high projections, metres along the axis from the world origin.
   */
  export function span(
    colliders: readonly IAutoMovieCurlChainUntilContact.ICollider[],
    axis: IAutoMovieVector3,
  ): readonly [number, number] {
    let lo: number = Infinity;
    let hi: number = -Infinity;
    for (const c of colliders) {
      const [low, high]: readonly [number, number] = physicalShapeSpan(
        c.frame,
        c.shape,
        axis,
      );
      lo = Math.min(lo, low);
      hi = Math.max(hi, high);
    }
    return [lo, hi];
  }
}
