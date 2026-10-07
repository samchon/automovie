import { HumanFaceConformingMaterialArithmetic as Arithmetic } from "./HumanFaceConformingMaterialArithmetic";
import type { IHumanFaceConformingMaterialCut as MaterialCut } from "./structures/IHumanFaceConformingMaterialCut";
import type { IHumanFaceConformingMaterialTriangle as MaterialTriangle } from "./structures/IHumanFaceConformingMaterialTriangle";
import type { IHumanFaceConformingPolygon } from "./structures/IHumanFaceConformingPolygon";

/**
 * Homogeneous material coordinates with a positive denominator; scale cancels from incidence predicates.
 *
 * @evidence contracts/common.md#principled-implementation A positive denominator preserves determinant signs when coordinates are divided by it.
 * @evidence contracts/common.md#clear-and-simple-design Three integers carry one rational point without separate rounded coordinates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The tuple records an exact point and does not alias nearby samples.
 * @evidence contracts/common.md#meaningful-documentation States homogeneous denominator ownership rather than treating integer UV as metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The MaterialPoint witness does not define an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The MaterialPoint witness adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The MaterialPoint witness does not choose a mesh population.
 * @evidence contracts/modeling.md#spatial-conventions Coordinates share the overlay's common dimensionless power-of-two unit.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The MaterialPoint witness does not construct a part join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this MaterialPoint witness carries no independent rendered form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The MaterialPoint witness supplies no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The MaterialPoint witness defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The MaterialPoint witness exposes no personal shaping input.
 */
type MaterialPoint = Parameters<typeof Arithmetic.orientation>[0];


/**
 * Exact twice-area as a signed rational, used before any output rounding.
 *
 * @evidence contracts/common.md#principled-implementation A rational numerator and denominator preserve addition and exact coverage comparison.
 * @evidence contracts/common.md#clear-and-simple-design Two integers carry only the signed area required by coverage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No floating tolerance replaces equality of the covered and original area.
 * @evidence contracts/common.md#meaningful-documentation States the signed twice-area convention used by the coverage owner.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The MaterialArea witness does not define an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The MaterialArea witness adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The MaterialArea witness does not choose a mesh population.
 * @evidence contracts/modeling.md#spatial-conventions Area is expressed in squared common material units.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The MaterialArea witness does not construct a part join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this MaterialArea witness carries no independent rendered form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The MaterialArea witness supplies no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The MaterialArea witness defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The MaterialArea witness exposes no personal shaping input.
 */
type MaterialArea = ReturnType<typeof Arithmetic.addArea>;


/**
 * Own one convex source/grid intersection, its retained boundary cuts and
 * its ear triangulation. The sheet owner retains whole-grid coverage and
 * remaps shared cuts before requesting ears, preserving construction order.
 *
 * @evidence contracts/common.md#principled-implementation Inclusive exact containment, original edge crossings and convex hull ordering define the common refinement of two source triangles.
 * @evidence contracts/common.md#clear-and-simple-design Polygon construction, ear emission and original edge identity share one geometric owner; whole-sheet assembly stays with its consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No epsilon weld, discarded cut, altered offset or anatomical-name exception determines intersection.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes per-polygon geometry from whole-grid coverage and final shell admission.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Refines existing source triangles rather than defining another anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Introduces no authoring channel.
 * @evidence contracts/modeling.md#emitted-geometry Ear population follows the actual convex overlay and keeps every original boundary cut.
 * @evidence contracts/modeling.md#spatial-conventions All predicates remain in the existing dimensionless common material frame.
 * @evidence contracts/modeling.md#shared-boundaries Original undirected edges and retained cuts give adjacent source/grid pieces identical boundary incidence.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue owner observes its final metric offset shells.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Converts material topology without anatomical dimensions.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no physiological interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal shaping input.
 */
