import {
  Quaternion,
  Vector3,
  quaternionFromAutoMovieBasis,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The frame arithmetic every archetype shares: building a contact frame from the directions its kind's convention names, composing a frame with a placement, and moving a frame rigidly.
 *
 * Frames are `IAutoMovieTransform` records in metres with unit scale, in the model's own space: `+Y` up, `+Z` the front of a thing that has one, and `+X` to the left of someone facing along `+Z`, the right-handed convention of glTF that the engine's figures stand in.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the unit, the scale premise and the model's axes.
 * @evidence contracts/development/design.md#principled-representation Rigid frames as translation and unit quaternion; a rigid motion is the same pair read as a map, so composing and moving need no matrix.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The few operations producers, articulation and sites all call; vector and quaternion arithmetic stays with the engine's `Vector3` and `Quaternion`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scale is always one, stated here, so no operation silently drops a scale it was given.
 */
export namespace ArchetypeFrame {
  /**
   * A rigid motion of the model's space: a point `p` goes to `rotation * p + translation`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A rigid motion of the model's space: a unit quaternion applied about the origin, then a translation in metres. It has no scale, so a motion cannot deform a part.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; made by `turn` and `ArchetypeArticulation.motion`, composed by `chain` and applied by `move`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Not the interface transform, whose scale a rigid motion must not carry.
   */
  export interface IMotion {
    /** The turn, a unit quaternion. */
    rotation: IAutoMovieQuaternion;

    /** The shift after the turn, metres. */
    translation: IAutoMovieVector3;
  }

  /** The unit scale every archetype frame carries. */
  export const UNIT: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

  /** The motion that moves nothing. */
  export const STILL: IMotion = {
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    translation: { x: 0, y: 0, z: 0 },
  };

  /**
   * A frame at a point whose `+Y` and `+X` point along two given directions.
   *
   * @param at The frame's origin, metres.
   * @param out The direction of `+Y`, out of the contact; any length.
   * @param along The direction of `+X`, the contact's line; any length, made perpendicular to `out`. Absent, a perpendicular is chosen: the world `+X`, or the world `+Z` when `out` runs along the world X axis.
   * @returns The frame, with unit scale.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each direction's role, that lengths are free and how a missing line is chosen.
   * @evidence contracts/development/implementation.md#principled-implementation Gram-Schmidt on the two directions, `+Z` as their cross product, then the engine's basis-to-quaternion conversion; the two inputs must not be parallel, which the producers' fixed directions never are.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One orthonormal basis, one conversion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fallback line depends only on `out`, so it is the same for every archetype.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `quaternionFromAutoMovieBasis`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function facing(
    at: IAutoMovieVector3,
    out: IAutoMovieVector3,
    along?: IAutoMovieVector3,
  ): IAutoMovieTransform {
    const y: IAutoMovieVector3 = Vector3.normalize(out);
    const hint: IAutoMovieVector3 =
      along ??
      (Math.abs(y.x) > 0.9 ? { x: 0, y: 0, z: 1 } : { x: 1, y: 0, z: 0 });
    const x: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(hint, Vector3.scale(y, Vector3.dot(hint, y))),
    );
    return {
      translation: { ...at },
      rotation: quaternionFromAutoMovieBasis(x, y, Vector3.cross(x, y)),
      scale: { ...UNIT },
    };
  }

  /**
   * A frame at a point with the model's own axes.
   *
   * @param at The frame's origin, metres.
   * @returns The frame, unrotated, with unit scale.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result's axes.
   * @evidence contracts/development/implementation.md#principled-implementation The identity rotation at a point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function upright(at: IAutoMovieVector3): IAutoMovieTransform {
    return {
      translation: { ...at },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { ...UNIT },
    };
  }

  /**
   * One axis of a frame as a unit direction of the space the frame is in.
   *
   * @param frame The frame.
   * @param axis Which of its axes.
   * @returns The unit direction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the space of the result.
   * @evidence contracts/development/implementation.md#principled-implementation The frame's rotation applied to the unit axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `Quaternion.rotateVector`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function axis(
    frame: IAutoMovieTransform,
    axis: "x" | "y" | "z",
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(frame.rotation, {
      x: axis === "x" ? 1 : 0,
      y: axis === "y" ? 1 : 0,
      z: axis === "z" ? 1 : 0,
    });
  }

  /**
   * A point given in a frame's own coordinates, in the space the frame is in.
   *
   * @param frame The frame.
   * @param local The point in the frame's coordinates, metres.
   * @returns The point in the frame's parent space.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both spaces.
   * @evidence contracts/development/implementation.md#principled-implementation Rotate, then translate; scale is one by this namespace's premise.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation and one sum.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's vector arithmetic.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function point(
    frame: IAutoMovieTransform,
    local: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Vector3.add(
      frame.translation,
      Quaternion.rotateVector(frame.rotation, local),
    );
  }

  /**
   * A frame moved by a rigid motion.
   *
   * @param motion The motion of the space the frame is in.
   * @param frame The frame.
   * @returns The moved frame; its scale is kept.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what moves and what is kept.
   * @evidence contracts/development/implementation.md#principled-implementation The origin goes through the motion's map and the rotation is premultiplied by its turn, then renormalised so repeated motions keep a unit quaternion.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map of the origin, one product.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's quaternion arithmetic.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function move(
    motion: IMotion,
    frame: IAutoMovieTransform,
  ): IAutoMovieTransform {
    return {
      translation: Vector3.add(
        Quaternion.rotateVector(motion.rotation, frame.translation),
        motion.translation,
      ),
      rotation: Quaternion.normalize(
        Quaternion.multiply(motion.rotation, frame.rotation),
      ),
      scale: { ...frame.scale },
    };
  }

  /**
   * A frame given in a parent frame's coordinates, in the space the parent is in: a model-local affordance frame under the model's placement is the affordance's world frame.
   *
   * @param parent The parent frame, such as a model's placement in the world.
   * @param child The frame in the parent's coordinates.
   * @returns The child frame in the parent's space.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the spaces and the use.
   * @evidence contracts/development/implementation.md#principled-implementation A unit-scale parent frame read as a rigid motion and applied through `move`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The parent's scale is not applied, by this namespace's unit-scale premise; a scaled placement is the scene's to lower.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `move`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function compose(
    parent: IAutoMovieTransform,
    child: IAutoMovieTransform,
  ): IAutoMovieTransform {
    return move(
      { rotation: parent.rotation, translation: parent.translation },
      child,
    );
  }

  /**
   * The motion that first applies one motion and then another.
   *
   * @param after The motion applied second.
   * @param before The motion applied first.
   * @returns Their composite.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order.
   * @evidence contracts/development/implementation.md#principled-implementation `after(before(p)) = Ra Rb p + Ra tb + ta`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One product and one mapped translation.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's quaternion arithmetic.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function chain(after: IMotion, before: IMotion): IMotion {
    return {
      rotation: Quaternion.normalize(
        Quaternion.multiply(after.rotation, before.rotation),
      ),
      translation: Vector3.add(
        Quaternion.rotateVector(after.rotation, before.translation),
        after.translation,
      ),
    };
  }

  /**
   * The turn of a number of degrees about a line.
   *
   * @param through A point of the line, metres.
   * @param direction The line's direction; positive degrees turn about it by the right-hand rule.
   * @param degrees The angle.
   * @returns The motion.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the turning sense and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation A rotation about a line through `c` is `p -> R (p - c) + c`, so its translation is `c - R c`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One axis-angle quaternion and the translation it implies.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `Quaternion.fromAxisAngle`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function turn(
    through: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    degrees: number,
  ): IMotion {
    const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      direction,
      degrees,
    );
    return {
      rotation,
      translation: Vector3.subtract(
        through,
        Quaternion.rotateVector(rotation, through),
      ),
    };
  }
}
