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
 *
 * @evidence contracts/common.md#principled-implementation Exact homogeneous predicates construct convex triangle intersections and admit/triangulate complete simple material outlines while preserving collinear boundary cuts.
 * @evidence contracts/common.md#clear-and-simple-design Polygon order/area/ears are separated from whole-region coverage, shared-cut remapping and metric tissue seating owned by the sheet assembler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unregistered coincident coordinates and invalid/retracing/crossing outlines refuse rather than being welded, locally flipped or repaired with an epsilon.
 * @evidence contracts/common.md#meaningful-documentation The class/member prose states intersection, complete-outline admission, undirected identity and positive triangulation contracts.
 * @evidence contracts/performance.md#efficient-algorithms Triangle intersection is bounded-size; K-point outline admission is O(K squared) and the current exact ear scan has O(K cubed) worst-case work, with no independent outline-size cap.
 * @evidence contracts/performance.md#reuse-equivalent-work Exact arithmetic and original incidence-key helpers are reused across polygon phases; complete coverage and remapped cuts remain shared at the sheet owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Methods retain no class state; temporary cuts/chains/ear ordinals expire and returned polygons/triangles are caller-owned.
 */
export class HumanFaceConformingPolygon {
  /**
   * Construct the ordered polygon and exact area before shared-cut remapping.
   * Degenerate intersections retain zero area and are handled by the existing
   * sheet owner before it requests triangulation.
   *
   * @evidence contracts/common.md#principled-implementation Original grid/host triangle points use the admitted common integer unit with unit denominators. Contained corners and exact segment intersections enumerate their convex overlap, retaining declared endpoint aliases and edge-pair identities.
   * @evidence contracts/common.md#clear-and-simple-design Intersection enumeration, exact hull order and rational fan area form one result before sheet-wide shared-cut remapping.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Coincident distinct feature keys refuse rather than coordinate welding; degenerate overlaps keep zero area for the existing sheet owner to skip.
   * @evidence contracts/common.md#meaningful-documentation The member states original polygon/area construction timing and degenerate-intersection handling.
   * @evidence contracts/performance.md#efficient-algorithms Two triangles contribute six corner tests and nine edge pairs, then a bounded cut hull/area calculation; BigInt bit widths drive each exact predicate.
   * @evidence contracts/performance.md#reuse-equivalent-work One local key map merges repeated occurrences of the same declared feature, and the shared arithmetic/edge naming rules serve every pair.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returned cuts/area are caller-owned; enumeration and hull temporaries expire without retaining host/chart arrays.
   */
  static intersect(
    grid: MaterialTriangle,
    host: MaterialTriangle,
    aliases: ReadonlyMap<number, string>,
    hostIds: readonly number[],
  ): IHumanFaceConformingPolygon {
    const cuts: MaterialCut[] = hull(intersect(grid, host, aliases, hostIds));
    return {
      cuts,
      area: cuts.length < 3 ? [0n, 1n] : polygonArea(cuts),
    };
  }

