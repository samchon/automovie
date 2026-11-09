import { Quaternion, Vector3, type curlChainUntilContact } from "@automovie/engine";
import type {
  AutoMovieGripKind,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMoviePhysicalProfile as P,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanGrip } from "./HumanGrip";
import { HumanPrehension } from "./HumanPrehension";

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
 * forward along `+X` (`HumanHand.reach`), which fixes the hand's rotation; the
 * arm is then solved by inverse kinematics, the Final IK InteractionObject and
 * Unreal hand-socket practice of an effector frame laid on an object's
 * authored grip marker.
 *
 * The grasped width is the affordance's `aperture`, or else the extent along
 * the approach axis of the prop's collider nearest the grip point (the span
 * the closing hand must clear); the pre-shape opens the hand to `HumanPrehension.aperture` of it.
 * The open hand is found on the thumb-index aperture of the body's own digit
 * colliders: a blend from the closed grasp toward the flat hand when the flat
 * hand is wide enough, else the flat hand with the thumb's carpometacarpal
 * joint abducted until it is, the joint that opens the human grip span; a
 * span the hand cannot reach within 60 degrees of abduction stops there.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame convention, the socket alignment, the width rule and the pre-shape rule.
 * @evidence contracts/development/implementation.md#principled-implementation Affordance frame composition, socket-to-frame alignment, collider extents along an axis, and bisection on the measured aperture.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Target reading, hand placement, closure and pre-shape as four functions over one target record.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing prop affordance or collider throws; an unreachable span is capped at the joint's limit and the reached aperture reported, not faked.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work plus one curl and two 30-step bisections per grasp.
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
   * @throws {Error} When the prop declares no such affordance or no colliders.
   */
  export function target(context: Pick<IHumanActionContext, "prop">, subject: string, id: string, seconds: number): ITarget {
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
   * @throws {Error} When the prop declares no such affordance or no colliders.
   */
  export function at(prop: IHumanProp, id: string, frame: IHumanProp.IFrame): ITarget {
    const subject: string = prop.subject;
    const affordance: IAutoMovieAffordance | undefined = prop.affordances?.find((a: IAutoMovieAffordance): boolean => a.id === id);
    if (affordance === undefined)
      throw new Error(`Prop ${subject} has no affordance ${id}; it has ${(prop.affordances ?? []).map((a: IAutoMovieAffordance): string => a.id).join(", ") || "none"}`);
    const shapes: readonly P.IShape[] = prop.shapes ?? [];
    if (shapes.length === 0) throw new Error(`Prop ${subject} declares no colliders; a grasp closes the fingers on them`);
    const turn: IAutoMovieQuaternion = Quaternion.multiply(frame.rotation, affordance.frame.rotation);
    const approach: IAutoMovieVector3 = Quaternion.rotateVector(turn, { x: 0, y: -1, z: 0 });
    const colliders: curlChainUntilContact.ICollider[] = shapes.map((shape: P.IShape): curlChainUntilContact.ICollider => ({ shape, frame }));
    const point: IAutoMovieVector3 = Vector3.add(frame.position, Quaternion.rotateVector(frame.rotation, affordance.frame.translation));

    // Without an authored aperture, the grasped part is the collider whose
    // centre lies nearest the grip point (a mug's handle, not its body).
    const centre = (c: curlChainUntilContact.ICollider): IAutoMovieVector3 => Vector3.add(c.frame.position, Quaternion.rotateVector(c.frame.rotation, c.shape.transform.position));
    const nearest: curlChainUntilContact.ICollider = colliders.reduce((best, c) =>
      Vector3.length(Vector3.subtract(centre(c), point)) < Vector3.length(Vector3.subtract(centre(best), point)) ? c : best,
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
   * @returns The wrist point and the hand's rotation.
   */
  export function hand(body: IHumanBody, side: HumanHand.Side, target: ITarget): HumanHand.IWrist {
    return HumanHand.reach(body, side, "grip", { point: target.point, normal: target.approach, forward: target.axis }, "flat");
  }

  /**
   * The open pre-shape whose thumb-index aperture is the peak aperture for a
   * width.
   *
   * @param body The body.
   * @param side The hand.
   * @param closed The closed grasp's digit angles.
   * @param width The grasped width, metres.
   * @returns The pre-shape's angles and the aperture it reaches, metres.
   */
  export function open(body: IHumanBody, side: HumanHand.Side, closed: IHumanPosture["joints"], width: number): { joints: IHumanPosture["joints"]; aperture: number } {
    const want: number = HumanPrehension.aperture(width);
    const flat: IHumanPosture["joints"] = HumanHand.shape(side, "flat");
    const blend = (w: number): IHumanPosture["joints"] => {
      const out: IHumanPosture["joints"] = {};
      for (const bone of new Set([...Object.keys(closed), ...Object.keys(flat)]) as Set<AutoMovieHumanoidBone>) {
        const a: readonly [number, number, number] = closed[bone] ?? [0, 0, 0];
        const b: readonly [number, number, number] = flat[bone] ?? [0, 0, 0];
        out[bone] = [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w];
      }
      return out;
    };
    const solve = (shape: (x: number) => IHumanPosture["joints"], hi: number): { joints: IHumanPosture["joints"]; aperture: number } => {
      let lo: number = 0;
      let top: number = hi;
      if (HumanGrip.aperture(body, side, shape(top)) <= want) return { joints: shape(top), aperture: HumanGrip.aperture(body, side, shape(top)) };
      for (let i: number = 0; i < 30; i++) {
        const mid: number = (lo + top) / 2;
        if (HumanGrip.aperture(body, side, shape(mid)) < want) lo = mid;
        else top = mid;
      }
      return { joints: shape(top), aperture: HumanGrip.aperture(body, side, shape(top)) };
    };
    if (HumanGrip.aperture(body, side, flat) >= want) return solve(blend, 1);

    // Wider than the flat hand: abduct the thumb's carpometacarpal joint, in
    // whichever sense widens the span.
    const thumb: AutoMovieHumanoidBone = `${side}ThumbMetacarpal` as AutoMovieHumanoidBone;
    const abducted = (sense: number) => (x: number): IHumanPosture["joints"] => ({ ...flat, [thumb]: [0, sense * 60 * x, 0] as const });
    const sense: number = HumanGrip.aperture(body, side, abducted(1)(0.5)) >= HumanGrip.aperture(body, side, abducted(-1)(0.5)) ? 1 : -1;
    return solve(abducted(sense), 1);
  }

  /**
   * The width of colliders along an axis: the extent of their union's
   * projection.
   *
   * @param colliders Placed colliders.
   * @param axis A unit direction.
   * @returns Metres.
   */
  export function extent(colliders: readonly curlChainUntilContact.ICollider[], axis: IAutoMovieVector3): number {
    let lo: number = Infinity;
    let hi: number = -Infinity;
    for (const c of colliders) {
      const rotation: IAutoMovieQuaternion = Quaternion.multiply(c.frame.rotation, c.shape.transform.rotation);
      const centre: number = Vector3.dot(Vector3.add(c.frame.position, Quaternion.rotateVector(c.frame.rotation, c.shape.transform.position)), axis);
      const along = (v: IAutoMovieVector3): number => Math.abs(Vector3.dot(Quaternion.rotateVector(rotation, v), axis));
      const half: number =
        c.shape.kind === "sphere"
          ? c.shape.radius
          : c.shape.kind === "capsule"
            ? c.shape.radius + c.shape.halfLength * along({ x: 0, y: 1, z: 0 })
            : c.shape.halfExtents.x * along({ x: 1, y: 0, z: 0 }) + c.shape.halfExtents.y * along({ x: 0, y: 1, z: 0 }) + c.shape.halfExtents.z * along({ x: 0, y: 0, z: 1 });
      lo = Math.min(lo, centre - half);
      hi = Math.max(hi, centre + half);
    }
    return hi - lo;
  }
}
