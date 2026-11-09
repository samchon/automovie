import type { AutoMovieSolidMeshIncidence } from "./AutoMovieSolidMeshIncidence";
import type { AutoMovieSolidMeshPlan } from "./AutoMovieSolidMeshPlan";
import { orientAutoMovieSolidChart } from "./orientAutoMovieSolidChart";

/** A represented native station/phase point. */
type Point = readonly [number, number];

/** One boundary occurrence; the same original ID can occur on another sheet. */
interface Corner {
  /** Original shared vertex ID. */ id: number;
  /** Explicit phase-cover image. */ lift: number;
  /** Coordinate of that occurrence. */ point: Point;
  /** Original declared chart before its cover lift. */ original: Point;
}

/**
 * Ear-remove one admitted positive, zero-winding native boundary walk.
 *
 * The incidence owner supplies a weakly simple face boundary after its hole
 * bridges. Repeated bridge endpoints are the same corner only when both their
 * original ID and cover lift agree. All other vertices, including collinear
 * subdivisions on a proposed diagonal, block the ear. Cover-aware output may
 * span half a phase period; indexed output requires strictly less because it
 * discards the lifts. Exhausted searches return a named failure with
 * the remaining prepared occurrences and edge turns, without another source query.
 *
 * This is the same convex-ear principle used by the repository's trianglesOf,
 * with a different admission boundary: native mixed-unit charts use exact
 * represented-point signs, rather than the free-form region's absolute area
 * tolerance. No free-form geometry predicate or caller is changed.
 *
 * Every ear uses the shorter original occurrence arc, tip ID and lift as its
 * integer key. A periodic cut additionally stays within the maximum phase
 * travel of two adjacent primitives in the supplied original walk, including
 * its bridges. This sampling-locality limit prevents unconstrained long fans;
 * it neither changes a coordinate nor ranks near-equal coordinate groups.
 * Equal keys retain the first occurrence in the supplied linear walk, so
 * arbitrary weak-walk rotation is not promised. Identical occurrence order,
 * IDs/lifts and all admission decisions imply identical integer selections
 * at every length unit. Rounded geometric admission can still differ.
 *
 * Locality remains a bounded heuristic: long primitives/bridges can make it
 * loose, and a valid walk needing a longer diagonal can be refused. It is
 * neither a complete triangulator nor a continuous world chord/normal bound.
 * Optional occupied global endpoint pairs exclude new interior diagonals while
 * original boundary links retain their declared source identity. This does not
 * certify vertex manifoldness or repair inconsistent source correspondence.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Uses convex-ear removal ordered by original occurrence arc, tip ID and lift. Periodic sampling locality is bounded by two adjacent original-walk phase primitives, while exact positive orientation, the consumer's half-period cover rule and represented strict interiors remain required. A new diagonal cannot strand a boxed original occurrence in an unrepresentable triangle; distinct cover edges cannot alias one global mesh edge.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One boundary-to-triangles function follows incidence/bridge preparation; it constructs neither points nor source curves.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Changes no point or exact sign predicate and introduces no near-length tolerance. A distinct index is never ignored by positional equality and no tiny ear is removed without using its vertex. Locality remains a heuristic, not a completeness or world-normal certificate; unavailable represented cuts fail atomically.
 * @evidence contracts/development/common.md#meaningful-documentation States weakly simple positive input, cover identity, exact sign semantics, half-period search bound and failure behavior.
 * @evidence contracts/development/implementation.md#efficient-algorithms One O(N) pass prepares periodic sampling locality. Each removal ranks N diagonals by fixed integer comparisons and checks improving candidates against remaining points, with cubic worst-case work and O(N) storage; no coordinate sorting, all-pair population or shortest-edge/Delaunay/continuous surface-error guarantee is claimed.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One occurrence table serves every removal; original chart values and cover coordinates are prepared once and no surface jet is reevaluated.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The working ring and output have linear size, expire with the call except caller-owned fresh triangle triples, and retain no source map or callback.
 */