  /**
   * Validate the complete ordered outline before triangulating its concave interior.
   * Only the whole cycle's winding is normalized; individual faces are not repaired.
   *
   * @evidence contracts/common.md#principled-implementation Distinct ordered keys, non-retracing edges, noncrossing nonadjacent segments and nonzero exact signed area admit one complete simple outline.
   * @evidence contracts/common.md#clear-and-simple-design Complete-cycle admission precedes one whole-cycle winding reversal; individual triangle orientation is never independently repaired.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Repeated identities, contacts/retracing/crossings or zero area refuse rather than deleting troublesome cuts or introducing coordinate tolerances.
   * @evidence contracts/common.md#meaningful-documentation The member states whole-outline validation, concave interior intent and only whole-cycle winding normalization.
   * @evidence contracts/performance.md#efficient-algorithms K outline vertices require O(K squared) exact nonadjacent-edge tests and O(K) area accumulation; the full scan is the current complete simplicity check.
   * @evidence contracts/performance.md#reuse-equivalent-work The admitted ordered cuts and computed area feed later ear triangulation; source identity and exact arithmetic are shared rather than rederived from coordinates.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned owned cut array borrows its immutable cut records; temporary edge/area work expires and no outline cache or resource is retained.
   */
  static outline(cuts: MaterialCut[]): IHumanFaceConformingPolygon {
    if (
      cuts.length < 3 ||
      new Set(cuts.map((cut: MaterialCut): string => cut.key)).size !==
        cuts.length
    )
      throw new Error(
        "A material outline needs distinct ordered boundary identities.",
      );
    const between: (
      a: MaterialPoint,
      b: MaterialPoint,
      p: MaterialPoint,
    ) => boolean = (
      a: MaterialPoint,
      b: MaterialPoint,
      p: MaterialPoint,
    ): boolean =>
      Arithmetic.orientation(a, b, p) === 0n &&
      [0, 1].every((axis: number): boolean => {
        const fromA: bigint = p[axis] * a[2] - a[axis] * p[2];
        const fromB: bigint = p[axis] * b[2] - b[axis] * p[2];
        return fromA === 0n || fromB === 0n || fromA < 0n !== fromB < 0n;
      });
    for (let i: number = 0; i < cuts.length; i++) {
      const a: [bigint, bigint, bigint] = cuts[i].point;
      const b: [bigint, bigint, bigint] = cuts[(i + 1) % cuts.length].point;
      const c: [bigint, bigint, bigint] = cuts[(i + 2) % cuts.length].point;
      if (between(a, b, c) || between(b, c, a))
        throw new Error("A material outline cannot retrace a boundary edge.");
      for (let j: number = i + 1; j < cuts.length; j++) {
        if (j === i + 1 || (i === 0 && j === cuts.length - 1)) continue;
        const c: [bigint, bigint, bigint] = cuts[j].point;
        const d: [bigint, bigint, bigint] = cuts[(j + 1) % cuts.length].point;
        const abC: bigint = Arithmetic.orientation(a, b, c);
        const abD: bigint = Arithmetic.orientation(a, b, d);
        const cdA: bigint = Arithmetic.orientation(c, d, a);
        const cdB: bigint = Arithmetic.orientation(c, d, b);
        if (
          between(a, b, c) ||
          between(a, b, d) ||
          between(c, d, a) ||
          between(c, d, b) ||
          (abC !== 0n &&
            abD !== 0n &&
            cdA !== 0n &&
            cdB !== 0n &&
            abC < 0n !== abD < 0n &&
            cdA < 0n !== cdB < 0n)
        )
          throw new Error(
            "A material outline needs a simple noncrossing boundary.",
          );
      }
    }
    const area: [bigint, bigint] = polygonArea(cuts);
    if (area[0] === 0n)
      throw new Error("A material outline needs nonzero area.");
    return area[0] > 0n
      ? { cuts: [...cuts], area }
      : { cuts: [...cuts].reverse(), area: [-area[0], area[1]] };
  }

