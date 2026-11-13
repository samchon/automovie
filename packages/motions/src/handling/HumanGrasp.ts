import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  type curlChainUntilContact,
  physicalShapeSpan,
} from "@automovie/engine";
import type {
  AutoMovieGripKind,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

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
  /** A grasp target in the world. */
  export interface ITarget {
    /** The grip point, world metres. */
    point: IAutoMovieVector3;

    /** The unit direction the hand arrives along, into the object (the affordance's `-Y`). */
    approach: IAutoMovieVector3;

    /** The unit wrapped axis (the affordance's `+X`). */
    axis: IAutoMovieVector3;

    /** The grip kind. */
    grip: AutoMovieGripKind;

    /** The grasped width, metres. */
    width: number;

    /** The prop's colliders in the world. */
    colliders: curlChainUntilContact.ICollider[];
  }

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
    context: Pick<IHumanActionContext, "prop">,
    subject: string,
    id: string,
    seconds: number,
  ): ITarget {
    const prop: IHumanActionContext.IProp = context.prop(subject);
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
    prop: IHumanProp,
    id: string,
    frame: IHumanProp.IFrame,
  ): ITarget {
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
    const shapes: readonly P.IShape[] = prop.shapes ?? [];
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
    const colliders: curlChainUntilContact.ICollider[] = shapes.map(
      (shape: P.IShape): curlChainUntilContact.ICollider => ({ shape, frame }),
    );
    const point: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, affordance.frame.translation),
    );

    // Without an authored aperture, the grasped part is the collider whose
    // centre lies nearest the grip point (a mug's handle, not its body).
    const centre = (c: curlChainUntilContact.ICollider): IAutoMovieVector3 =>
      Vector3.add(
        c.frame.position,
        Quaternion.rotateVector(c.frame.rotation, c.shape.transform.position),
      );
    const nearest: curlChainUntilContact.ICollider = colliders.reduce(
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
    body: IHumanBody,
    side: HumanHand.Side,
    target: ITarget,
    tilt: number = 0,
  ): HumanHand.IWrist {
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
   * (`IHumanPosture.IGoal.reference`).
   *
   * @param body The body.
   * @param posture The posture the arm is fitted in (its other limbs and trunk).
   * @param side The arm.
   * @param bend The elbow hint.
   * @param goal The wrist goal of a turn and a tilt, degrees.
   * @param tilts The tilts tried at each turn; only the authored one when absent.
   * @param stroke The further key poses the same grip must reach, from its grasp goal; none when absent.
   * @param turns The turns tried, degrees; -90 to 90 in steps of 15 when absent.
   * @returns The best turn and tilt, their goal, the hand the arm achieves for it, and the arm's solution there.
   */
  export function reachable(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    bend: IAutoMovieVector3,
    goal: (turn: number, tilt: number) => HumanHand.IWrist,
    tilts: readonly number[] = [0],
    stroke?: (wrist: HumanHand.IWrist) => readonly IKey[],
    turns: readonly number[] = TURNS,
  ): IReach {
    const limb: IHumanPosture.Limb = side === "left" ? "leftArm" : "rightArm";
    // One key pose fitted: the pose and the error the arm leaves there, the
    // rotation in degrees plus the position in millimetres.
    const fit = (
      key: IKey,
      reference: IHumanPosture.IReference | undefined,
    ): {
      pose: IAutoMoviePose;
      shown: HumanHand.IWrist;
      miss: number;
      departure: number;
    } => {
      const pose: IAutoMoviePose = resolveHumanPosture(body, {
        ...key.posture,
        limbs: {
          ...key.posture.limbs,
          [limb]: {
            point: key.wrist.point,
            rotation: key.wrist.rotation,
            bend: key.bend,
            ...(reference === undefined ? {} : { reference }),
          },
        },
      });
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, pose);
      const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
      // How far the elbow sits from its hint about the shoulder-to-wrist
      // line, the one freedom the wrist's place leaves it.
      const shoulder: IAutoMovieVector3 = bones.get(
        `${side}UpperArm`,
      )!.worldPosition;
      const line: IAutoMovieVector3 = Vector3.subtract(
        hand.worldPosition,
        shoulder,
      );
      const span: number = Vector3.dot(line, line);
      const radial = (point: IAutoMovieVector3): IAutoMovieVector3 => {
        const from: IAutoMovieVector3 = Vector3.subtract(point, shoulder);
        return span > 0
          ? Vector3.subtract(
              from,
              Vector3.scale(line, Vector3.dot(from, line) / span),
            )
          : from;
      };
      const shownSide: IAutoMovieVector3 = radial(
        bones.get(`${side}LowerArm`)!.worldPosition,
      );
      const hintSide: IAutoMovieVector3 = radial(key.bend);
      const sides: number =
        Vector3.length(shownSide) * Vector3.length(hintSide);
      const departure: number =
        sides > 1e-12
          ? (Math.acos(
              Math.max(
                -1,
                Math.min(1, Vector3.dot(shownSide, hintSide) / sides),
              ),
            ) *
              180) /
            Math.PI
          : 0;
      const dot: number = Math.min(
        1,
        Math.abs(
          hand.worldRotation.x * key.wrist.rotation.x +
            hand.worldRotation.y * key.wrist.rotation.y +
            hand.worldRotation.z * key.wrist.rotation.z +
            hand.worldRotation.w * key.wrist.rotation.w,
        ),
      );
      return {
        pose,
        shown: { point: hand.worldPosition, rotation: hand.worldRotation },
        miss:
          (2 * Math.acos(dot) * 180) / Math.PI +
          1000 *
            Vector3.length(
              Vector3.subtract(hand.worldPosition, key.wrist.point),
            ),
        departure,
      };
    };
    let best: IReach | undefined;
    let least: number = Infinity;
    for (const turn of turns)
      for (const tilt of tilts) {
        const wrist: HumanHand.IWrist = goal(turn, tilt);
        const grasp = fit({ posture, wrist, bend }, undefined);
        const reference: IHumanPosture.IReference =
          resolveHumanPosture.reference(grasp.pose, limb);
        let miss: number = grasp.miss;
        let departure: number = grasp.departure;
        for (const key of stroke?.(wrist) ?? []) {
          const held = fit(key, reference);
          miss = Math.max(miss, held.miss);
          departure = Math.max(departure, held.departure);
        }
        const cost: number =
          miss + departure + 0.01 * (Math.abs(turn) + Math.abs(tilt));
        if (best === undefined || cost < least) {
          least = cost;
          best = {
            turn,
            tilt,
            wrist,
            shown: grasp.shown,
            reference,
            miss,
            departure,
            pose: grasp.pose,
          };
        }
      }
    return best!;
  }

  /** The turns {@link reachable} tries by default, degrees: a quarter turn either way in steps of 15. */
  export const TURNS: readonly number[] = Array.from(
    { length: 13 },
    (_: unknown, i: number): number => -90 + 15 * i,
  );

  /** A key pose of a stroke: the posture the arm is fitted in, the wrist goal and the elbow hint. */
  export interface IKey {
    /** The posture's other limbs and trunk at the key. */
    posture: IHumanPosture;

    /** The wrist goal at the key. */
    wrist: HumanHand.IWrist;

    /** The elbow hint at the key, world metres. */
    bend: IAutoMovieVector3;
  }

  /** The reachable grip {@link reachable} chose. */
  export interface IReach {
    /** Degrees of the chosen turn. */
    turn: number;

    /** Degrees of the chosen tilt. */
    tilt: number;

    /** The wrist goal of that turn and tilt. */
    wrist: HumanHand.IWrist;

    /** The hand the arm achieves for it. */
    shown: HumanHand.IWrist;

    /** The arm's solution at the grasp, the reference of the whole stroke. */
    reference: IHumanPosture.IReference;

    /** The error the arm leaves over the grasp and its stroke: degrees of rotation plus millimetres of position. */
    miss: number;

    /** How far the fitted elbow turns from its hint about the shoulder-to-wrist line, worst over the grasp and its stroke, degrees. */
    departure: number;

    /** The posed body at the grasp. */
    pose: IAutoMoviePose;
  }

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
    body: IHumanBody,
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
    >,
  ): IHumanPosture {
    const yaw: number = HumanFrame.heading(bones.get("hips")!.worldRotation);
    const l: IAutoMovieVector3 = bones.get("leftFoot")!.worldPosition;
    const r: IAutoMovieVector3 = bones.get("rightFoot")!.worldPosition;
    const restL: IAutoMovieVector3 = body.rest.get("leftFoot")!;
    const restR: IAutoMovieVector3 = body.rest.get("rightFoot")!;
    const centre: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: (restL.x + restR.x) / 2, y: 0, z: (restL.z + restR.z) / 2 },
    );
    return stand.posture(
      body,
      { x: (l.x + r.x) / 2 - centre.x, y: 0, z: (l.z + r.z) / 2 - centre.z },
      yaw,
    );
  }

  /**
   * A target turned about its wrapped axis through the axis point, as a
   * cylinder's grip may be taken from any side.
   *
   * @param target The target.
   * @param turn Degrees about the wrapped axis.
   * @returns The turned target.
   */
  export function around(target: ITarget, turn: number): ITarget {
    return {
      ...target,
      approach: Quaternion.rotateVector(
        Quaternion.fromAxisAngle(target.axis, turn),
        target.approach,
      ),
    };
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
    colliders: readonly curlChainUntilContact.ICollider[],
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
    colliders: readonly curlChainUntilContact.ICollider[],
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
