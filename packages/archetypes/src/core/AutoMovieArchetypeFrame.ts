import { Quaternion, Vector3, AutoMovieEngineMath, AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieSweepFrame,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The frame arithmetic every archetype shares: building a contact frame from
 * the directions its kind's convention names, composing a frame with a
 * placement, and moving a frame rigidly.
 *
 * Frames are `IAutoMovieTransform` records in metres with unit scale, in the
 * model's own space: `+Y` up, `+Z` the front of a thing that has one, and `+X`
 * to the left of someone facing along `+Z`, the right-handed convention of glTF
 * that the engine's figures stand in.
 */
export namespace AutoMovieArchetypeFrame {
  /**
   * A rigid motion of the model's space: a point `p` goes to `rotation * p +
   * translation`.
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
   * Copy a frame and all three mutable geometric records without transforming
   * it.
   *
   * @param frame Current scale, translation and orientation in the caller's
   *   frame.
   * @returns An independently owned identical frame.
   */
  export function copy(frame: IAutoMovieTransform): IAutoMovieTransform {
    return {
      translation: { ...frame.translation },
      rotation: { ...frame.rotation },
      scale: { ...frame.scale },
    };
  }

  /**
   * A frame at a finite point whose `+Y` and `+X` follow two directions.
   *
   * @param at The frame's origin, metres.
   * @param out The direction of `+Y`, out of the contact; any length.
   * @param along The direction of `+X`, the contact's line; any length, made
   *   perpendicular to `out`. Absent, a perpendicular is chosen: the world
   *   `+X`, or the world `+Z` when the unit `out` axis has `|x| > 0.9`.
   * @returns The frame, with unit scale.
   * @throws Error for nonfinite coordinates or zero or represented-parallel
   *   directions.
   */
  export function facing(
    at: IAutoMovieVector3,
    out: IAutoMovieVector3,
    along?: IAutoMovieVector3,
  ): IAutoMovieTransform {
    const hint: IAutoMovieVector3 =
      along ??
      (Math.abs(Vector3.normalize(out).x) > 0.9
        ? { x: 0, y: 0, z: 1 }
        : { x: 1, y: 0, z: 0 });
    const basis: IAutoMovieSweepFrame = AutoMovieEngineGeometry.normalizeSurfaceFrame({
      origin: at,
      forward: hint,
      normal: out,
    });

    // Archetype +Y is the normal, so the surface side points along -Z.
    return {
      translation: basis.origin,
      rotation: AutoMovieEngineMath.quaternionFromBasis(
        basis.x,
        basis.normal,
        Vector3.scale(basis.y, -1),
      ),
      scale: { ...UNIT },
    };
  }

  /**
   * A frame at a point with the model's own axes.
   *
   * @param at The frame's origin, metres.
   * @returns The frame, unrotated, with unit scale.
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
   * A frame given in a parent frame's coordinates, in the space the parent is
   * in: a model-local affordance frame under the model's placement is the
   * affordance's world frame.
   *
   * @param parent The parent frame, such as a model's placement in the world.
   * @param child The frame in the parent's coordinates.
   * @returns The child frame in the parent's space.
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
   * @param direction The line's direction; positive degrees turn about it by
   *   the right-hand rule.
   * @param degrees The angle.
   * @returns The motion.
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
