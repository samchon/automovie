import { HumanFaceConformingMaterialArithmetic as Arithmetic } from "./HumanFaceConformingMaterialArithmetic";
import type { IHumanFaceConformingMaterialCut as MaterialCut } from "./structures/IHumanFaceConformingMaterialCut";
import type { IHumanFaceConformingMaterialTriangle as MaterialTriangle } from "./structures/IHumanFaceConformingMaterialTriangle";
import type { IHumanFaceConformingPolygon } from "./structures/IHumanFaceConformingPolygon";

/**
 * Homogeneous material coordinates with a positive denominator; scale cancels from incidence predicates.
 */
type MaterialPoint = Parameters<typeof Arithmetic.orientation>[0];

/**
 * Exact twice-area as a signed rational, used before any output rounding.
 */
type MaterialArea = ReturnType<typeof Arithmetic.addArea>;

/**
 * Own an ordered simple material outline and each convex source/domain
 * intersection, retaining boundary cuts through exact ear triangulation.
 * The sheet owner retains whole-region coverage and shared cut assembly.
 */
export class HumanFaceConformingPolygon {
  /**
   * Construct the ordered polygon and exact area before shared-cut remapping.
   * Degenerate intersections retain zero area and are handled by the existing
   * sheet owner before it requests triangulation.
   */
  static intersect(
    grid: MaterialTriangle,
    host: MaterialTriangle,
    aliases: ReadonlyMap<number, string>,
    hostIds: readonly number[],
  ): IHumanFaceConformingPolygon {
    const cuts = hull(intersect(grid, host, aliases, hostIds));
    return {
      cuts,
      area: cuts.length < 3 ? [0n, 1n] : polygonArea(cuts),
    };
  }

  /**
   * Validate the complete ordered outline before triangulating its concave interior.
   * Only the whole cycle's winding is normalized; individual faces are not repaired.
   */
  static outline(cuts: MaterialCut[]): IHumanFaceConformingPolygon {
    if (
      cuts.length < 3 ||
      new Set(cuts.map((cut) => cut.key)).size !== cuts.length
    )
      throw new Error(
        "A material outline needs distinct ordered boundary identities.",
      );
    const between = (
      a: MaterialPoint,
      b: MaterialPoint,
      p: MaterialPoint,
    ): boolean =>
      Arithmetic.orientation(a, b, p) === 0n &&
      [0, 1].every((axis) => {
        const fromA = p[axis] * a[2] - a[axis] * p[2];
        const fromB = p[axis] * b[2] - b[axis] * p[2];
        return (
          fromA === 0n ||
          fromB === 0n ||
          (fromA < 0n) !== (fromB < 0n)
        );
      });
    for (let i = 0; i < cuts.length; i++) {
      const a = cuts[i].point;
      const b = cuts[(i + 1) % cuts.length].point;
      const c = cuts[(i + 2) % cuts.length].point;
      if (between(a, b, c) || between(b, c, a))
        throw new Error("A material outline cannot retrace a boundary edge.");
      for (let j = i + 1; j < cuts.length; j++) {
        if (j === i + 1 || (i === 0 && j === cuts.length - 1)) continue;
        const c = cuts[j].point;
        const d = cuts[(j + 1) % cuts.length].point;
        const abC = Arithmetic.orientation(a, b, c);
        const abD = Arithmetic.orientation(a, b, d);
        const cdA = Arithmetic.orientation(c, d, a);
        const cdB = Arithmetic.orientation(c, d, b);
        if (
          between(a, b, c) || between(a, b, d) ||
          between(c, d, a) || between(c, d, b) ||
          (abC !== 0n && abD !== 0n && cdA !== 0n && cdB !== 0n &&
            (abC < 0n) !== (abD < 0n) && (cdA < 0n) !== (cdB < 0n))
        )
          throw new Error(
            "A material outline needs a simple noncrossing boundary.",
          );
      }
    }
    const area = polygonArea(cuts);
    if (area[0] === 0n)
      throw new Error("A material outline needs nonzero area.");
    return area[0] > 0n
      ? { cuts: [...cuts], area }
      : { cuts: [...cuts].reverse(), area: [-area[0], area[1]] };
  }

