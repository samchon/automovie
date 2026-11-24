import { closestPointsBetweenSegments } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";

/**
 * Seat a real appendage's complete root cross-section inside its head.
 *
 * The shared head is the capsule with cap centres poll/nose and headRadius.
 * Eroding that solid by the positive root radius leaves the same finite axis
 * and radius R-r. A centre inside this eroded capsule carries a whole ball of
 * radius r inside the head, hence the root disk in every orientation. This is
 * authored neutral construction, not a measured anatomical insertion. Stem
 * length/direction and any branches remain the producer's responsibility.
 *
 * Public only so the package's specs can reach it: it is not part of the
 * authoring surface, and it moves to an internal subpath when one exists.
 *
 * @param head Generating head capsule, neutral model-space metres.
 * @param hint Authored root-centre hint in that same frame; an already seated
 *   centre stays unchanged.
 * @param stemRadius Positive finite radius enclosing the root cross-section,
 *   metres; for a box use its root rectangle's half-diagonal.
 * @returns A fresh seated centre, preserving an outside hint's nearest-axis
 *   bearing. Radius equality seats on the capsule axis.
 * @throws {RangeError} For nonfinite/degenerate head geometry, invalid radius,
 *   a root larger than the head or an unrepresentable inset/output.
 * @throws {Error} When the shared closest-segment owner cannot represent its
 *   finite query.
 */
export function AutoMovieArchetypeQuadrupedHeadAttachment(
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

  const nearest: ReturnType<typeof closestPointsBetweenSegments> =
    closestPointsBetweenSegments(hint, hint, head.poll, head.nose);
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
