import type {
  AutoMovieVector2Tuple,
  IAutoMovieSolidMeshConstraints,
} from "@automovie/interface";

import { orientAutoMovieSolidChart } from "./orientAutoMovieSolidChart";

/**
 * Check the empty native triangle between a represented edge and a probe.
 *
 * A floating distance is useful for proposing a small probe, but its error is
 * not a topology proof. This reading checks represented boundary vertices and
 * segment intersections on the proposed triangle with exact orientation signs.
 * A successful probe is connected to the edge's open side through that empty
 * triangle. Source endpoints are ignored only by original ID and cover image.
 *
 * Periodic checks use local images for one-period primitives and a probe whose
 * phase range is no larger than one period. Safe integer/image arithmetic is
 * required. This validates the represented local partition, not an interval
 * enclosure of a curved boundary, world distance or arbitrary winding domain.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Uses exact signs for point-in-triangle and proper segment crossings, plus endpoint-on-segment checks, to reject a probe corridor containing any other represented boundary.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One local triangle witness is shared by left-side probes and rounded bridge-midpoint membership; it evaluates no source surface.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not equate an approximate clearance with exact topology or weld coincident IDs. Unsupported phase width or contact returns false, while unavailable endpoints and unrepresentable local images return named arithmetic failure.
 * @evidence contracts/development/common.md#meaningful-documentation States original-ID exclusions, local-image premise, represented-number meaning and absence of curved/world certification.
 * @evidence contracts/development/implementation.md#efficient-algorithms Scans V point entries and E constraint segments with at most five neighbouring images, in O(V+E) exact-predicate calls for the admitted local family.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One source-endpoint lookup and triangle orientation serve both segment-side checks; no repeated source evaluation or geometry cache is introduced.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources An O(E) incident-ID set and fixed-size coordinate/image scratch are local; returns a boolean or string and retains no map, segment or callback.
 */
export function witnessAutoMovieSolidChartTriangle(
  vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
  edges: readonly IAutoMovieSolidMeshConstraints.ISegment[],
  edge: IAutoMovieSolidMeshConstraints.ISegment,
  probe: Readonly<AutoMovieVector2Tuple>,
  period?: number,
): boolean | string {
  const a: Readonly<AutoMovieVector2Tuple> | undefined = vertices.get(edge.a);
  const stored: Readonly<AutoMovieVector2Tuple> | undefined = vertices.get(
    edge.b,
  );
  if (a === undefined || stored === undefined)
    return "probe edge has an unavailable original endpoint";
  const b: Readonly<AutoMovieVector2Tuple> = [
    stored[0],
    stored[1] + edge.turn * (period ?? 0),
  ];
  if (![...a, ...b, ...probe].every(Number.isFinite))
    return "probe triangle is not representable";
  const side: number = orientAutoMovieSolidChart(a, b, probe);
  if (side === 0) return false;
  const first: Readonly<AutoMovieVector2Tuple> = side > 0 ? a : b;
  const second: Readonly<AutoMovieVector2Tuple> = side > 0 ? b : a;
  const minimum: number = Math.min(a[1], b[1], probe[1]);
  const maximum: number = Math.max(a[1], b[1], probe[1]);
  if (
    period !== undefined &&
    (!(Number.isFinite(period) && period > 0) ||
      maximum - minimum > period * (1 + 16 * Number.EPSILON))
  )
    return false;
  const middle: number =
    minimum === maximum ? minimum : minimum / 2 + maximum / 2;
  const incident: Set<number> = new Set(
    edges.flatMap(
      (boundary: IAutoMovieSolidMeshConstraints.ISegment): number[] => [
        boundary.a,
        boundary.b,
      ],
    ),
  );
  for (const entry of vertices) {
    const [id, point]: [number, Readonly<AutoMovieVector2Tuple>] = entry;
    if (!incident.has(id)) continue;
    const shifts: number[] | string = images(point[1], middle, period);
    if (typeof shifts === "string") return shifts;
    for (const lift of shifts) {
      if (
        (id === edge.a && lift === 0) ||
        (id === edge.b && lift === edge.turn)
      )
        continue;
      const lifted: Readonly<AutoMovieVector2Tuple> = [
        point[0],
        point[1] + lift * (period ?? 0),
      ];
      if (!lifted.every(Number.isFinite))
        return "probe vertex cover is not representable";
      if (
        orientAutoMovieSolidChart(first, second, lifted) >= 0 &&
        orientAutoMovieSolidChart(second, probe, lifted) >= 0 &&
        orientAutoMovieSolidChart(probe, first, lifted) >= 0
      )
        return false;
    }
  }
  for (const boundary of edges) {
    const c0: Readonly<AutoMovieVector2Tuple> | undefined = vertices.get(
      boundary.a,
    );
    const storedD: Readonly<AutoMovieVector2Tuple> | undefined = vertices.get(
      boundary.b,
    );
    if (c0 === undefined || storedD === undefined)
      return "probe constraint has an unavailable original endpoint";
    const d0: Readonly<AutoMovieVector2Tuple> = [
      storedD[0],
      storedD[1] + boundary.turn * (period ?? 0),
    ];
    const centre: number = c0[1] === d0[1] ? c0[1] : c0[1] / 2 + d0[1] / 2;
    const shifts: number[] | string = images(centre, middle, period);
    if (typeof shifts === "string") return shifts;
    for (const lift of shifts) {
      const c: Readonly<AutoMovieVector2Tuple> = [
        c0[0],
        c0[1] + lift * (period ?? 0),
      ];
      const d: Readonly<AutoMovieVector2Tuple> = [
        storedD[0],
        storedD[1] + (lift + boundary.turn) * (period ?? 0),
      ];
      if (![...c, ...d].every(Number.isFinite))
        return "probe constraint cover is not representable";
      if (crosses(a, probe, c, d) || crosses(b, probe, c, d) || on(c, d, probe))
        return false;
    }
  }
  return true;
}

/** A nearest local sheet plus two neighbours each way; extra images reserve image-count arithmetic only. */
function images(
  value: number,
  target: number,
  period: number | undefined,
): number[] | string {
  if (period === undefined) return [0];
  const nearest: number = Math.round((target - value) / period);
  return Number.isSafeInteger(nearest) &&
    Number.isSafeInteger(nearest - 2) &&
    Number.isSafeInteger(nearest + 2)
    ? [nearest - 2, nearest - 1, nearest, nearest + 1, nearest + 2]
    : "probe cover image is not a safe integer";
}

/** A proper crossing is determined by four exact represented-point signs. */
function crosses(
  a: Readonly<AutoMovieVector2Tuple>,
  b: Readonly<AutoMovieVector2Tuple>,
  c: Readonly<AutoMovieVector2Tuple>,
  d: Readonly<AutoMovieVector2Tuple>,
): boolean {
  return (
    orientAutoMovieSolidChart(a, b, c) * orientAutoMovieSolidChart(a, b, d) <
      0 &&
    orientAutoMovieSolidChart(c, d, a) * orientAutoMovieSolidChart(c, d, b) < 0
  );
}

/** A closed segment contact at the probe is not a valid interior witness. */
function on(
  a: Readonly<AutoMovieVector2Tuple>,
  b: Readonly<AutoMovieVector2Tuple>,
  point: Readonly<AutoMovieVector2Tuple>,
): boolean {
  return (
    point[0] >= Math.min(a[0], b[0]) &&
    point[0] <= Math.max(a[0], b[0]) &&
    point[1] >= Math.min(a[1], b[1]) &&
    point[1] <= Math.max(a[1], b[1]) &&
    orientAutoMovieSolidChart(a, b, point) === 0
  );
}