  /**
   * Name an undirected edge from its two original incidence IDs.
   */
  static edge(a: number, b: number): string {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  /**
   * Triangulate a positive simple polygon without removing its collinear boundary vertices.
   */
  static triangulate(polygon: MaterialCut[]): [number, number, number][] {
    const remaining = polygon.map((_, at) => at);
    const indices: [number, number, number][] = [];
    while (remaining.length > 3) {
      let removed = false;
      for (let at = 0; at < remaining.length; at++) {
        const corners: [number, number, number] = [
          remaining[(at + remaining.length - 1) % remaining.length],
          remaining[at],
          remaining[(at + 1) % remaining.length],
        ];
        const points = corners.map((id) => polygon[id].point);
        if (Arithmetic.orientation(points[0], points[1], points[2]) <= 0n)
          continue;
        if (
          remaining.some(
            (id) =>
              !corners.includes(id) &&
              points.every(
                (point, side) =>
                  Arithmetic.orientation(
                    point,
                    points[(side + 1) % 3],
                    polygon[id].point,
                  ) >= 0n,
              ),
          )
        )
          continue;
        indices.push(corners);
        remaining.splice(at, 1);
        removed = true;
        break;
      }
      if (!removed)
        throw new Error(
          "A conforming simple polygon needs a nondegenerate triangulation.",
        );
    }
    if (
      Arithmetic.orientation(
        ...(remaining.map((id) => polygon[id].point) as [
          MaterialPoint,
          MaterialPoint,
          MaterialPoint,
        ]),
      ) <= 0n
    )
      throw new Error(
        "The final conforming triangle needs positive material area.",
      );
    indices.push(remaining as [number, number, number]);
    return indices;
  }
}

/**
 * Classify a point by the three exact oriented half-planes of a nondegenerate triangle.
 */
function inside(point: MaterialPoint, triangle: MaterialTriangle): boolean {
  const sign = Arithmetic.orientation(...triangle.points) > 0n ? 1n : -1n;
  return triangle.points.every(
    (a, at) =>
      sign * Arithmetic.orientation(a, triangle.points[(at + 1) % 3], point) >=
      0n,
  );
}

/**
 * Enumerate convex triangle-intersection vertices from contained corners and exact segment crossings.
 */
function intersect(
  grid: MaterialTriangle,
  host: MaterialTriangle,
  aliases: ReadonlyMap<number, string>,
  hostIds: readonly number[],
): MaterialCut[] {
  const cuts = new Map<string, MaterialCut>();
  const sourceKey = (id: number): string =>
    aliases.get(id) ?? `h:${hostIds[id]}`;
  const insert = (key: string, point: MaterialPoint): void => {
    if (!cuts.has(key)) cuts.set(key, { key, point });
  };
  grid.points.forEach((point, at) => {
    if (inside(point, host)) insert(grid.keys[at], point);
  });
  host.points.forEach((point, at) => {
    if (inside(point, grid)) insert(sourceKey(host.corners[at]), point);
  });
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const a = grid.points[i];
      const b = grid.points[(i + 1) % 3];
      const c = host.points[j];
      const d = host.points[(j + 1) % 3];
      const rx = b[0] - a[0];
      const ry = b[1] - a[1];
      const sx = d[0] - c[0];
      const sy = d[1] - c[1];
      let denominator = rx * sy - ry * sx;
      // Collinear endpoints already enter through inclusive containment.
      if (denominator === 0n) continue;
      let t = (c[0] - a[0]) * sy - (c[1] - a[1]) * sx;
      let u = (c[0] - a[0]) * ry - (c[1] - a[1]) * rx;
      if (denominator < 0n) {
        denominator = -denominator;
        t = -t;
        u = -u;
      }
      if (t < 0n || t > denominator || u < 0n || u > denominator) continue;
      const key =
        t === 0n
          ? grid.keys[i]
          : t === denominator
            ? grid.keys[(i + 1) % 3]
            : u === 0n
              ? sourceKey(host.corners[j])
              : u === denominator
                ? sourceKey(host.corners[(j + 1) % 3])
                : `x:m:${JSON.stringify([
                    grid.keys[i], grid.keys[(i + 1) % 3],
                  ].sort((a, b) => a < b ? -1 : a > b ? 1 : 0))}:h:${HumanFaceConformingPolygon.edge(
                    hostIds[host.corners[j]],
                    hostIds[host.corners[(j + 1) % 3]],
                  )}`;
      insert(key, [
        a[0] * denominator + rx * t,
        a[1] * denominator + ry * t,
        denominator,
      ]);
    }
  }
  return [...cuts.values()];
}

/**
 * Order convex intersection points while retaining every collinear boundary cut.
 */
function hull(cuts: MaterialCut[]): MaterialCut[] {
  const compare = (a: MaterialCut, b: MaterialCut): number => {
    const x = a.point[0] * b.point[2] - b.point[0] * a.point[2];
    const y = a.point[1] * b.point[2] - b.point[1] * a.point[2];
    return x < 0n ? -1 : x > 0n ? 1 : y < 0n ? -1 : y > 0n ? 1 : 0;
  };
  const sorted = [...cuts].sort(compare);
  for (let at = 1; at < sorted.length; at++)
    if (compare(sorted[at - 1], sorted[at]) === 0)
      throw new Error(
        "Coincident material features need a declared source endpoint identity: " +
          JSON.stringify(
            sorted.slice(at - 1, at + 1).map((cut) => ({
              provenance: cut.key,
              homogeneous: cut.point.map(String),
            })),
          ),
      );
  const half = (points: MaterialCut[]): MaterialCut[] => {
    const chain: MaterialCut[] = [];
    for (const point of points) {
      while (
        chain.length > 1 &&
        Arithmetic.orientation(
          chain[chain.length - 2].point,
          chain[chain.length - 1].point,
          point.point,
        ) < 0n
      )
        chain.pop();
      chain.push(point);
    }
    return chain.slice(0, -1);
  };
  return sorted.length < 3
    ? sorted
    : [...half(sorted), ...half([...sorted].reverse())];
}

/**
 * Sum exact oriented fan areas before deciding source-disk coverage.
 */
function polygonArea(polygon: MaterialCut[]): MaterialArea {
  let area: MaterialArea = [0n, 1n];
  for (let at = 1; at + 1 < polygon.length; at++) {
    const a = polygon[0].point;
    const b = polygon[at].point;
    const c = polygon[at + 1].point;
    area = Arithmetic.addArea(area, [
      Arithmetic.orientation(a, b, c),
      a[2] * b[2] * c[2],
    ]);
  }
  return area;
}
