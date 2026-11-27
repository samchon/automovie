import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../math/AutoMovieEngineQuaternion";

/**
 * A solver body's inertia maps (`AutoMovieEngineXpbdBody`): a world vector taken
 * through its principal inertia frame, and the world inverse inertia frozen as
 * a row-major matrix for a substep.
 */
export namespace AutoMovieEngineXpbdInertia {
  /**
   * A world vector taken through a body's principal inertia frame: `R D R^T v`,
   * with `R` the body rotation times its inertia rotation and `D` the diagonal
   * map `principal` applies in that frame.
   *
   * @param orientation The body frame's world rotation.
   * @param inertiaRotation The principal frame's rotation in the body frame.
   * @param v A world vector.
   * @param principal The diagonal map, on the vector in the principal frame.
   * @returns The mapped vector, world frame.
   */
  export function apply(
    orientation: IAutoMovieQuaternion,
    inertiaRotation: IAutoMovieQuaternion,
    v: IAutoMovieVector3,
    principal: (local: IAutoMovieVector3) => IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const r: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      orientation,
      inertiaRotation,
    );
    const local: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.inverse(r),
      v,
    );
    return AutoMovieEngineQuaternion.rotateVector(r, principal(local));
  }

  /**
   * A linear map's row-major matrix, its columns the map's images of the world
   * axes.
   *
   * @param map The map.
   * @returns Its nine entries, row by row.
   */
  export function freeze(
    map: (v: IAutoMovieVector3) => IAutoMovieVector3,
  ): number[] {
    const x: IAutoMovieVector3 = map({ x: 1, y: 0, z: 0 });
    const y: IAutoMovieVector3 = map({ x: 0, y: 1, z: 0 });
    const z: IAutoMovieVector3 = map({ x: 0, y: 0, z: 1 });
    return [x.x, y.x, z.x, x.y, y.y, z.y, x.z, y.z, z.z];
  }

  /**
   * A row-major matrix applied to a world vector.
   *
   * @param m The matrix's nine entries, row by row.
   * @param v A world vector.
   * @returns The product.
   */
  export function multiply(
    m: readonly number[],
    v: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return {
      x: m[0]! * v.x + m[1]! * v.y + m[2]! * v.z,
      y: m[3]! * v.x + m[4]! * v.y + m[5]! * v.z,
      z: m[6]! * v.x + m[7]! * v.y + m[8]! * v.z,
    };
  }
}