  /**
   * Name an undirected edge from its two original incidence IDs.
   *
   * @evidence contracts/common.md#principled-implementation Sorting two original incidence ordinals gives one orientation-independent edge identity while preserving the actual source endpoints.
   * @evidence contracts/common.md#clear-and-simple-design A small canonical key helper is shared by material intersection and refinement/sheet incidence owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The key names source topology rather than coordinate coincidence or a guessed nearest endpoint.
   * @evidence contracts/common.md#meaningful-documentation The member states undirected naming and original incidence authority.
   * @evidence contracts/performance.md#efficient-algorithms Two scalar comparisons and one short key allocation use constant work per edge.
   * @evidence contracts/performance.md#reuse-equivalent-work All consumers share the same endpoint-order convention; the helper retains no mapping across changed incidence.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned key survives and no source vertex/edge population or resource is retained.
   */
  static edge(a: number, b: number): string {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  /**
   * Triangulate a positive simple polygon without removing its collinear boundary vertices.
   *
   * @evidence contracts/common.md#principled-implementation Exact positive-ear orientation and inclusive containment tests triangulate an admitted positive simple polygon while retaining every collinear boundary identity.
   * @evidence contracts/common.md#clear-and-simple-design One remaining-ordinal list and output triangle list own ear clipping; complete-outline admission and later shared-cut remapping remain separate phases.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing positive ear or nonpositive final triangle refuses rather than dropping boundary vertices, flipping individual faces or returning an incomplete mesh.
   * @evidence contracts/common.md#meaningful-documentation The member states the positive/simple precondition and preservation of collinear boundary vertices.
   * @evidence contracts/performance.md#efficient-algorithms For K cuts, scanning candidate ears and all remaining points across removals has O(K cubed) worst-case work; pair-intersection polygons are small, while whole-outline calls have no explicit size cap.
   * @evidence contracts/performance.md#reuse-equivalent-work Original cut points and shared exact orientation are reused throughout ear decisions; emitted triangles retain original polygon ordinals.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only K-2 output triples escape on success; the remaining list and per-ear point/corner arrays expire on success or refusal without retained state.
   */
  static triangulate(polygon: MaterialCut[]): [number, number, number][] {
    const remaining: number[] = polygon.map(
      (_: MaterialCut, at: number): number => at,
    );
    const indices: [number, number, number][] = [];
    while (remaining.length > 3) {
      let removed: boolean = false;
      for (let at: number = 0; at < remaining.length; at++) {
        const corners: [number, number, number] = [
          remaining[(at + remaining.length - 1) % remaining.length],
          remaining[at],
          remaining[(at + 1) % remaining.length],
        ];
        const points: [bigint, bigint, bigint][] = corners.map(
          (id: number): [bigint, bigint, bigint] => polygon[id].point,
        );
        if (Arithmetic.orientation(points[0], points[1], points[2]) <= 0n)
          continue;
        if (
          remaining.some(
            (id: number): boolean =>
              !corners.includes(id) &&
              points.every(
                (point: [bigint, bigint, bigint], side: number): boolean =>
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
        ...(remaining.map(
          (id: number): [bigint, bigint, bigint] => polygon[id].point,
        ) as [MaterialPoint, MaterialPoint, MaterialPoint]),
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
  const sign: 1n | -1n =
    Arithmetic.orientation(...triangle.points) > 0n ? 1n : -1n;
  return triangle.points.every(
    (a: [bigint, bigint, bigint], at: number): boolean =>
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
  const cuts: Map<string, MaterialCut> = new Map<string, MaterialCut>();
  const sourceKey: (id: number) => string = (id: number): string =>
    aliases.get(id) ?? `h:${hostIds[id]}`;
  const insert: (key: string, point: MaterialPoint) => void = (
    key: string,
    point: MaterialPoint,
  ): void => {
    if (!cuts.has(key)) cuts.set(key, { key, point });
  };
  grid.points.forEach((point: [bigint, bigint, bigint], at: number): void => {
    if (inside(point, host)) insert(grid.keys[at], point);
  });
  host.points.forEach((point: [bigint, bigint, bigint], at: number): void => {
    if (inside(point, grid)) insert(sourceKey(host.corners[at]), point);
  });
  for (let i: number = 0; i < 3; i++) {
    for (let j: number = 0; j < 3; j++) {
      const a: [bigint, bigint, bigint] = grid.points[i];
      const b: [bigint, bigint, bigint] = grid.points[(i + 1) % 3];
      const c: [bigint, bigint, bigint] = host.points[j];
      const d: [bigint, bigint, bigint] = host.points[(j + 1) % 3];
      const rx: bigint = b[0] - a[0];
      const ry: bigint = b[1] - a[1];
      const sx: bigint = d[0] - c[0];
      const sy: bigint = d[1] - c[1];
      let denominator: bigint = rx * sy - ry * sx;
      // Collinear endpoints already enter through inclusive containment.
      if (denominator === 0n) continue;
      let t: bigint = (c[0] - a[0]) * sy - (c[1] - a[1]) * sx;
      let u: bigint = (c[0] - a[0]) * ry - (c[1] - a[1]) * rx;
      if (denominator < 0n) {
        denominator = -denominator;
        t = -t;
        u = -u;
      }
      if (t < 0n || t > denominator || u < 0n || u > denominator) continue;
      const key: string =
        t === 0n
          ? grid.keys[i]
          : t === denominator
            ? grid.keys[(i + 1) % 3]
            : u === 0n
              ? sourceKey(host.corners[j])
              : u === denominator
                ? sourceKey(host.corners[(j + 1) % 3])
                : `x:m:${JSON.stringify(
                    [grid.keys[i], grid.keys[(i + 1) % 3]].sort(
                      (a: string, b: string): 0 | 1 | -1 =>
                        a < b ? -1 : a > b ? 1 : 0,
                    ),
                  )}:h:${HumanFaceConformingPolygon.edge(
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
  const compare: (a: MaterialCut, b: MaterialCut) => number = (
    a: MaterialCut,
    b: MaterialCut,
  ): number => {
    const x: bigint = a.point[0] * b.point[2] - b.point[0] * a.point[2];
    const y: bigint = a.point[1] * b.point[2] - b.point[1] * a.point[2];
    return x < 0n ? -1 : x > 0n ? 1 : y < 0n ? -1 : y > 0n ? 1 : 0;
  };
  const sorted: MaterialCut[] = [...cuts].sort(compare);
  for (let at: number = 1; at < sorted.length; at++)
    if (compare(sorted[at - 1], sorted[at]) === 0)
      throw new Error(
        "Coincident material features need a declared source endpoint identity: " +
          JSON.stringify(
            sorted
              .slice(at - 1, at + 1)
              .map(
                (
                  cut: MaterialCut,
                ): { provenance: string; homogeneous: string[] } => ({
                  provenance: cut.key,
                  homogeneous: cut.point.map(String),
                }),
              ),
          ),
      );
  const half: (points: MaterialCut[]) => MaterialCut[] = (
    points: MaterialCut[],
  ): MaterialCut[] => {
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
  for (let at: number = 1; at + 1 < polygon.length; at++) {
    const a: [bigint, bigint, bigint] = polygon[0].point;
    const b: [bigint, bigint, bigint] = polygon[at].point;
    const c: [bigint, bigint, bigint] = polygon[at + 1].point;
    area = Arithmetic.addArea(area, [
      Arithmetic.orientation(a, b, c),
      a[2] * b[2] * c[2],
    ]);
  }
  return area;
}
