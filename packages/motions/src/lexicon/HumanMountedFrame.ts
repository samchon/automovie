import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { carryHumanPosture } from "../posture/carryHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The moving frame a mounted performance is planned in: one of the
 * carrier's own contacts, read where the carrier has it at each film second,
 * with its axes turned back to the carrier model's own (`+Z` the carrier's
 * front, `+Y` its up, `+X` its left). A contact on a horse's trunk rides the
 * trunk's pitch and bob as well as the horse's course, so a posture carried
 * by this frame stays on the saddle or the pad the contact belongs to.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what frame is read, its axes and why a trunk-borne contact is used.
 * @evidence contracts/development/design.md#principled-representation A rigid transform per film second and the re-expression of a posture between two rigid frames.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The reader, the contact point and the move `HumanMounted` uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact's frame is the carrier's own reading; nothing is extrapolated.
 */
export namespace HumanMountedFrame {
  /** A carrier frame at a film second. */
  export type Reader = (film: number) => IAutoMovieRigidTransform;

  /**
   * The model-aligned frame of a carrier's contact at each film second.
   *
   * @param support The carrier.
   * @param on The carrier's subject id, for refusals.
   * @param id The contact's id.
   * @returns The reader.
   * @throws {HumanRefusal} When the carrier declares no such contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result's axes and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The carrier's own moving reading of the contact, or its frame composed with the contact's model frame where the carrier publishes no moving reading, then turned by the inverse of the contact's model rotation so the axes are the model's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the contact, then one composition per read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing contact is refused with the carrier's contacts.
   * @evidence contracts/development/implementation.md#efficient-algorithms One contact lookup per plan and one carrier read per sample.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each read is a different second.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader holds the carrier and the contact's model rotation for the plan's life.
   */
  export function of(
    support: IAutoMovieMotionHumanPropReader,
    on: string,
    id: string,
  ): Reader {
    const contact: IAutoMovieAffordance | undefined =
      support.prop.affordances?.find(
        (a: IAutoMovieAffordance): boolean => a.id === id,
      );
    if (contact === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "frame",
        value: id,
        feasible: {
          kind: "alternatives",
          values: (support.prop.affordances ?? []).map(
            (a: IAutoMovieAffordance): string => a.id,
          ),
        },
        reason: `${on} declares no contact ${id} to plan the mounted figures in`,
        fix: "name the carrier's seat or pad",
      });
    const back: IAutoMovieQuaternion = Quaternion.inverse(
      contact.frame.rotation,
    );
    return (film: number): IAutoMovieRigidTransform => {
      const read: ReturnType<NonNullable<typeof support.prop.point>> =
        support.prop.point?.(id, film);
      if (read?.rotation !== undefined)
        return {
          position: read.point,
          rotation: Quaternion.multiply(read.rotation, back),
        };
      const frame: IAutoMovieRigidTransform = support.frame(film);
      return {
        position: carryHumanPoint(frame, contact.frame.translation),
        rotation: frame.rotation,
      };
    };
  }

  /**
   * A carrier contact's world point at a film second: the carrier's own moving reading, or the contact's model point under the carrier's frame where it publishes none.
   *
   * @param support The carrier.
   * @param id The contact's id, which the carrier declares.
   * @param film Film seconds.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both readings.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A read or one rigid transform.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One branch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The caller admits the contact first; nothing is guessed.
   * @evidence contracts/development/implementation.md#efficient-algorithms One carrier reading and at most one contact lookup.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function contact(
    support: IAutoMovieMotionHumanPropReader,
    id: string,
    film: number,
  ): IAutoMovieVector3 {
    const read: ReturnType<NonNullable<typeof support.prop.point>> =
      support.prop.point?.(id, film);
    if (read !== undefined) return read.point;
    const declared: IAutoMovieAffordance = support.prop.affordances!.find(
      (a: IAutoMovieAffordance): boolean => a.id === id,
    )!;
    return carryHumanPoint(support.frame(film), declared.frame.translation);
  }

  /**
   * The hands the entry already holds on the first figure's contacts: each whose arm goal lies in the world within a hand's length of the contact it is to hold, as a ride's held reins do.
   *
   * @param body The body.
   * @param entry The entered posture, in the world.
   * @param support The carrier.
   * @param first The first figure.
   * @param film The performance's start, film seconds.
   * @returns The hands held from the start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the test and its bound.
   * @evidence contracts/development/implementation.md#principled-implementation The arm goal's wrist against the contact's world point; a hand's length covers the wrist's offset from the grip.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One check per hand.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A goal attached to a bone is not read as holding.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new set.
   */
  export function held(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanPosture,
    support: IAutoMovieMotionHumanPropReader,
    first: IAutoMovieMotionHumanMounted.IFigure,
    film: number,
  ): Set<AutoMovieHumanSide> {
    const out: Set<AutoMovieHumanSide> = new Set();
    for (const side of ["left", "right"] as const) {
      const id: string | undefined = first.supports?.[`${side}Hand`];
      const arm: IAutoMovieMotionHumanPosture["limbs"]["leftArm"] =
        entry.limbs[`${side}Arm`];
      if (
        id !== undefined &&
        arm !== undefined &&
        arm.on === undefined &&
        Vector3.distance(arm.point, contact(support, id, film)) <=
          body.measure.hand
      )
        out.add(side);
    }
    return out;
  }
  /** The identity frame a posture is planned in before it is carried. */
  export const LOCAL: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };

  /**
   * A posture re-expressed from one frame to another: its world points and
   * goals carried rigidly, and its whole attitude, heading, pitch and roll,
   * turned by the frames' turn, the heading kept on the unwrapped branch the
   * posture had.
   *
   * @param posture The posture in `from`.
   * @param from The frame the posture is given in.
   * @param to The frame it is moved to.
   * @returns The moved posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what moves and how the heading branch is kept.
   * @evidence contracts/development/implementation.md#principled-implementation `carryHumanPosture` for the points and goals, and the attitude read back from the turn composed with the posture's own rotation, as the ride tips a seated pelvis with its support.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One carry, one composed rotation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Goals attached to a bone are left to their bone, as the carry does.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per limb.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `carryHumanPosture` and `resolveHumanPosture`'s attitude conversions.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function move(
    posture: IAutoMovieMotionHumanPosture,
    from: IAutoMovieRigidTransform,
    to: IAutoMovieRigidTransform,
  ): IAutoMovieMotionHumanPosture {
    const carried: IAutoMovieMotionHumanPosture = carryHumanPosture(
      posture,
      from,
      to,
    );
    const turn: IAutoMovieQuaternion = Quaternion.multiply(
      to.rotation,
      Quaternion.inverse(from.rotation),
    );
    const attitude: Pick<
      IAutoMovieMotionHumanPosture,
      "yaw" | "pitch" | "roll"
    > = resolveHumanPosture.angles(
      Quaternion.multiply(turn, resolveHumanPosture.heading(posture)),
    );
    return {
      ...carried,
      yaw: attitude.yaw + 360 * Math.round((carried.yaw - attitude.yaw) / 360),
      pitch: attitude.pitch,
      roll: attitude.roll,
    };
  }

  /** A point given in a frame, in the world. */
  function carryHumanPoint(
    frame: IAutoMovieRigidTransform,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const turned: IAutoMovieVector3 = Quaternion.rotateVector(
      frame.rotation,
      point,
    );
    return {
      x: frame.position.x + turned.x,
      y: frame.position.y + turned.y,
      z: frame.position.z + turned.z,
    };
  }
}
