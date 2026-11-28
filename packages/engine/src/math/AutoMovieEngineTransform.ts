import type {
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "./AutoMovieEngineQuaternion";

/**
 * The one constructor of {@link IAutoMovieTransform} records: a translation, a
 * rotation and a per-axis scale, metres, a unit quaternion and dimensionless
 * factors.
 *
 * A frame that does not scale carries the unit scale, `(1, 1, 1)`; it is
 * written here once instead of at every site that builds a frame. Every
 * function returns a new record, because callers spread and build on the frames
 * they are given and must never alias one shared record.
 */
export namespace AutoMovieEngineTransform {
  /** Create a transform with zero translation, identity rotation and unit scale. */
  export const identity: () => IAutoMovieTransform = (): IAutoMovieTransform =>
    of({ x: 0, y: 0, z: 0 }, AutoMovieEngineQuaternion.identity());

  /**
   * Assemble a transform from existing translation, rotation and optional scale
   * records.
   *
   * The supplied records are retained by reference. An omitted scale creates a
   * fresh vector of ones.
   */
  export function of(
    translation: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
    scale: IAutoMovieVector3 = { x: 1, y: 1, z: 1 },
  ): IAutoMovieTransform {
    return { translation, rotation, scale };
  }
}
