import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Live small-craft contacts for grips which ride a prop or its articulated parts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read from the performance and what the caller poses.
 * @evidence contracts/development/design.md#principled-representation One posed model snapshot supplies all the requested frames for a film second.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Shares model-frame composition and anatomical grip fitting between crew laws.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No presumed deck grip or wrist anchor stands in for a missing contact.
 */
export namespace AquaticProp {
  /** The model placements and grip geometry at one film instant. */
  export interface IContacts {
    /** The moving prop's rigid frame. */
    frame: IAutoMovieRigidTransform;
    /** A required named affordance and its world placement. */
    require(id: string, kind: IAutoMovieAffordance["kind"]): IContact;
  }

  /** One named affordance and its frame in world space. */
  export interface IContact {
    /** The named contact in the provider's current model frame. */
    affordance: IAutoMovieAffordance;
    /** The same contact placed in world metres and its current world rotation. */
    world: Pick<IAutoMovieTransform, "translation" | "rotation">;
  }

  /**
   * Compose contact frames with the prop's current world frame. A planner
   * that drives its own articulation supplies those same writer values
   * explicitly, so its endpoints also resolve while the plan is being placed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the sampled clock, local state override and named contact refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Places the provider's authored affordance in the actual current prop transform.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Sample once, then return a reader of those placed contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses an absent or differently typed affordance before fitting an actor.
   * @evidence contracts/development/implementation.md#efficient-algorithms Articulates once per prop sample and reads each named contact in the resulting model inventory.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All contacts requested from one sample share its articulation and carrier frame.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned reader owns one frame and affordance array, released with the current query.
   */
  export function at(
    carrier: IAutoMovieMotionHumanPropReader,
    seconds: number,
    driven?: Readonly<Record<string, number>>,
  ): IContacts {
    const frame: IAutoMovieRigidTransform = carrier.frame(seconds);
    const state: Readonly<Record<string, number>> =
      carrier.state?.(seconds) ?? {};
    const articulated: boolean =
      Object.keys(state).length > 0 || driven !== undefined;
    const affordances: readonly IAutoMovieAffordance[] =
      (articulated
        ? carrier.prop.articulate?.({ ...state, ...driven }).affordances
        : undefined) ??
      carrier.prop.affordances ??
      [];
    return {
      frame,
      require(id: string, kind: IAutoMovieAffordance["kind"]): IContact {
        const affordance: IAutoMovieAffordance | undefined = affordances.find(
          (candidate: IAutoMovieAffordance): boolean => candidate.id === id,
        );
        if (affordance?.kind !== kind)
          throw new HumanRefusal({
            kind: "affordance",
            axis: "support",
            value: `${carrier.prop.subject}.${id}`,
            feasible: {
              kind: "alternatives",
              values: affordances
                .filter((a) => a.kind === kind)
                .map((a) => a.id),
            },
            reason: `this crew station requires a ${kind} contact at ${id}`,
            fix: "register a craft or prop with the named station contact",
          });
        const placed = articulated
          ? undefined
          : carrier.prop.point?.(id, seconds);
        return {
          affordance,
          world: {
            translation:
              placed?.point ??
              Vector3.add(
                frame.position,
                Quaternion.rotateVector(
                  frame.rotation,
                  affordance.frame.translation,
                ),
              ),
            rotation:
              placed?.rotation ??
              Quaternion.multiply(frame.rotation, affordance.frame.rotation),
          },
        };
      },
    };
  }

  /**
   * Fit the hand's grip center to a rotating handle on a moving hull. The
   * hand may give at its rotation limit while its anatomical grip stays on
   * the axis of the handle.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the anatomical effector, handle axes and behavior at rotation limits.
   * @evidence contracts/development/implementation.md#principled-implementation Rotate and subtract the canonical grip offset, then preserve it through the existing limb contact fitter.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Orient the grip, subtract its offset, and furnish the bend hint required by the same fit.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The point is the shaft center and never the wrist.
   * @evidence contracts/development/implementation.md#efficient-algorithms One grip alignment and rigid placement per hand.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same grip and fitted contact definitions as existing hand targets.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The result consists of one limb goal in the consumer posture.
   */
  export function hold(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    handle: IContact["world"],
    shoulder?: IAutoMovieVector3,
  ): IAutoMovieHumanLimbGoal {
    const grip: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
      body,
      side,
      "grip",
    );
    const rotation: IAutoMovieQuaternion = HumanHand.align(grip, {
      normal: Quaternion.rotateVector(handle.rotation, { x: 0, y: -1, z: 0 }),
      forward: Quaternion.rotateVector(handle.rotation, { x: 1, y: 0, z: 0 }),
    });
    const point: IAutoMovieVector3 = Vector3.subtract(
      handle.translation,
      Quaternion.rotateVector(rotation, grip.point),
    );
    // The elbow leans out, down and back of the trunk. With the shoulder
    // known, the elbow is placed in closed form on that side, so the arm's
    // branch follows the hint continuously instead of being re-searched.
    const lean: IAutoMovieVector3 = Quaternion.rotateVector(
      resolveHumanPosture.heading(posture),
      { x: side === "left" ? 0.24 : -0.24, y: -0.22, z: -0.14 },
    );
    return shoulder === undefined
      ? { point, rotation, contact: grip.point, bend: Vector3.add(point, lean) }
      : {
          point,
          rotation,
          contact: grip.point,
          bend: elbow(body, shoulder, point, lean),
          elbow: "placed",
        };
  }

  /**
   * The elbow of a two-bone arm from shoulder to wrist, on the side of a
   * lean direction: the circle of elbow places is cut by the plane through
   * the shoulder-wrist line and the lean, on the lean's side. A wrist beyond
   * reach straightens the arm toward it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the construction, its inputs and the out-of-reach case.
   * @evidence contracts/development/implementation.md#principled-implementation The law of cosines on the measured upper-arm and forearm lengths gives the elbow's distance along the shoulder-wrist line and its radius from it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Line, distance along it, radius, direction in the lean's plane.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A lean along the line itself keeps a perpendicular fallback rather than dividing by zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function elbow(
    body: IAutoMovieMotionHumanBody,
    shoulder: IAutoMovieVector3,
    wrist: IAutoMovieVector3,
    lean: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const a: number = body.measure.upperArm;
    const b: number = body.measure.forearm;
    const line: IAutoMovieVector3 = Vector3.subtract(wrist, shoulder);
    const d: number = Math.min(Vector3.length(line), a + b - 1e-6);
    const u: IAutoMovieVector3 =
      d > 1e-9 ? Vector3.normalize(line) : { x: 0, y: -1, z: 0 };
    const along: number = (a * a - b * b + d * d) / (2 * d);
    const radius: number = Math.sqrt(Math.max(0, a * a - along * along));
    const off: IAutoMovieVector3 = Vector3.subtract(
      lean,
      Vector3.scale(u, Vector3.dot(lean, u)),
    );
    const n: IAutoMovieVector3 =
      Vector3.length(off) > 1e-9
        ? Vector3.normalize(off)
        : Vector3.normalize({ x: -u.y, y: u.x, z: 0 });
    return Vector3.add(
      shoulder,
      Vector3.add(Vector3.scale(u, along), Vector3.scale(n, radius)),
    );
  }
}
