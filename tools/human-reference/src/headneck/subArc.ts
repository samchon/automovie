import type { V3 } from "../geometry/V3.ts";
import { dist } from "../geometry/dist.ts";
import { lerp } from "../geometry/lerp.ts";

/**
 * Keeps an ordered source arc between segment-index-plus-fraction positions.
 * Open arcs require increasing positions; a closed arc may wrap once. Endpoint
 * interpolation stays on the original source segments, never a closing chord.
 *
 * @evidence contracts/common.md#principled-implementation Segment-local linear interpolation and complete intermediate source edges preserve containment.
 * @evidence contracts/common.md#clear-and-simple-design Explicit open and closed domains keep wrapping with the curve owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A reversed open range fails instead of silently replacing its source arc with a chord.
 * @evidence contracts/common.md#meaningful-documentation States parameter units, ordering, wrap limit and endpoint construction.
 * @evidence contracts/performance.md#efficient-algorithms One traversal emits at most N plus two points because a closed arc wraps at most once.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pure slicing operation coordinates no requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned bounded arc array is retained; no external resources are acquired.
 */
export function subArc(
  points: V3[],
  closed: boolean,
  start: number,
  end: number,
): V3[] {
  const count: number = points.length;
  if (count < 2 || !Number.isFinite(start) || !Number.isFinite(end))
    throw new Error(
      "Finite positions and at least two source points are required",
    );
  if (!closed && (start < 0 || end < start || end > count - 1))
    throw new Error("An open source arc requires an ordered in-domain range");
  if (closed && Math.abs(end - start) > count)
    throw new Error("A closed source arc may wrap at most once");
  const at: (value: number) => V3 = (value: number): V3 => {
    const edge: number = Math.floor(value),
      fraction: number = value - edge;
    return lerp(
      points[((edge % count) + count) % count],
      points[(((edge + 1) % count) + count) % count],
      fraction,
    );
  };
  const output: V3[] = [at(start)];
  const terminal: number = end >= start ? end : end + count;
  for (let i: number = Math.floor(start) + 1; i <= Math.floor(terminal); i++)
    output.push(points[((i % count) + count) % count]);
  output.push(at(end));
  return output.filter(
    (point: V3, i: number): boolean => !i || dist(point, output[i - 1]) > 1e-7,
  );
}
