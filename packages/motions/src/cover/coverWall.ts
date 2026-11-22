import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * A staged wall's face as cover reads it: the face's plane through the
 * prop's origin with its outward normal along the prop's `+Z`, its length
 * along the prop's `+X` and its two ends, in world metres. A wall archetype
 * stands in its `XY` plane with its front face toward `+Z` and names that
 * face `face`, its width the wall's length.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, units and the archetype convention read.
 * @evidence contracts/development/design.md#principled-representation A horizontal centre, two horizontal unit axes and a half length.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The face record, its reader and the cover refusal the cover moves share.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every value is read from the placed prop; a moving prop or a missing face is refused.
 */
export namespace coverWall {
  /**
   * A wall face in world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's frame and unit.
   * @evidence contracts/development/design.md#principled-representation The face's centre at floor height, its outward normal and its length axis, both horizontal unit vectors, and its half length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The four values the cover moves read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Built only by read.
   */
  export interface IFace {
    /** The face's centre on the floor, world metres. */
    center: IAutoMovieVector3;

    /** Its outward horizontal unit normal. */
    normal: IAutoMovieVector3;

    /** Its horizontal unit length axis, toward its `right` end. */
    axis: IAutoMovieVector3;

    /** Half its length, metres. */
    half: number;
  }

  /**
   * Read a fixed prop's face.
   *
   * @param context The action's context.
   * @param subject The wall or window prop.
   * @param face The surface or aperture affordance whose width is the face's length.
   * @returns The face.
   * @throws {HumanRefusal} If the prop moves or has no such affordance with a width.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Rotates the prop's +Z and +X into the world, flattened to the floor, and takes the affordance's width as the face length.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, then one frame transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses a prop it cannot read rather than assuming a face.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the prop's affordances.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function read(
    context: IAutoMovieMotionHumanActionContext,
    subject: string,
    face: string,
  ): IFace {
    const reader: IAutoMovieMotionHumanPropReader = context.prop(subject);
    const affordance: IAutoMovieAffordance | undefined =
      reader.prop.affordances?.find(
        (item: IAutoMovieAffordance): boolean => item.id === face,
      );
    if (
      reader.prop.motion !== undefined ||
      affordance?.width === undefined ||
      !(affordance.width > 0)
    )
      throw refusal(
        "face",
        face,
        `${subject} has no fixed face ${face} with a width`,
      );
    const world: IAutoMovieRigidTransform = reader.frame(context.start);
    const flat = (v: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.normalize({ x: v.x, y: 0, z: v.z });
    return {
      center: { ...world.position, y: 0 },
      normal: flat(
        Quaternion.rotateVector(world.rotation, { x: 0, y: 0, z: 1 }),
      ),
      axis: flat(Quaternion.rotateVector(world.rotation, { x: 1, y: 0, z: 0 })),
      half: affordance.width / 2,
    };
  }

  /**
   * The cover moves' refusal.
   *
   * @param axis The refused parameter's path.
   * @param value The refused value.
   * @param reason Why it is refused.
   * @returns The refusal to throw.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and result.
   * @evidence contracts/development/implementation.md#principled-implementation One refusal kind for a cover geometry that does not fit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds one record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Names the actual parameter and value.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one record.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function refusal(
    axis: string,
    value: unknown,
    reason: string,
  ): HumanRefusal {
    return new HumanRefusal({
      kind: "affordance",
      axis,
      value,
      reason,
      fix: "stage the performer against a fixed wall, window or door within reach",
    });
  }
}
