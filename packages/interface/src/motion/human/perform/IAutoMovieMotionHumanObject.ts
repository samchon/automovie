import type { IAutoMovieAffordance } from "../../../model/IAutoMovieAffordance";
import type { IAutoMovieBody } from "../../../model/IAutoMovieBody";
import type { IAutoMovieMotionHumanProp } from "./IAutoMovieMotionHumanProp";
import type { IAutoMoviePhysicalProfile } from "../../../physics/IAutoMoviePhysicalProfile";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

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
 * @evidence contracts/development/common.md#meaningful-documentation body: Its physical data (an archetype's model body); none when absent or null.
 * @evidence contracts/development/design.md#principled-representation body: Its physical data (an archetype's model body); none when absent or null.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanObject.ts (HumanObject.frame, placement); perform/HumanObject.ts (HumanObject.prop, placement); perform/HumanObject.ts (HumanObject.prop, motion); perform/HumanObject.ts (HumanObject.seat, placement); perform/HumanObstacle.ts (HumanObstacle.apertures, placement); perform/HumanObstacle.ts (HumanObstacle.object, placement).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieAffordance, IAutoMoviePhysicalProfile.IShape, IAutoMovieBody, IAutoMovieMotionHumanProp.IFrame identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanObject {
  /**
   * An object as a prop of a performance: actions aim at its contacts by their ids, hands grasp its handles, and it rides the hand that holds it. What is read of an object.
   *
   * @evidence contracts/development/common.md#meaningful-documentation body: Its physical data (an archetype's model body); none when absent or null.
   * @evidence contracts/development/design.md#principled-representation body: Its physical data (an archetype's model body); none when absent or null.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanObject.ts (HumanObject.prop, model); perform/HumanObject.ts (HumanObject.seat, model); perform/HumanObstacle.ts (HumanObstacle.apertures, model); perform/HumanObstacle.ts (HumanObstacle.object, model); perform/HumanObject.ts (HumanObject.prop).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieAffordance, IAutoMoviePhysicalProfile.IShape, IAutoMovieBody identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IModel {
    /** Its contacts, in its own space. */
    affordances?: readonly IAutoMovieAffordance[] | null;

    /** Its colliders in its own space, for a hand to close on. */
    shapes?(): IAutoMoviePhysicalProfile.IShape[];

    /**
     * The object with its articulations at stated travels, for an object
     * whose parts move (an archetype's `articulate`); a rigid object has none.
     *
     * @param state Travel by articulation id.
     * @returns The posed object.
     */
    articulate?(
      state: Readonly<Record<string, number>>,
    ): IAutoMovieMotionHumanObject.IModel;

    /** Its physical data (an archetype's model body); none when absent or null. */
    body?: IAutoMovieBody | null;
  }

  /**
   * Where the scene puts an object: a rigid world frame, or the floor point
   * under its origin and the heading its own `+Z` faces, degrees about +Y;
   * `fixed` sets it as a fixture, which hands grip and never carry
   * (`IAutoMovieMotionHumanProp.fixed`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation at: World floor point beneath the object's origin, metres; the object builder places its origin above this floor point. yaw: Object yaw in degrees about world +Y. fixed: Whether the object is immovable; omitted leaves the normal movable placement behavior.
   * @evidence contracts/development/design.md#principled-representation at: World floor point beneath the object's origin, metres; the object builder places its origin above this floor point. yaw: Object yaw in degrees about world +Y. fixed: Whether the object is immovable; omitted leaves the normal movable placement behavior.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanObject.ts (HumanObject.frame, placement); perform/HumanObject.ts (HumanObject.prop, placement); perform/HumanObject.ts (HumanObject.prop, motion); perform/HumanObject.ts (HumanObject.seat, placement); perform/HumanObstacle.ts (HumanObstacle.apertures, placement); perform/HumanObstacle.ts (HumanObstacle.object, placement).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanProp.IFrame, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type Placement = (
    | IAutoMovieMotionHumanProp.IFrame
    | {
        /** World floor point beneath the object's origin, metres; the object builder places its origin above this floor point. */
        at: IAutoMovieVector3;
        /** Object yaw in degrees about world +Y. */
        yaw: number;
      }
  ) & {
    /** Whether the object is immovable; omitted leaves the normal movable placement behavior. */
    fixed?: boolean;
  };
}
