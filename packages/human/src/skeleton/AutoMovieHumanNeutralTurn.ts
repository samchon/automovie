import type { AutoMovieHumanJointCentres } from "./AutoMovieHumanJointCentres";
import type { IAutoMovieHumanNeutralBody } from "./IAutoMovieHumanNeutralBody";
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
  export const FORWARD: Math3D.Vector = [1, 0, 0];

  /** Down in the registered frame. */
  export const DOWN: Math3D.Vector = [0, -1, 0];

  /**
   * A body's bind skeleton as the neutral pieces read it.
   *
   * @param joints The bind skeleton.
   * @returns The readers over it.
   */
  export function body(
    joints: readonly AutoMovieHumanJointCentres.IJoint[],
  ): IAutoMovieHumanNeutralBody {
    const byBone: Map<string, AutoMovieHumanJointCentres.IJoint> = new Map(
      joints.map(
        (
          j: AutoMovieHumanJointCentres.IJoint,
        ): [string, AutoMovieHumanJointCentres.IJoint] => [j.bone, j],
      ),
    );
    return {
      byBone,
      direction: (bone: string): Math3D.Vector => {
        const j: AutoMovieHumanJointCentres.IJoint = byBone.get(bone)!;
        return Math3D.unit(Math3D.sub(j.toward, j.position));
      },
      between: (from: string, to: string): Math3D.Vector =>
        Math3D.sub(byBone.get(to)!.position, byBone.get(from)!.position),
    };
  }

  /** Dot product. */
  export function dot(a: Math3D.Vector, b: Math3D.Vector): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Cross product a x b. */
  export function cross(a: Math3D.Vector, b: Math3D.Vector): Math3D.Vector {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /** Distance between two points. */
  export function length(a: Math3D.Vector, b: Math3D.Vector): number {
    return Math.hypot(...Math3D.sub(a, b));
  }

  /** The part of v square to unit n. */
  export function perpendicular(
    v: Math3D.Vector,
    n: Math3D.Vector,
  ): Math3D.Vector {
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
    from: Math3D.Vector,
    to: Math3D.Vector,
  ): Math3D.Quaternion {
    const a: Math3D.Vector = Math3D.unit(from);
    const b: Math3D.Vector = Math3D.unit(to);
    const c: Math3D.Vector = cross(a, b);
    const q: Math3D.Quaternion = [c[0], c[1], c[2], 1 + dot(a, b)];
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
    previous: Math3D.Quaternion,
    line: Math3D.Vector,
  ): Math3D.Quaternion {
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
    from: Math3D.Vector,
    side: Math3D.Vector,
    to: Math3D.Vector,
    toSide: Math3D.Vector,
  ): Math3D.Quaternion {
    const first: Math3D.Quaternion = arc(from, to);
    const carried: Math3D.Vector = Math3D.unit(
      perpendicular(Math3D.rotate(first, side), to),
    );
    const wanted: Math3D.Vector = Math3D.unit(perpendicular(toSide, to));
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
