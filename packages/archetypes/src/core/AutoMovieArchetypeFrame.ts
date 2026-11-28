import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineMath, AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieSweepFrame,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Builds contact frames and composes rigid transforms in archetype space.
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

  /** Unit scale for contact frames. Constructors copy these three components. */
  export const UNIT: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

  /** The identity rotation and zero translation. */
  export const STILL: IMotion = {
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    translation: { x: 0, y: 0, z: 0 },
  };

  /**
   * Copies a frame's position, orientation and scale into independent records.
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
   * Creates a unit-scale contact frame from its normal and along direction.
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
      (Math.abs(AutoMovieEngineVector3.normalize(out).x) > 0.9
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
        AutoMovieEngineVector3.scale(basis.y, -1),
      ),
      scale: { ...UNIT },
    };
  }

  /**
   * Places an unrotated contact frame at the supplied point in metres.
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
   * Reads a rotated coordinate axis in the frame's parent space.
   *
   * @param frame The frame.
   * @param axis Which of its axes.
   * @returns The unit direction.
   */
  export function axis(
    frame: IAutoMovieTransform,
    axis: "x" | "y" | "z",
  ): IAutoMovieVector3 {
    return AutoMovieEngineQuaternion.rotateVector(frame.rotation, {
      x: axis === "x" ? 1 : 0,
      y: axis === "y" ? 1 : 0,
      z: axis === "z" ? 1 : 0,
    });
  }

  /**
   * Maps a rigid frame's local point to its parent space.
   *
   * Applies the frame's rotation and translation to metre coordinates.
   *
   * @param frame The frame.
   * @param local The point in the frame's coordinates, metres.
   * @returns The point in the frame's parent space.
   */
  export function point(
    frame: IAutoMovieTransform,
    local: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return AutoMovieEngineVector3.add(
      frame.translation,
      AutoMovieEngineQuaternion.rotateVector(frame.rotation, local),
    );
  }

  /**
   * Applies a rigid motion and copies the frame's existing scale.
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
      translation: AutoMovieEngineVector3.add(
        AutoMovieEngineQuaternion.rotateVector(motion.rotation, frame.translation),
        motion.translation,
      ),
      rotation: AutoMovieEngineQuaternion.normalize(
        AutoMovieEngineQuaternion.multiply(motion.rotation, frame.rotation),
      ),
      scale: { ...frame.scale },
    };
  }

  /**
   * Expresses a child contact frame in its parent's space.
   *
   * Applies the parent's rotation and translation. The result copies the
   * child's scale.
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
   * Composes two rigid motions in application order.
   *
   * @param after The motion applied second.
   * @param before The motion applied first.
   * @returns Their composite.
   */
  export function chain(after: IMotion, before: IMotion): IMotion {
    return {
      rotation: AutoMovieEngineQuaternion.normalize(
        AutoMovieEngineQuaternion.multiply(after.rotation, before.rotation),
      ),
      translation: AutoMovieEngineVector3.add(
        AutoMovieEngineQuaternion.rotateVector(after.rotation, before.translation),
        after.translation,
      ),
    };
  }

  /**
   * Rotates about a line fixed in the frame's parent space.
   *
   * @param through A point of the line, metres.
   * @param direction The line's nonzero direction. Positive angles follow
   *   the right-hand rule.
   * @param degrees The angle.
   * @returns The motion.
   */
  export function turn(
    through: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    degrees: number,
  ): IMotion {
    const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
      direction,
      degrees,
    );
    return {
      rotation,
      translation: AutoMovieEngineVector3.subtract(
        through,
        AutoMovieEngineQuaternion.rotateVector(rotation, through),
      ),
    };
  }
}
