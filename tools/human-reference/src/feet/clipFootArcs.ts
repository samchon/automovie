import type { V3 } from "../geometry/V3.ts";
import type { FootArc } from "./FootArc.ts";

/**
 * Retains the distal source arcs of a foot intersection at its shared ankle plane.
 * The positive half-space of the supplied plane is distal; the limb owner supplies
 * that plane from the same saved boundary consumed by the foot surface.
 *
 * Segment distances are affine, so a sign change gives its intersection by linear
 * interpolation. A cyclic input starts outside the retained half-space; each run
 * ends on exit, retaining gaps rather than closing them with a new ankle chord.
 * Exact boundary touches that retain no segment are omitted. Finite world-mm
 * coordinates and a finite nonzero plane normal are required; invalid input throws.
 * Returned arrays copy source points and do not mutate or alias the input arrays.
 * Floating-point intersections are observations, not an exact-predicate certificate.
 *
 * @evidence contracts/common.md#principled-implementation Affine signed distances locate each crossing on its original source segment; explicit open runs preserve missing intervals at the ankle partition.
 * @evidence contracts/common.md#clear-and-simple-design One pure operation owns half-space clipping; it receives the shared plane rather than deriving a second ankle boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No identity, fixture or expected anatomical profile is special-cased, and no chord or fitted point replaces an absent source arc.
 * @evidence contracts/common.md#meaningful-documentation Documents world units, distal sign, the shared-boundary responsibility, implicit closure, boundary touches, numerical limits and failure behavior.
 * @evidence contracts/performance.md#efficient-algorithms One distance pass and one segment pass take O(n) time and O(n) output and distance storage for n observed points.
 * @evidence contracts/performance.md#reuse-equivalent-work Signed distances are computed once per source point and reused by both adjacent segments; independent calls share no cache or mutable state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Arrays belong to one synchronous invocation and its return value; the function opens no files or handles and retains no cross-call state.
 */
export function clipFootArcs(
  input: FootArc,
  origin: V3,
  normal: V3,
): FootArc[] {
  const finite: (point: V3) => boolean = (point: V3): boolean =>
    point.length === 3 &&
    point.every((v: number): boolean => Number.isFinite(v));
  if (
    !finite(origin) ||
    !finite(normal) ||
    Math.hypot(...normal) === 0 ||
    input.points.length < (input.closed ? 3 : 2) ||
    !input.points.every(finite)
  )
    throw new Error(
      "Finite source arc and nonzero shared ankle plane required",
    );
  const points: V3[] = input.points;
  const distances: number[] = points.map(
    (point: V3): number =>
      (point[0] - origin[0]) * normal[0] +
      (point[1] - origin[1]) * normal[1] +
      (point[2] - origin[2]) * normal[2],
  );
  if (!distances.every((d: number): boolean => Number.isFinite(d)))
    throw new Error("Shared ankle plane distance overflow");
  const copy: (point: V3) => V3 = (point: V3): V3 => [...point] as V3;
  if (distances.every((d: number): boolean => d >= 0))
    return [{ closed: input.closed, points: points.map(copy) }];
  if (distances.every((d: number): boolean => d < 0)) return [];
  const start: number = input.closed
    ? distances.findIndex((d: number): boolean => d < 0)
    : 0;
  const result: FootArc[] = [];
  let current: V3[] = [];
  const append: (point: V3) => void = (point: V3): void => {
    const previous: V3 | undefined = current[current.length - 1];
    if (
      !previous ||
      previous.some((v: number, i: number): boolean => v !== point[i])
    )
      current.push(copy(point));
  };
  if (distances[start] >= 0) append(points[start]);
  const edges: number = input.closed ? points.length : points.length - 1;
  for (let offset: number = 0; offset < edges; offset++) {
    const i: number = (start + offset) % points.length;
    const j: number = (i + 1) % points.length;
    if (distances[i] >= 0 !== distances[j] >= 0) {
      const a: number = Math.abs(distances[i]);
      const b: number = Math.abs(distances[j]);
      const t: number = a >= b ? 1 / (1 + b / a) : a / b / (1 + a / b);
      const intersection: V3 = [0, 1, 2].map(
        (k: number): number => (1 - t) * points[i][k] + t * points[j][k],
      ) as V3;
      append(intersection);
      if (distances[j] < 0) {
        if (current.length > 1) result.push({ closed: false, points: current });
        current = [];
      }
    }
    if (distances[j] >= 0) append(points[j]);
  }
  if (current.length > 1) result.push({ closed: false, points: current });
  return result;
}