export class HumanFaceConformingPolygon {
  /**
   * Construct the ordered polygon and exact area before shared-cut remapping.
   * Degenerate intersections retain zero area and are handled by the existing
   * sheet owner before it requests triangulation.
   *
   * @evidence contracts/common.md#principled-implementation Contained corners and segment crossings supply all convex-intersection vertices, whose retained hull has the same exact fan area.
   * @evidence contracts/common.md#clear-and-simple-design One method names enumeration, ordering and area in their original sequence.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact zero is preserved without a small-area cutoff or a missing-domain fallback.
   * @evidence contracts/common.md#meaningful-documentation States degenerate intersection behavior and the later triangulation boundary.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Constructs a temporary polygon, not an anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring channel.
   * @evidence contracts/modeling.md#emitted-geometry Polygon vertices arise only from original containment or segment intersection.
   * @evidence contracts/modeling.md#spatial-conventions Exact polygon points and area use the common material frame.
   * @evidence contracts/modeling.md#shared-boundaries Boundary ordering preserves every shared original edge cut.
   * @evidenceExclude contracts/modeling.md#rendered-observation The tissue owner observes the resulting shell.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Supplies no anatomical dimension.
   * @evidenceExclude contracts/anatomy.md#permitted-range Defines no physiological range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal shaping input.
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
   * Name an undirected edge from its two original incidence IDs.
   *
   * @evidence contracts/common.md#principled-implementation Sorting IDs makes opposite edge directions address the same original edge.
   * @evidence contracts/common.md#clear-and-simple-design One canonical string is used by cut identity and incidence cancellation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinates and anatomical labels never determine an edge key.
   * @evidence contracts/common.md#meaningful-documentation States that ordering normalizes identity rather than geometry.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The edge identity does not define an anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels The edge identity adds no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The edge identity does not choose a mesh population.
   * @evidence contracts/modeling.md#spatial-conventions Integers are incidence ordinals, not coordinates.
   * @evidence contracts/modeling.md#shared-boundaries Shared source or grid edges have the same key in both incident triangles.
   * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this edge identity carries no independent rendered form.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The edge identity supplies no anatomical measurement.
   * @evidenceExclude contracts/anatomy.md#permitted-range The edge identity defines no physiological range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The edge identity exposes no personal shaping input.
   */
  static edge(a: number, b: number): string {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  /**
   * Triangulate a positive convex polygon without removing its collinear boundary vertices.
   *
   * @evidence contracts/common.md#principled-implementation A strictly positive ear with no other remaining point inside or on it preserves a valid polygon triangulation.
   * @evidence contracts/common.md#clear-and-simple-design One shrinking index cycle records the actual emitted triangle incidence.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A blocked or degenerate ear is refused, never deleted by a geometric tolerance.
   * @evidence contracts/common.md#meaningful-documentation States inclusive containment and the nondegenerate final-triangle requirement.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The ear triangulation does not define an anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels The ear triangulation adds no authoring channel.
   * @evidence contracts/modeling.md#emitted-geometry Each removed valid ear emits one triangle; every retained boundary cut stays in the final incidence.
   * @evidence contracts/modeling.md#spatial-conventions All ear predicates use the same homogeneous material frame.
   * @evidence contracts/modeling.md#shared-boundaries No ear diagonal passes through another retained boundary vertex, preserving both sides' edge segmentation.
   * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this ear triangulation carries no independent rendered form.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The ear triangulation supplies no anatomical measurement.
   * @evidenceExclude contracts/anatomy.md#permitted-range The ear triangulation defines no physiological range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The ear triangulation exposes no personal shaping input.
   */
  static triangulate(polygon: MaterialCut[]): [number, number, number][] {
    const remaining = polygon.map((_, at) => at);
    const indices: [number, number, number][] = [];
    while (remaining.length > 3) {
      let removed = false;
      for (let at = 0; at < remaining.length; at++) {
        const corners: [number, number, number] = [remaining[(at + remaining.length - 1) % remaining.length], remaining[at], remaining[(at + 1) % remaining.length]];
        const points = corners.map((id) => polygon[id].point);
        if (Arithmetic.orientation(points[0], points[1], points[2]) <= 0n) continue;
        if (remaining.some((id) => !corners.includes(id) && points.every((point, side) =>
          Arithmetic.orientation(point, points[(side + 1) % 3], polygon[id].point) >= 0n))) continue;
        indices.push(corners);
        remaining.splice(at, 1);
        removed = true;
        break;
      }
      if (!removed) throw new Error("A conforming convex polygon needs a nondegenerate triangulation.");
    }
    if (Arithmetic.orientation(...remaining.map((id) => polygon[id].point) as [MaterialPoint, MaterialPoint, MaterialPoint]) <= 0n)
      throw new Error("The final conforming triangle needs positive material area.");
    indices.push(remaining as [number, number, number]);
    return indices;
  }
}

/**
 * Classify a point by the three exact oriented half-planes of a nondegenerate triangle.
 *
 * @evidence contracts/common.md#principled-implementation The triangle's orientation supplies the half-plane sign; inclusive zero preserves edge and vertex contact.
 * @evidence contracts/common.md#clear-and-simple-design One determinant owner supplies every side predicate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No approximate barycentric range or nearest-edge fallback admits a point.
 * @evidence contracts/common.md#meaningful-documentation States the required nondegenerate triangle and inclusive boundary semantics.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The half-plane predicate does not define an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The half-plane predicate adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The half-plane predicate does not choose a mesh population.
 * @evidence contracts/modeling.md#spatial-conventions Homogeneous determinant signs address one common dimensionless frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The half-plane predicate does not construct a part join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this half-plane predicate carries no independent rendered form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The half-plane predicate supplies no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The half-plane predicate defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The half-plane predicate exposes no personal shaping input.
 */
function inside(point: MaterialPoint, triangle: MaterialTriangle): boolean {
  const sign = Arithmetic.orientation(...triangle.points) > 0n ? 1n : -1n;
  return triangle.points.every((a, at) => sign * Arithmetic.orientation(a, triangle.points[(at + 1) % 3], point) >= 0n);
}

/**
 * Enumerate convex triangle-intersection vertices from contained corners and exact segment crossings.
 *
 * @evidence contracts/common.md#principled-implementation A convex intersection's extreme points are contained original corners or boundary crossings; positive-denominator segment parameters identify endpoints exactly.
 * @evidence contracts/common.md#clear-and-simple-design One enumeration preserves original endpoint keys and creates only edge-pair cut keys.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parallel edges rely on inclusive original endpoints; no perturbed line or epsilon intersection is introduced.
 * @evidence contracts/common.md#meaningful-documentation States the source-vertex aliases and the separation of provenance from homogeneous construction.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The triangle intersection does not define an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The triangle intersection adds no authoring channel.
 * @evidence contracts/modeling.md#emitted-geometry Only actual corner containment or segment intersection emits a polygon candidate.
 * @evidence contracts/modeling.md#spatial-conventions All original segment points have unit homogeneous denominator in the same material frame.
 * @evidence contracts/modeling.md#shared-boundaries Crossings use undirected original grid and source edge pairs, so adjacent cells share a cut key.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this triangle intersection carries no independent rendered form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The triangle intersection supplies no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The triangle intersection defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The triangle intersection exposes no personal shaping input.
 */
function intersect(
  grid: MaterialTriangle,
  host: MaterialTriangle,
  aliases: ReadonlyMap<number, string>,
  hostIds: readonly number[],
): MaterialCut[] {
  const cuts = new Map<string, MaterialCut>();
  const sourceKey = (id: number): string => aliases.get(id) ?? `h:${hostIds[id]}`;
  const insert = (key: string, point: MaterialPoint): void => {
    if (!cuts.has(key)) cuts.set(key, { key, point });
  };
  grid.points.forEach((point, at) => {
    if (inside(point, host)) insert(`g:${grid.corners[at]}`, point);
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
        t === 0n ? `g:${grid.corners[i]}` :
        t === denominator ? `g:${grid.corners[(i + 1) % 3]}` :
        u === 0n ? sourceKey(host.corners[j]) :
        u === denominator ? sourceKey(host.corners[(j + 1) % 3]) :
        `x:g:${HumanFaceConformingPolygon.edge(
          grid.corners[i], grid.corners[(i + 1) % 3],
        )}:h:${HumanFaceConformingPolygon.edge(
          hostIds[host.corners[j]], hostIds[host.corners[(j + 1) % 3]],
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
 *
 * @evidence contracts/common.md#principled-implementation Monotone chains remove strictly clockwise turns; keeping zero turns retains source/grid boundary subdivisions.
 * @evidence contracts/common.md#clear-and-simple-design Exact rational lexicographic ordering and one determinant owner build both chains.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Distinct provenances at exactly coincident points refuse instead of welding.
 * @evidence contracts/common.md#meaningful-documentation Documents collinear retention and the undeclared-coincidence witness.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The convex boundary ordering does not define an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The convex boundary ordering adds no authoring channel.
 * @evidence contracts/modeling.md#emitted-geometry Only candidates inside the convex intersection enter its ordered boundary.
 * @evidence contracts/modeling.md#spatial-conventions Ordering compares homogeneous coordinates by exact cross multiplication.
 * @evidence contracts/modeling.md#shared-boundaries Collinear cut identities remain present on polygon edges instead of creating downstream T-junctions.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this convex boundary ordering carries no independent rendered form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The convex boundary ordering supplies no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The convex boundary ordering defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The convex boundary ordering exposes no personal shaping input.
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
      throw new Error("Coincident material features need a declared source endpoint identity: " +
        JSON.stringify(sorted.slice(at - 1, at + 1).map((cut) => ({
          provenance: cut.key, homogeneous: cut.point.map(String),
        }))));
  const half = (points: MaterialCut[]): MaterialCut[] => {
    const chain: MaterialCut[] = [];
    for (const point of points) {
      while (chain.length > 1 && Arithmetic.orientation(chain[chain.length - 2].point, chain[chain.length - 1].point, point.point) < 0n) chain.pop();
      chain.push(point);
    }
    return chain.slice(0, -1);
  };
  return sorted.length < 3 ? sorted : [...half(sorted), ...half([...sorted].reverse())];
}

/**
 * Sum exact oriented fan areas before deciding source-disk coverage.
 *
 * @evidence contracts/common.md#principled-implementation A convex polygon's oriented fan sums its twice-area; homogeneous denominator products preserve exact rational units.
 * @evidence contracts/common.md#clear-and-simple-design The rational addition owner is shared with whole-grid coverage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No small-area cutoff omits a positive intersection polygon.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes an exact zero-dimensional intersection from a finite surface patch.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The polygon area reading does not define an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The polygon area reading adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The polygon area reading does not choose a mesh population.
 * @evidence contracts/modeling.md#spatial-conventions Areas use squared common dimensionless material units.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The polygon area reading does not construct a part join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this polygon area reading carries no independent rendered form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The polygon area reading supplies no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The polygon area reading defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The polygon area reading exposes no personal shaping input.
 */
function polygonArea(polygon: MaterialCut[]): MaterialArea {
  let area: MaterialArea = [0n, 1n];
  for (let at = 1; at + 1 < polygon.length; at++) {
    const a = polygon[0].point;
    const b = polygon[at].point;
    const c = polygon[at + 1].point;
    area = Arithmetic.addArea(area, [Arithmetic.orientation(a, b, c), a[2] * b[2] * c[2]]);
  }
  return area;
}
