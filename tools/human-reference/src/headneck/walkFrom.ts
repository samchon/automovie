import type { V3 } from "../geometry/V3.ts";
import { subArc } from "./subArc.ts";

/**
 * Walks an ordered source curve from a segment position in either direction.
 * Open curves stop at their end; closed curves stop just short of one full turn.
 *
 * @evidence contracts/common.md#principled-implementation Reversing both coordinates and segment position preserves the same source edges for a backward walk.
 * @evidence contracts/common.md#clear-and-simple-design Both directions use one source-preserving subArc implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A backward walk does not connect its endpoints with a replacement chord.
 * @evidence contracts/common.md#meaningful-documentation States direction, termination and the near-full-turn closed convention.
 * @evidence contracts/performance.md#efficient-algorithms At most N source points are traversed; a backward walk allocates one reversed N-point array.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure source walk coordinates no caches or requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary and returned arrays are bounded by the input point count; no external resources are owned.
 */
export function walkFrom(
  points: V3[],
  closed: boolean,
  position: number,
  direction: 1 | -1,
): V3[] {
  const count: number = points.length;
  if (direction === 1)
    return subArc(
      points,
      closed,
      position,
      closed ? position + count - 1e-6 : count - 1,
    );
  const reverse: V3[] = [...points].reverse();
  let reversedPosition: number = count - 1 - position;
  if (closed) reversedPosition = ((reversedPosition % count) + count) % count;
  return subArc(
    reverse,
    closed,
    reversedPosition,
    closed ? reversedPosition + count - 1e-6 : count - 1,
  );
}
