import { HumanFaceConformingPolygon as Polygon } from "./HumanFaceConformingPolygon";
import type { IHumanFaceConformingMaterialTriangle as MaterialTriangle } from "./structures/IHumanFaceConformingMaterialTriangle";
import { HumanFaceConformingMaterialArithmetic as Arithmetic } from "./HumanFaceConformingMaterialArithmetic";
import type { IHumanFaceConformingSheet } from "./structures/IHumanFaceConformingSheet";
import type { IHumanFaceConformingSheetInput } from "./structures/IHumanFaceConformingSheetInput";
import type { IHumanFaceConformingSheetVertex } from "./structures/IHumanFaceConformingSheetVertex";

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
 * Overlay the original material grid with its actual source-host triangulation.
 * Each convex intersection polygon keeps all boundary cuts and is triangulated
 * without introducing a chord across a host edge. New vertices read that host
 * triangle barycentrically; existing grid vertices keep their supplied seats.
 *
 * Binary64 UVs are dyadic rationals. A common power-of-two unit makes original
 * coordinates integers; homogeneous intersections and BigInt determinants then
 * preserve predicate signs and shared cuts exactly. Coordinates round only at
 * the returned reader boundary. This follows the exact-predicate principle
 * described by Shewchuk, https://www.cs.cmu.edu/~quake/robust.html; it is not an
 * implementation of his floating-point expansion algorithms.
 *
 * Intersection vertices are original grid vertices, original source vertices,
 * or crossings of named original edges. Endpoint aliases come only from exact
 * source vertex seats. An unregistered coincidence refuses rather than welding.
 * Source embedding and actual incidence are prerequisites owned by the chart
 * reader; metric offsets, normals and physiological admission stay downstream.
 *
 * @evidence contracts/common.md#principled-implementation Convex triangle intersection followed by exact-predicate ear triangulation covers each original grid triangle with pieces of actual source triangles; exact area accounting refuses missing disk coverage.
 * @evidence contracts/common.md#clear-and-simple-design One material overlay returns attachment, emitted incidence and the single ordered boundary to the existing tissue consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shared identities derive from original incidence and exact endpoint seats, with no coordinate tolerance, nearest-point fallback or part-specific exception.
 * @evidence contracts/common.md#meaningful-documentation States exact arithmetic, chart-reader preconditions, downstream metric ownership and refusal effects.
 * @evidence contracts/modeling.md#emitted-geometry Population follows the common refinement of actual grid and host edges; a smaller sampled sheet would again cross host edges by unsupported chords.
 * @evidence contracts/modeling.md#spatial-conventions The common integer UV frame is internal and dimensionless; returned UVs and weights preserve the original material frame, and no head-metre quantity is changed.
 * @evidence contracts/modeling.md#shared-boundaries Every shared source/grid cut has one incidence identity, and both offset sheets consume the same final boundary edges.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Refines the representation of an existing tissue rather than defining another part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Introduces no authoring channel.
 * @evidenceExclude contracts/modeling.md#rendered-observation The existing tissue builder owns observation of its final offset shell.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Converts material topology without supplying anatomical dimensions.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing tissue admission owns physiological and clearance conditions.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Preserves the existing numerical authoring contract.
 */
