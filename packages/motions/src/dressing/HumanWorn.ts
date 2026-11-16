import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * Where a wearable sits once worn: its `wear` socket on the body region it
 * goes onto, the socket's `+Y` toward the body (into the region, against the
 * region's outward normal), and the thing turned so its front faces the way
 * the body faces (`createWearable`'s contacts: a hat's crown inside on the
 * head's crown, a pair of spectacles' bridge on the nose's bridge).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is placed where and how it is turned.
 * @evidence contracts/development/design.md#principled-representation The wearable's frame in the world, from its own socket and the body's own region.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader, used by `dress`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The socket is the wearable's own contact and the place the body's own region; no offset is typed.
 */
export namespace HumanWorn {
  /**
   * The frame a wearable takes on a posture's region.
   *
   * @param body The body.
   * @param posture The posture the region is read on.
   * @param prop The wearable.
   * @param region The region it goes onto.
   * @param turn A turn about the region's normal from facing the body's way, degrees; 0 when absent.
   * @returns The wearable's world frame.
   * @throws {HumanRefusal} When the wearable declares no `wear` socket.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The socket's `+Y` turned onto the region's inward normal exactly and the wearable's front (its `+Z`, or its `+Y` where the socket runs along `Z`) onto the body's forward (or up) as nearly as that allows (`HumanHand.align`); the origin follows so the socket lies on the region's point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup, one alignment, one translation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A wearable without its socket is refused with its contacts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function frame(
    body: IHumanBody,
    posture: IHumanPosture,
    prop: IHumanProp,
    region: AutoMovieHumanoidRegion,
    turn: number = 0,
  ): IHumanProp.IFrame {
    return prepare(body, posture, prop, region)(turn);
  }

  /**
   * Prepare a wearable's fixed socket and region before trying its turns.
   *
   * @param body The unchanged body.
   * @param posture The unchanged posture whose region receives the wearable.
   * @param prop The wearable with its declared wear socket.
   * @param region The body region receiving that socket.
   * @returns A world-frame builder accepting turns in degrees about the region normal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed geometry, the turn's unit and axis and the operation-owned builder.
   * @evidence contracts/development/implementation.md#principled-implementation The original wear-socket alignment and region placement are independent of turn; each call composes the requested turn with that same alignment and translates the actual socket onto the region.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission and fixed alignment precede the turn-specific rigid transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing sockets retain the original refusal and each turn retains its original quaternion normalization and translation.
   * @evidence contracts/development/implementation.md#efficient-algorithms One socket search and region FK serve all T turns, followed by O(1) work per actual turn; no fitted arm result is stored.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the fixed body, posture, prop and region share their geometry; differing turns still compute their own frame.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous grasp search owns a constant-size alignment, region frame and socket offset; releasing its builder releases them without a global cache.
   */
  export function prepare(
    body: IHumanBody,
    posture: IHumanPosture,
    prop: IHumanProp,
    region: AutoMovieHumanoidRegion,
  ): (turn: number) => IHumanProp.IFrame {
    const affordances: readonly IAutoMovieAffordance[] = prop.affordances ?? [];
    const wear: IAutoMovieAffordance | undefined = affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === "wear",
    );
    if (wear === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "prop",
        value: prop.subject,
        feasible: {
          kind: "alternatives",
          values: affordances.map((a: IAutoMovieAffordance): string => a.id),
        },
        reason: `${prop.subject} declares no wear socket to put on by`,
        fix: "dress in a wearable that declares where it is worn, as createWearable does",
      });
    const at: ReturnType<typeof HumanTrunk.region> = HumanTrunk.region(
      body,
      posture,
      region,
    );
    const into: IAutoMovieVector3 = Quaternion.rotateVector(
      wear.frame.rotation,
      { x: 0, y: 1, z: 0 },
    );
    const along: boolean = Math.abs(into.z) > 0.9;
    const aligned: IAutoMovieQuaternion = HumanHand.align(
      {
        normal: into,
        forward: along ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: 1 },
      },
      {
        normal: Vector3.scale(at.normal, -1),
        forward: along
          ? { x: 0, y: 1, z: 0 }
          : HumanFrame.point(
              { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
              { x: 0, y: 0, z: 1 },
            ),
      },
    );
    return (turn: number): IHumanProp.IFrame => {
      const rotation: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(Quaternion.fromAxisAngle(at.normal, turn), aligned),
      );
      return {
        position: Vector3.subtract(
          at.point,
          Quaternion.rotateVector(rotation, wear.frame.translation),
        ),
        rotation,
      };
    };
  }
}
