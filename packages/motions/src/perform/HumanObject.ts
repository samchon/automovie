import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMoviePhysicalProfile,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { seated } from "../everyday/seated";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanProp } from "./IHumanProp";

/**
 * Attach actions to an object: an object says where a person meets it
 * through its affordances (a seat, a handle, a surface), and this gives the
 * actions what they read of it, placed in the world.
 *
 * The object is any model that declares affordances in its own space, such
 * as an archetype; nothing here depends on how it was made. Its place is
 * where the scene puts it. A sitting action then sits on the seat the chair
 * declares, at the height and depth the chair has, and a grasp, a touch or
 * a look goes to the contact the object names instead of to coordinates
 * written by hand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what an object declares, what this gives the actions and what it does not depend on.
 * @evidence contracts/development/design.md#principled-representation An object is read through the interface's affordance record alone, and placed by a rigid world frame; each result is the type an action already takes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The object's shape, its placement, and one function per thing an action reads: a prop and a seat.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No object kind is special-cased; a wrong or missing affordance is refused with the ids that fit.
 */
export namespace HumanObject {
  /** What is read of an object. */
  export interface IModel {
    /** Its contacts, in its own space. */
    affordances?: readonly IAutoMovieAffordance[] | null;

    /** Its colliders in its own space, for a hand to close on. */
    shapes?(): IAutoMoviePhysicalProfile.IShape[];
  }

  /**
   * Where the scene puts an object: a rigid world frame, or the floor point
   * under its origin and the heading its own `+Z` faces, degrees about +Y.
   */
  export type Placement =
    | IHumanProp.IFrame
    | { at: IAutoMovieVector3; yaw: number };

  /**
   * A placement as a rigid world frame.
   *
   * @param placement The placement.
   * @returns The frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation A heading is a rotation about the world's up by that angle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch on which form was given.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A frame given as one is returned unchanged.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function frame(placement: Placement): IHumanProp.IFrame {
    return "position" in placement
      ? placement
      : {
          position: placement.at,
          rotation: Quaternion.fromAxisAngle(
            { x: 0, y: 1, z: 0 },
            placement.yaw,
          ),
        };
  }

  /**
   * An object as a prop of a performance: actions aim at its contacts by
   * their ids, hands grasp its handles, and it rides the hand that holds it.
   *
   * Every affordance is also a named point of the prop, at the contact with
   * the contact's `+Y` as its outward normal, so `{ kind: "prop", subject,
   * point: "pull" }` is a target.
   *
   * @param subject The prop's subject id in the performance.
   * @param model The object.
   * @param placement Where it rests before any hand takes it.
   * @returns The prop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the prop offers the actions and how a contact becomes a target.
   * @evidence contracts/development/implementation.md#principled-implementation A contact frame's translation is its point and its rotated `+Y` its outward normal, the affordance record's own convention.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the affordances.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The colliders are the object's own when it gives them, and absent otherwise.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the affordances.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds the object's affordances and colliders for as long as the prop is held.
   */
  export function prop(
    subject: string,
    model: IModel,
    placement: Placement,
  ): IHumanProp {
    const affordances: readonly IAutoMovieAffordance[] =
      model.affordances ?? [];
    const shapes: IAutoMoviePhysicalProfile.IShape[] | undefined =
      model.shapes?.();
    return {
      subject,
      frame: frame(placement),
      points: Object.fromEntries(
        affordances.map((affordance: IAutoMovieAffordance) => [
          affordance.id,
          {
            point: affordance.frame.translation,
            normal: Quaternion.rotateVector(affordance.frame.rotation, {
              x: 0,
              y: 1,
              z: 0,
            }),
          },
        ]),
      ),
      affordances,
      ...(shapes === undefined ? {} : { shapes }),
    };
  }

  /**
   * An object's seat in the world, for the actions that sit on one: the
   * middle of its front edge, the heading a sitter faces, and the depth and
   * backrest it declares.
   *
   * @param model The object.
   * @param placement Where the scene puts it.
   * @param id The seat's affordance id; the object's only seat when absent.
   * @returns The seat.
   * @throws {HumanRefusal} When the object has no such seat, or several and none is named, listing its seats.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read of the seat and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation A seat contact's frame sits on the front edge with `+Z` toward the sitter's front and `+Y` up, so the placed frame's origin is the seat's place and its turned `+Z` the heading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the seat, place its frame, read the heading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing or ambiguous seat is refused, never guessed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the affordances.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function seat(
    model: IModel,
    placement: Placement,
    id?: string,
  ): seated.ISeat {
    const seats: IAutoMovieAffordance[] = (model.affordances ?? []).filter(
      (affordance: IAutoMovieAffordance): boolean => affordance.kind === "seat",
    );
    const found: IAutoMovieAffordance | undefined =
      id === undefined
        ? seats.length === 1
          ? seats[0]
          : undefined
        : seats.find(
            (affordance: IAutoMovieAffordance): boolean => affordance.id === id,
          );
    if (found === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "seat",
        value: id,
        feasible: {
          kind: "alternatives",
          values: seats.map(
            (affordance: IAutoMovieAffordance): string => affordance.id,
          ),
        },
        reason:
          id !== undefined
            ? `the object has no seat named ${id}`
            : seats.length === 0
              ? "the object declares no seat"
              : `the object has ${seats.length} seats, and none is named`,
        fix: "name one of the object's seats, or sit on an object that has one",
      });
    const world: IHumanProp.IFrame = frame(placement);
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(world.rotation, found.frame.rotation),
      { x: 0, y: 0, z: 1 },
    );
    return {
      at: Vector3.add(
        world.position,
        Quaternion.rotateVector(world.rotation, found.frame.translation),
      ),
      yaw: (Math.atan2(forward.x, forward.z) * 180) / Math.PI,
      ...(found.depth === undefined ? {} : { depth: found.depth }),
      ...(found.back === undefined ? {} : { back: found.back }),
    };
  }
}
