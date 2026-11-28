import { AutoMovieEngineMath } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";

/** Seats an appendage root inside the neutral quadruped head capsule. */
export namespace AutoMovieArchetypeQuadrupedHeadAttachment {
  /**
   * Seats the full root cross-section of an appendage inside the head.
   *
   * The poll and nose are the cap centres of the head capsule. The root
   * centre stays within a capsule with the same axis and radius reduced by
   * the stem radius. The whole root then fits at any orientation. The stem
   * keeps its producer-authored direction and length.
   *
   * @param head The neutral head capsule in animal-model metres.
   * @param hint Authored centre in the same frame.
   * @param stemRadius Radius enclosing the root cross-section, in metres.
   *   A rectangular root uses its half-diagonal.
   * @returns A new centre, unchanged in coordinates when already seated.
   *   An outside centre moves toward the closest point on the axis.
   * @throws {RangeError} For a degenerate head, invalid root radius or
   *   unrepresentable inset.
   * @throws {Error} If the closest-segment query cannot be represented.
   */
  export function attach(
    head: Pick<
      AutoMovieArchetypeQuadrupedBody.IRig,
      "poll" | "nose" | "headRadius"
    >,
    hint: IAutoMovieVector3,
    stemRadius: number,
  ): IAutoMovieVector3 {
    if (
      !(head.headRadius > 0) ||
      !(stemRadius > 0) ||
      stemRadius > head.headRadius
    )
      throw new RangeError(
        "A complete appendage root requires finite capsule geometry and 0 < root radius <= head radius",
      );

    const span: number = Math.hypot(
      head.nose.x - head.poll.x,
      head.nose.y - head.poll.y,
      head.nose.z - head.poll.z,
    );
    const inner: number = head.headRadius - stemRadius;
    if (!(span > 0) || inner === head.headRadius)
      throw new RangeError(
        "The actual head axis and positive appendage inset must be representable",
      );

    const nearest: ReturnType<
      typeof AutoMovieEngineMath.closestPointsBetweenSegments
    > = AutoMovieEngineMath.closestPointsBetweenSegments(
      hint,
      hint,
      head.poll,
      head.nose,
    );
    if (nearest.distance <= inner) return { ...hint };
    if (inner === 0) return { ...nearest.pointB };

    const scale: number = inner / nearest.distance;
    const result: IAutoMovieVector3 = {
      x: nearest.pointB.x + (hint.x - nearest.pointB.x) * scale,
      y: nearest.pointB.y + (hint.y - nearest.pointB.y) * scale,
      z: nearest.pointB.z + (hint.z - nearest.pointB.z) * scale,
    };
    return result;
  }
}
