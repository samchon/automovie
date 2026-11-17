import type {
  AutoMovieQuaternionTuple,
  AutoMovieVector3Tuple,
  IAutoMovieHumanJointCentres,
  IAutoMovieHumanNeutralBody,
} from "@automovie/interface";

import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * The turns every piece of the neutral posture is made of: the shortest turn
 * between two directions, the turn that also matches a side, and the vectors
 * they are written in.
 *
 * Neutral reaches each bone from the bind by one rotation about the bone's
 * own joint. A bone's rotation is composed from its parent's, so a piece
 * states only the turn it adds: the least that brings a direction to the one
 * the posture wants.
 */
export namespace AutoMovieHumanNeutralTurn {
  /** Forward in the registered frame. */
  export const FORWARD: AutoMovieVector3Tuple = [1, 0, 0];

  /** Down in the registered frame. */
  export const DOWN: AutoMovieVector3Tuple = [0, -1, 0];

  /**
   * A body's bind skeleton as the neutral pieces read it.
   *
   * @param joints The bind skeleton.
   * @returns The readers over it.
   */
  export function body(
    joints: readonly IAutoMovieHumanJointCentres.IJoint[],
  ): IAutoMovieHumanNeutralBody {
    const byBone: Map<string, IAutoMovieHumanJointCentres.IJoint> = new Map(
      joints.map(
        (
          j: IAutoMovieHumanJointCentres.IJoint,
        ): [string, IAutoMovieHumanJointCentres.IJoint] => [j.bone, j],
      ),
    );
    return {
      byBone,
      direction: (bone: string): AutoMovieVector3Tuple => {
        const j: IAutoMovieHumanJointCentres.IJoint = byBone.get(bone)!;
        return Math3D.unit(Math3D.sub(j.toward, j.position));
      },
      between: (from: string, to: string): AutoMovieVector3Tuple =>
        Math3D.sub(byBone.get(to)!.position, byBone.get(from)!.position),
    };
  }

  /** Dot product. */
  export function dot(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Cross product a x b. */
  export function cross(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /** Distance between two points. */
  export function length(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): number {
    return Math.hypot(...Math3D.sub(a, b));
  }

  /** The part of v square to unit n. */
  export function perpendicular(
    v: AutoMovieVector3Tuple,
    n: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return Math3D.sub(v, Math3D.times(n, dot(v, n)));
  }

  /**
   * The shortest turn from one direction to another.
   *
   * @param from The first direction.
   * @param to The second direction.
   * @returns The unit quaternion that carries `from` onto `to`.
   */
  export function arc(
    from: AutoMovieVector3Tuple,
    to: AutoMovieVector3Tuple,
  ): AutoMovieQuaternionTuple {
    const a: AutoMovieVector3Tuple = Math3D.unit(from);
    const b: AutoMovieVector3Tuple = Math3D.unit(to);
    const c: AutoMovieVector3Tuple = cross(a, b);
    const q: AutoMovieQuaternionTuple = [c[0], c[1], c[2], 1 + dot(a, b)];
    const n: number = Math.hypot(...q);
    return [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
  }

  /**
   * A bone's world turn that lays it straight on a line, after its parent's.
   *
   * @param body The bind skeleton.
   * @param bone The bone to lay.
   * @param previous The parent's world turn.
   * @param line The unit direction the bone should take.
   * @returns The bone's world turn: the least added turn, then the parent's.
   */
  export function straighten(
    body: IAutoMovieHumanNeutralBody,
    bone: string,
    previous: AutoMovieQuaternionTuple,
    line: AutoMovieVector3Tuple,
  ): AutoMovieQuaternionTuple {
    return Math3D.multiply(
      arc(Math3D.rotate(previous, body.direction(bone)), line),
      previous,
    );
  }

  /**
   * The turn taking one direction and a square side to another pair.
   *
   * @param from The direction to carry.
   * @param side A direction near square to `from`, carried with it.
   * @param to The wanted direction.
   * @param toSide The wanted side, taken square to `to`.
   * @returns The unit quaternion.
   */
  export function frame(
    from: AutoMovieVector3Tuple,
    side: AutoMovieVector3Tuple,
    to: AutoMovieVector3Tuple,
    toSide: AutoMovieVector3Tuple,
  ): AutoMovieQuaternionTuple {
    const first: AutoMovieQuaternionTuple = arc(from, to);
    const carried: AutoMovieVector3Tuple = Math3D.unit(
      perpendicular(Math3D.rotate(first, side), to),
    );
    const wanted: AutoMovieVector3Tuple = Math3D.unit(
      perpendicular(toSide, to),
    );
    const angle: number = Math.atan2(
      dot(cross(carried, wanted), to),
      dot(carried, wanted),
    );
    return Math3D.multiply(
      Math3D.fromAxisAngle(to, (angle * 180) / Math.PI),
      first,
    );
  }
}