export function createHumanFaceConformingSheet(input: IHumanFaceConformingSheetInput): IHumanFaceConformingSheet {
  const { chart, samples, topology } = input;
  const gridIds = [...new Set(topology.cells.flat())];
  const gridUV = gridIds.map((id) => {
    const point = samples[id]?.materialPoint;
    if (point === undefined || !point.every(Number.isFinite))
      throw new Error("A conforming sheet needs every original material sample.");
    return point;
  });
  const allUV = [...chart.coordinates, ...gridUV.flat()];
  const binary = allUV.map(Arithmetic.dyadic);
  const exponent = Math.min(...binary.filter(([n]) => n !== 0n).map(([, e]) => e));
  if (!Number.isFinite(exponent)) throw new Error("A conforming chart needs nonzero material extent.");
  const integers = binary.map(([n, e]) => n << BigInt(e - exponent));
  const hostPoints = chart.vertices.map((_, at): MaterialPoint => [integers[2 * at], integers[2 * at + 1], 1n]);
  const gridPoints = new Map(gridIds.map((id, at): [number, MaterialPoint] =>
    [id, [integers[chart.coordinates.length + 2 * at], integers[chart.coordinates.length + 2 * at + 1], 1n]]));
  const hostOrdinal = new Map(chart.sourceTriangles.map((id, at) => [id, at]));
  const aliases = new Map<number, string>();
  for (const id of gridIds) {
    const seat = samples[id].seat;
    const at = hostOrdinal.get(seat.triangle);
    if (at === undefined) throw new Error("A conforming sample needs its resident source triangle.");
    const corner = seat.weights.findIndex((weight) => weight === 1);
    if (corner < 0 || seat.weights.some((weight, index) => index !== corner && weight !== 0)) continue;
    const host = chart.indices[3 * at + corner];
    const prior = aliases.get(host);
    if (prior !== undefined && prior !== `g:${id}`)
      throw new Error("Distinct canonical grid vertices cannot name one source endpoint.");
    aliases.set(host, `g:${id}`);
  }
  const source = chart.sourceTriangles.map((_, at) => triangle(
    chart.indices.slice(3 * at, 3 * at + 3) as [number, number, number],
    (id) => hostPoints[id], (id) => chart.coordinates.slice(2 * id, 2 * id + 2),
  ));
  const result: IHumanFaceConformingSheet = { vertices: [], indices: [], sourceTriangles: [], boundaryEdges: [] };
  const resident = new Map<string, number>();
  for (const [a, b, c, d] of topology.cells)
    for (const corners of [[a, b, c], [a, c, d]] as [number, number, number][]) {
      if (new Set(corners).size !== 3) continue;
      const grid = triangle(corners, (id) => gridPoints.get(id)!, (id) => samples[id].materialPoint!);
      const direction = Arithmetic.orientation(...grid.points);
      if (direction === 0n) throw new Error("A noncollapsed material grid triangle needs nonzero area.");
      let covered: MaterialArea = [0n, 1n];
      for (let at = 0; at < source.length; at++) {
        const host = source[at];
        if (!overlap(grid.bounds, host.bounds)) continue;
        const polygon = Polygon.intersect(grid, host, aliases, chart.vertices);
        if (polygon.cuts.length < 3) continue;
        const area = polygon.area;
        if (area[0] === 0n) continue;
        covered = Arithmetic.addArea(covered, area);
        const mapped = polygon.cuts.map((cut) => {
          const prior = resident.get(cut.key);
          if (prior !== undefined) return prior;
          const index = result.vertices.length;
          const original = cut.key.startsWith("g:") ? samples[Number(cut.key.slice(2))] : undefined;
          const vertex: IHumanFaceConformingSheetVertex = {
            provenance: cut.key,
            materialPoint: [Arithmetic.numberAt(cut.point[0], cut.point[2], exponent), Arithmetic.numberAt(cut.point[1], cut.point[2], exponent)],
            seat: original === undefined ? { triangle: chart.sourceTriangles[at], weights: Arithmetic.barycentric(host.points, cut.point) } :
              { triangle: original.seat.triangle, weights: [...original.seat.weights] },
            gridCorners: [...corners], gridWeights: Arithmetic.barycentric(grid.points, cut.point),
          };
          resident.set(cut.key, index);
          result.vertices.push(vertex);
          return index;
        });
        for (const piece of Polygon.triangulate(polygon.cuts)) {
          const emitted = piece.map((corner) => mapped[corner]);
          if (direction < 0n) [emitted[1], emitted[2]] = [emitted[2], emitted[1]];
          result.indices.push(...emitted);
          result.sourceTriangles.push(chart.sourceTriangles[at]);
        }
      }
      const expected = direction < 0n ? -direction : direction;
      if (covered[0] !== expected * covered[1])
        throw new Error("A conforming source disk must cover the complete original grid triangle exactly: " +
          JSON.stringify({ grid: corners, covered: covered.map(String), expected: String(expected) }));
    }
  result.boundaryEdges = boundary(result.indices);
  return result;
}

/**
 * Gather original triangle incidence and its conservative axis-aligned material box.
 *
 * @evidence contracts/common.md#principled-implementation A coordinate extremum box contains its three original points; exact coordinates remain separately available.
 * @evidence contracts/common.md#clear-and-simple-design One record separates cheap rejection from the subsequent exact intersection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The supplied corner IDs are retained rather than recovered from positions.
 * @evidence contracts/common.md#meaningful-documentation Names the original-point readers and the limited broad-phase role.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The triangle preparation does not define an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The triangle preparation adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The triangle preparation does not choose a mesh population.
 * @evidence contracts/modeling.md#spatial-conventions Both point readers address the same dimensionless material frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The triangle preparation does not construct a part join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this triangle preparation carries no independent rendered form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The triangle preparation supplies no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The triangle preparation defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The triangle preparation exposes no personal shaping input.
 */