export function triangulateAutoMovieSolidBoundary(
  vertices: ReadonlyMap<number, Point>,
  walk: AutoMovieSolidMeshIncidence.IWalk,
  period?: number,
  indexed: boolean = false,
  occupied?: ReadonlySet<string>,
): AutoMovieSolidMeshPlan.ITriangle[] | string {
  if (
    walk.winding !== 0 ||
    walk.vertices.length < 3 ||
    walk.vertices.length !== walk.lifts.length
  )
    return "kept boundary needs a zero-winding polygon with at least three occurrences";
  if (period !== undefined && !(Number.isFinite(period) && period > 0))
    return "kept boundary needs a finite positive period";
  const corners: Corner[] = [];
  for (let k: number = 0; k < walk.vertices.length; k++) {
    const id: number = walk.vertices[k]!;
    const lift: number = walk.lifts[k]!;
    const stored: Point | undefined = vertices.get(id);
    if (
      stored === undefined ||
      !Number.isSafeInteger(lift) ||
      (period === undefined && lift !== 0)
    )
      return "kept boundary has an unavailable endpoint or invalid cover occurrence";
    const point: Point = [stored[0], stored[1] + lift * (period ?? 0)];
    if (!point.every(Number.isFinite))
      return "kept boundary cover coordinates are not representable";
    corners.push({ id, lift, point, original: stored });
  }
  const working: number[] = corners.map(
    (_: Corner, index: number): number => index,
  );
  const phaseLimit: number =
    period === undefined ? Infinity : locality(corners);
  if (period !== undefined && !Number.isFinite(phaseLimit))
    return "original walk phase sampling locality is not representable";
  const triangles: AutoMovieSolidMeshPlan.ITriangle[] = [];
  const links: Map<string, number> = new Map();
  let minU: number = Infinity;
  let maxU: number = -Infinity;
  let minV: number = Infinity;
  let maxV: number = -Infinity;
  for (let k: number = 0; k < corners.length; k++) {
    const corner: Corner = corners[k]!;
    minU = Math.min(minU, corner.point[0]);
    maxU = Math.max(maxU, corner.point[0]);
    minV = Math.min(minV, corner.point[1]);
    maxV = Math.max(maxV, corner.point[1]);
    const [key, turn]: [string, number] = identity(
      corner,
      corners[(k + 1) % corners.length]!,
    );
    const known: number | undefined = links.get(key);
    if (!Number.isSafeInteger(turn) || (known !== undefined && known !== turn))
      return "kept boundary projects distinct cover edges onto the same global pair";
    links.set(key, turn);
  }
  const width: number = maxU - minU || 1;
  const height: number = period ?? (maxV - minV || 1);
  if (!(Number.isFinite(width) && Number.isFinite(height)))
    return "ear chart span is not representable";
  while (working.length >= 3) {
    let at: number = -1;
    let best: readonly number[] | undefined;
    for (let index: number = 0; index < working.length; index++) {
      const b: Corner = corners[working[index]!]!;
      const gap: number = Math.abs(
        working[(index + working.length - 1) % working.length]! -
          working[(index + 1) % working.length]!,
      );
      const arc: number = Math.min(gap, corners.length - gap);
      const score: readonly number[] = [arc, b.id, b.lift];
      if (
        (best !== undefined && !precedes(score, best)) ||
        !ear(
          corners,
          working,
          index,
          period,
          links,
          indexed,
          phaseLimit,
          occupied,
        )
      )
        continue;
      at = index;
      best = score;
    }
    if (at < 0)
      return `kept boundary has no admitted native-chart ear; state ${JSON.stringify(
        {
          remaining: working.map(
            (
              index: number,
            ): {
              occurrence: number;
              id: number;
              lift: number;
              point: Point;
            } => ({
              occurrence: index,
              id: corners[index]!.id,
              lift: corners[index]!.lift,
              point: corners[index]!.point,
            }),
          ),
          links: [...links],
          period,
        },
      )}`;
    const a: Corner =
      corners[working[(at + working.length - 1) % working.length]!]!;
    const b: Corner = corners[working[at]!]!;
    const c: Corner = corners[working[(at + 1) % working.length]!]!;
    const lifts: [number, number, number] = [
      0,
      b.lift - a.lift,
      c.lift - a.lift,
    ];
    if (!lifts.every(Number.isSafeInteger))
      return "kept boundary triangle cover is not representable";
    triangles.push({ vertices: [a.id, b.id, c.id], lifts });
    for (const edge of [
      [a, b],
      [b, c],
      [c, a],
    ]) {
      const [key, turn]: [string, number] = identity(edge[0]!, edge[1]!);
      links.set(key, turn);
    }
    working.splice(at, 1);
    if (working.length < 3) break;
  }
  return triangles;
}