function triangle(
  corners: [number, number, number],
  point: (id: number) => MaterialPoint,
  uv: (id: number) => readonly number[],
): MaterialTriangle {
  const values = corners.map(uv);
  return {
    corners,
    points: [point(corners[0]), point(corners[1]), point(corners[2])],
    bounds: [
      Math.min(...values.map((v) => v[0])),
      Math.min(...values.map((v) => v[1])),
      Math.max(...values.map((v) => v[0])),
      Math.max(...values.map((v) => v[1])),
    ],
  };
}

/**
 * Reject only disjoint original-triangle boxes; touching boxes remain candidates.
 *
 * @evidence contracts/common.md#principled-implementation Inclusive interval overlap cannot reject a true triangle intersection or boundary contact.
 * @evidence contracts/common.md#clear-and-simple-design Four interval comparisons perform the entire broad phase.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expansion or clearance tolerance is applied to either box.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes conservative rejection from geometric intersection.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The box predicate does not define an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The box predicate adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The box predicate does not choose a mesh population.
 * @evidence contracts/modeling.md#spatial-conventions Both boxes use the same dimensionless UV frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The box predicate does not construct a part join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this box predicate carries no independent rendered form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The box predicate supplies no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The box predicate defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The box predicate exposes no personal shaping input.
 */
function overlap(a: readonly number[], b: readonly number[]): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

/**
 * Cancel opposite interior edges and order the remaining single closed boundary.
 *
 * @evidence contracts/common.md#principled-implementation A manifold oriented disk has two opposite incidences on interior edges and one incidence on its boundary.
 * @evidence contracts/common.md#clear-and-simple-design One edge table serves cancellation, degree checks and cycle traversal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Third incidences, same-direction neighbors and extra cycles refuse instead of being hidden.
 * @evidence contracts/common.md#meaningful-documentation Documents the disk prerequisite and each incidence failure effect.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The boundary incidence does not define an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The boundary incidence adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The boundary incidence does not choose a mesh population.
 * @evidence contracts/modeling.md#spatial-conventions Vertex IDs are topology ordinals, independent of UV or head metres.
 * @evidence contracts/modeling.md#shared-boundaries The exact final sheet incidence supplies the sole wall boundary, with one incoming and outgoing edge per vertex.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue consumer observes the shell; this boundary incidence carries no independent rendered form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The boundary incidence supplies no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The boundary incidence defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The boundary incidence exposes no personal shaping input.
 */
function boundary(indices: readonly number[]): [number, number][] {
  const edges = new Map<string, [number, number]>();
  const paired = new Set<string>();
  for (let at = 0; at < indices.length; at += 3) {
    for (let side = 0; side < 3; side++) {
      const a = indices[at + side];
      const b = indices[at + (side + 1) % 3];
      const key = Polygon.edge(a, b);
      const prior = edges.get(key);
      if (paired.has(key))
        throw new Error("A conforming sheet edge must have at most two incident triangles.");
      if (prior === undefined) edges.set(key, [a, b]);
      else {
        if (prior[0] !== b || prior[1] !== a)
          throw new Error("Conforming interior triangles need opposite shared-edge orientation.");
        edges.delete(key);
        paired.add(key);
      }
    }
  }
  const next = new Map<number, number>();
  const incoming = new Set<number>();
  for (const [a, b] of edges.values()) {
    if (next.has(a) || incoming.has(b))
      throw new Error("A conforming boundary needs one incoming and outgoing edge per vertex.");
    next.set(a, b);
    incoming.add(b);
  }
  const first = next.keys().next().value;
  if (first === undefined)
    throw new Error("A conforming sheet needs a nonempty closed boundary.");
  const result: [number, number][] = [];
  let current = first;
  do {
    const target = next.get(current);
    if (target === undefined || result.length >= edges.size)
      throw new Error("A conforming sheet boundary must close exactly once.");
    result.push([current, target]);
    current = target;
  } while (current !== first);
  if (result.length !== edges.size)
    throw new Error("A conforming material sheet must have one boundary component.");
  return result;
}