/** A positive ear retains every other original boundary occurrence on or inside its triangle. */
function ear(
  corners: readonly Corner[],
  working: readonly number[],
  at: number,
  period: number | undefined,
  links: ReadonlyMap<string, number>,
  indexed: boolean,
  phaseLimit: number,
  occupied: ReadonlySet<string> | undefined,
): boolean {
  const a: Corner =
    corners[working[(at + working.length - 1) % working.length]!]!;
  const b: Corner = corners[working[at]!]!;
  const c: Corner = corners[working[(at + 1) % working.length]!]!;
  if (
    a.id === b.id ||
    b.id === c.id ||
    c.id === a.id ||
    orientAutoMovieSolidChart(a.point, b.point, c.point) <= 0
  )
    return false;
  const span: number =
    Math.max(a.point[1], b.point[1], c.point[1]) -
    Math.min(a.point[1], b.point[1], c.point[1]);
  if (
    span > phaseLimit ||
    (period !== undefined &&
      (span > period / 2 || (indexed && span === period / 2)))
  )
    return false;
  const [key, turn]: [string, number] = identity(a, c);
  if (
    !Number.isSafeInteger(turn) ||
    (occupied?.has(key) === true && !links.has(key)) ||
    (links.has(key) && links.get(key) !== turn) ||
    !represented(a, b, c, period, indexed, phaseLimit)
  )
    return false;
  return working.every((index: number): boolean => {
    const candidate: Corner = corners[index]!;
    if (
      [a, b, c].some(
        (corner: Corner): boolean =>
          candidate.id === corner.id && candidate.lift === corner.lift,
      )
    )
      return true;
    const outside: boolean =
      orientAutoMovieSolidChart(a.point, b.point, candidate.point) < 0 ||
      orientAutoMovieSolidChart(b.point, c.point, candidate.point) < 0 ||
      orientAutoMovieSolidChart(c.point, a.point, candidate.point) < 0;
    return outside && separable(a, c, candidate, period, indexed, phaseLimit);
  });
}

/** Two adjacent supplied primitives define sampling locality without moving points or inventing a length tolerance. */
function locality(corners: readonly Corner[]): number {
  let limit: number = 0;
  for (let k: number = 0; k < corners.length; k++) {
    const a: number = corners[k]!.point[1];
    const b: number = corners[(k + 1) % corners.length]!.point[1];
    const c: number = corners[(k + 2) % corners.length]!.point[1];
    limit = Math.max(limit, Math.abs(b - a) + Math.abs(c - b));
  }
  return limit;
}

/** Equal keys keep the first supplied occurrence, preserving the weak-walk tie premise. */
function precedes(a: readonly number[], b: readonly number[]): boolean {
  for (let k: number = 0; k < a.length; k++) {
    if (a[k]! < b[k]!) return true;
    if (a[k]! > b[k]!) return false;
  }
  return false;
}

/** Do not cut a boxed original point off behind a diagonal with no represented strict triangle. */
function separable(
  a: Corner,
  b: Corner,
  point: Corner,
  period: number | undefined,
  indexed: boolean,
  phaseLimit: number,
): boolean {
  if (
    point.point[0] < Math.min(a.point[0], b.point[0]) ||
    point.point[0] > Math.max(a.point[0], b.point[0]) ||
    point.point[1] < Math.min(a.point[1], b.point[1]) ||
    point.point[1] > Math.max(a.point[1], b.point[1])
  )
    return true;
  const side: number = orientAutoMovieSolidChart(a.point, b.point, point.point);
  if (side === 0) return false;
  return side > 0
    ? represented(a, b, point, period, indexed, phaseLimit)
    : represented(b, a, point, period, indexed, phaseLimit);
}

/** A straight global mesh edge cannot represent two different periodic homotopies. */
function identity(a: Corner, b: Corner): [string, number] {
  return a.id === b.id
    ? [`${a.id}/${b.id}`, Math.abs(b.lift - a.lift)]
    : a.id < b.id
      ? [`${a.id}/${b.id}`, b.lift - a.lift]
      : [`${b.id}/${a.id}`, a.lift - b.lift];
}

/** Test the actual output cover, preserving every vertex rather than clipping an unrepresentable sliver. */
function represented(
  a: Corner,
  b: Corner,
  c: Corner,
  period: number | undefined,
  indexed: boolean,
  phaseLimit: number,
): boolean {
  const lifts: [number, number] = [b.lift - a.lift, c.lift - a.lift];
  if (!lifts.every(Number.isSafeInteger)) return false;
  const points: Point[] = [
    a.original,
    [b.original[0], b.original[1] + lifts[0] * (period ?? 0)],
    [c.original[0], c.original[1] + lifts[1] * (period ?? 0)],
  ];
  if (!points.every((point: Point): boolean => point.every(Number.isFinite)))
    return false;
  const span: number =
    Math.max(points[0]![1], points[1]![1], points[2]![1]) -
    Math.min(points[0]![1], points[1]![1], points[2]![1]);
  if (
    span > phaseLimit ||
    (period !== undefined &&
      (span > period / 2 || (indexed && span === period / 2)))
  )
    return false;
  const center: Point = [
    points[0]![0] / 3 + points[1]![0] / 3 + points[2]![0] / 3,
    points[0]![1] / 3 + points[1]![1] / 3 + points[2]![1] / 3,
  ];
  return (
    center.every(Number.isFinite) &&
    points.every(
      (point: Point, index: number): boolean =>
        orientAutoMovieSolidChart(point, points[(index + 1) % 3]!, center) > 0,
    )
  );
}
