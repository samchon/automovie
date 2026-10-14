import type { IHumanFacePeriocularMaterialEdgePoint } from "./structures/IHumanFacePeriocularMaterialEdgePoint";
import type { IHumanFaceSkinSeat } from "../skin/IHumanFaceSkinSeat";
import type { IHumanFaceConformingPolygon } from "./structures/IHumanFaceConformingPolygon";
import type { IHumanFaceConformingMaterialTriangle } from "./structures/IHumanFaceConformingMaterialTriangle";

import { HumanFaceConformingMaterialArithmetic as Arithmetic } from "./HumanFaceConformingMaterialArithmetic";
import { HumanFaceConformingPolygon as Polygon } from "./HumanFaceConformingPolygon";
import { HumanFaceConformingRefinement as Refinement } from "./HumanFaceConformingRefinement";
import type { IHumanFaceConformingMaterialCut as MaterialCut } from "./structures/IHumanFaceConformingMaterialCut";
import type { IHumanFaceConformingIncidenceWitness } from "./structures/IHumanFaceConformingIncidenceWitness";
import type { IHumanFacePeriocularHostSample } from "./structures/IHumanFacePeriocularHostSample";
import type { IHumanFaceConformingSheet } from "./structures/IHumanFaceConformingSheet";
import type { IHumanFaceConformingSheetInput } from "./structures/IHumanFaceConformingSheetInput";
import type { IHumanFaceConformingSheetVertex } from "./structures/IHumanFaceConformingSheetVertex";

/**
 * Homogeneous material coordinates with a positive denominator; scale cancels from incidence predicates.
 */
type MaterialPoint = Parameters<typeof Arithmetic.orientation>[0];

/**
 * Exact twice-area as a signed rational, used before any output rounding.
 */
type MaterialArea = ReturnType<typeof Arithmetic.addArea>;

/**
 * Triangulate one complete simple material boundary and overlay its triangles
 * with the actual source-host triangulation.
 * The material triangles retain the original cross-band density before
 * native common refinement. Each intersection keeps all boundary cuts;
 * no native-clipped triangle receives a second density multiplier.
 * New vertices read that host triangle barycentrically; original boundary
 * vertices keep their supplied seats.
 *
 * Binary64 UVs are dyadic rationals. A common power-of-two unit makes original
 * coordinates integers, additionally scaled by the material division count.
 * The complete barycentric lattice therefore also has integer coordinates.
 * Homogeneous intersections and BigInt determinants then
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
 * A declared native-edge grid point retains its original endpoints and affine
 * fraction through the exact overlay. Its rounded UV is diagnostic, not a
 * second independent point that may fall off that same source edge.
 *
 * @evidence contracts/common.md#principled-implementation Exact dyadic homogeneous predicates overlay the complete admitted simple material boundary with native host triangles and verify complete rational area coverage.
 * @evidence contracts/common.md#clear-and-simple-design Canonical arithmetic, polygon and refinement owners preserve shared original-edge cut identity; this assembler owns final host seats and ordered boundary incidence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unregistered coincidences, missing exact coverage or invalid manifold/oriented incidence refuse instead of welding, tolerance clipping or deleting cuts.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes exact predicates from rounded readers, source embedding prerequisites and downstream metric/physiological admission.
 * @evidence contracts/performance.md#efficient-algorithms For B outline cuts, T hosts and D divisions, exact ear clipping can be O(B cubed) and overlay considers O(BD squared T) candidate pairs with BigInt-width costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Compile-local resident keys reuse shared cuts, declared endpoint aliases reuse native identities and admitted boxes skip only disjoint pairs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned vertices/incidence own the complete overlay; key/alias/grid/source maps expire, with output growth driven by refinement and no independent D cap.
 */
export function createHumanFaceConformingSheet(
  input: IHumanFaceConformingSheetInput,
): IHumanFaceConformingSheet {
  const { chart, samples, boundary: outlineIds, refinement }: IHumanFaceConformingSheetInput = input;
  if (!Number.isSafeInteger(refinement) || refinement < 1)
    throw new Error("A material domain needs a positive integer refinement.");
  const unitFactor: bigint = BigInt(refinement);
  const gridIds: number[] = [...outlineIds];
  const gridUV: [number, number][] = gridIds.map((id: number): [number, number]  => {
    const point: [number, number] | undefined = samples[id]?.materialPoint;
    if (point === undefined || !point.every(Number.isFinite))
      throw new Error(
        "A conforming sheet needs every original material sample.",
      );
    return point;
  });
  const allUV: number[] = [...chart.coordinates, ...gridUV.flat()];
  const binary: [bigint, number][] = allUV.map(Arithmetic.dyadic);
  const fractionPowers: number[] = gridIds.flatMap((id: number): number[]  => {
    const edge: IHumanFacePeriocularMaterialEdgePoint | undefined = samples[id].materialEdge;
    if (edge === undefined) return [];
    if (!Number.isFinite(edge.fraction) || edge.fraction < 0 || edge.fraction > 1)
      throw new Error("A material edge point needs a finite fraction in its parent edge.");
    const [n, power]: [bigint, number] = Arithmetic.dyadic(edge.fraction);
    return n === 0n ? [] : [power];
  });
  const exponent: number = Math.min(
    ...binary.filter(([n]: [bigint, number]): boolean  => n !== 0n).map(([, e]: [bigint, number]): number  => e),
  ) + Math.min(0, ...fractionPowers);
  if (!Number.isFinite(exponent))
    throw new Error("A conforming chart needs nonzero material extent.");
  const integers: bigint[] = binary.map(([n, e]: [bigint, number]): bigint  => (n << BigInt(e - exponent)) * unitFactor);
  const hostPoints: [bigint, bigint, bigint][] = chart.vertices.map(
    (_: number, at: number): MaterialPoint => [integers[2 * at], integers[2 * at + 1], 1n],
  );
  const gridPoints: Map<number, [bigint, bigint, bigint]> = new Map(
    gridIds.map((id: number, at: number): [number, MaterialPoint] => [
      id,
      [
        integers[chart.coordinates.length + 2 * at],
        integers[chart.coordinates.length + 2 * at + 1],
        1n,
      ],
    ]),
  );
  const hostOrdinal: Map<number, number> = new Map(chart.sourceTriangles.map((id: number, at: number): [number, number]  => [id, at]));
  const hostVertex: Map<number, number> = new Map(chart.vertices.map((vertex: number, at: number): [number, number]  => [vertex, at]));
  const nativeEdge: Set<string> = new Set<string>();
  for (let at: number = 0; at < chart.indices.length; at += 3)
    for (let corner: number = 0; corner < 3; corner++)
      nativeEdge.add(Polygon.edge(
        chart.vertices[chart.indices[at + corner]],
        chart.vertices[chart.indices[at + (corner + 1) % 3]],
      ));
  for (const id of gridIds) {
    const edge: IHumanFacePeriocularMaterialEdgePoint | undefined = samples[id].materialEdge;
    if (edge === undefined) continue;
    const [a, b]: [number, number] = edge.vertices;
    const first: number | undefined = hostVertex.get(a), last: number | undefined = hostVertex.get(b);
    const fraction: number = edge.fraction;
    const seat: IHumanFaceSkinSeat = samples[id].seat, triangle: number | undefined = hostOrdinal.get(seat.triangle);
    if (first === undefined || last === undefined || a === b ||
      !nativeEdge.has(Polygon.edge(a, b)) || triangle === undefined ||
      !Number.isFinite(fraction) || fraction < 0 || fraction > 1 ||
      !chart.indices.slice(3 * triangle, 3 * triangle + 3).includes(first) ||
      !chart.indices.slice(3 * triangle, 3 * triangle + 3).includes(last) ||
      seat.weights.some((weight: number, corner: number): boolean  => {
        const vertex: number = chart.vertices[chart.indices[3 * triangle + corner]];
        return weight !== (vertex === a ? 1 - fraction : vertex === b ? fraction : 0);
      }))
      throw new Error("A material edge point needs its exact native parent and affine seat.");
    const [significand, power]: [bigint, number] = Arithmetic.dyadic(fraction);
    const denominator: bigint = power < 0 ? 1n << BigInt(-power) : 1n;
    const numerator: bigint = power > 0 ? significand << BigInt(power) : significand;
    // The common unit includes every fraction's binary exponent, so both
    // parent coordinates are divisible by this denominator exactly.
    gridPoints.set(id, [
      (hostPoints[first][0] * (denominator - numerator) + hostPoints[last][0] * numerator) / denominator,
      (hostPoints[first][1] * (denominator - numerator) + hostPoints[last][1] * numerator) / denominator,
      1n,
    ]);
  }
  const aliases: Map<number, string> = new Map<number, string>();
  for (const id of gridIds) {
    const seat: IHumanFaceSkinSeat = samples[id].seat;
    const at: number | undefined = hostOrdinal.get(seat.triangle);
    if (at === undefined)
      throw new Error(
        "A conforming sample needs its resident source triangle.",
      );
    const corner: number = seat.weights.findIndex((weight: number): boolean  => weight === 1);
    if (
      corner < 0 ||
      seat.weights.some((weight: number, index: number): boolean  => index !== corner && weight !== 0)
    )
      continue;
    const host: number = chart.indices[3 * at + corner];
    const prior: string | undefined = aliases.get(host);
    if (prior !== undefined && prior !== `g:${id}`)
      throw new Error(
        "Distinct canonical grid vertices cannot name one source endpoint.",
      );
    aliases.set(host, `g:${id}`);
  }
  const outline: IHumanFaceConformingPolygon = Polygon.outline(
    gridIds.map((id: number): MaterialCut => ({
      key: "g:" + id,
      point: gridPoints.get(id)!,
    })),
  );
  const materialTriangles: IHumanFaceConformingMaterialTriangle[] = Polygon.triangulate(outline.cuts).map((indices: [number, number, number]): IHumanFaceConformingMaterialTriangle  => {
    const corners: [number, number, number] = indices.map(
      (corner: number): number  => Number(outline.cuts[corner].key.slice(2)),
    ) as [number, number, number];
    return Refinement.triangle(
      corners,
      (id: number): [bigint, bigint, bigint]  => gridPoints.get(id)!,
      (id: number): string  => "g:" + id,
    );
  });
  const source: IHumanFaceConformingMaterialTriangle[] = chart.sourceTriangles.map((_: number, at: number): IHumanFaceConformingMaterialTriangle  =>
    Refinement.triangle(
      chart.indices.slice(3 * at, 3 * at + 3) as [number, number, number],
      (id: number): [bigint, bigint, bigint]  => hostPoints[id],
      (id: number): string  => "h:" + chart.vertices[id],
    ),
  );
  const result: IHumanFaceConformingSheet = {
    vertices: [],
    indices: [],
    sourceTriangles: [],
    boundaryEdges: [],
  };
  const resident: Map<string, number> = new Map<string, number>();
  const gridTriangles: [number, number, number][] = [];
  const gridDirections: number[] = [];
  for (const grid of Refinement.compile(materialTriangles, refinement)) {
    const corners: [number, number, number] = grid.originalCorners;
    const originalPoints: [bigint, bigint, bigint][] = corners.map((id: number): [bigint, bigint, bigint]  => gridPoints.get(id)!);
    const direction: bigint = Arithmetic.orientation(...grid.points);
    if (direction <= 0n)
      throw new Error(
        "A triangulated material region needs positive nonzero area.",
      );
    let covered: MaterialArea = [0n, 1n];
    for (let at: number = 0; at < source.length; at++) {
      const host: IHumanFaceConformingMaterialTriangle = source[at];
      if (!overlap(grid.bounds, host.bounds)) continue;
      const polygon: IHumanFaceConformingPolygon = Polygon.intersect(grid, host, aliases, chart.vertices);
      if (polygon.cuts.length < 3) continue;
      const area: [bigint, bigint] = polygon.area;
      if (area[0] === 0n) continue;
      covered = Arithmetic.addArea(covered, area);
      const mapCut: (cut: MaterialCut) => number = (cut: MaterialCut): number => {
        const prior: number | undefined = resident.get(cut.key);
        if (prior !== undefined) return prior;
        const index: number = result.vertices.length;
        const original: IHumanFacePeriocularHostSample | undefined = cut.key.startsWith("g:")
          ? samples[Number(cut.key.slice(2))]
          : undefined;
        const vertex: IHumanFaceConformingSheetVertex = {
          provenance: cut.key,
          materialPoint: [
            Arithmetic.numberAt(cut.point[0], cut.point[2] * unitFactor, exponent),
            Arithmetic.numberAt(cut.point[1], cut.point[2] * unitFactor, exponent),
          ],
          seat:
            original === undefined
              ? {
                  triangle: chart.sourceTriangles[at],
                  weights: Arithmetic.barycentric(host.points, cut.point),
                }
              : {
                  triangle: original.seat.triangle,
                  weights: [...original.seat.weights],
                },
          gridCorners: [...corners],
          gridWeights: Arithmetic.barycentric(originalPoints, cut.point),
        };
        resident.set(cut.key, index);
        result.vertices.push(vertex);
        return index;
      };
      for (const piece of Polygon.triangulate(polygon.cuts)) {
        result.indices.push(...piece.map((corner: number): number  => mapCut(polygon.cuts[corner])));
        result.sourceTriangles.push(chart.sourceTriangles[at]);
        gridTriangles.push([...corners]);
        gridDirections.push(1);
      }
    }
    const expected: bigint = direction;
    if (covered[0] !== expected * covered[1])
      throw new Error(
        "A conforming source disk must cover the complete original material triangle exactly: " +
          JSON.stringify({
            grid: grid.corners,
            gridKeys: grid.keys,
            gridPoints: grid.points.map((point: [bigint, bigint, bigint]): string[]  => point.map(String)),
            originalDomain: corners,
            covered: covered.map(String),
            expected: String(expected),
          }),
      );
  }
  result.boundaryEdges = boundary(result, gridTriangles, gridDirections, samples);
  return result;
}

/**
 * Reject only disjoint original-triangle boxes; touching boxes remain candidates.
 */
function overlap(a: readonly bigint[], b: readonly bigint[]): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

/**
 * Cancel opposite interior edges and order the remaining single closed boundary.
 * A refused edge retains all original incident faces and their grid/native
 * parents. Collection leaves the first original refusal and every predicate
 * unchanged; no invalid incidence is returned as a boundary.
 */
function boundary(
  sheet: IHumanFaceConformingSheet,
  gridTriangles: readonly [number, number, number][],
  gridDirections: readonly number[],
  samples: readonly IHumanFacePeriocularHostSample[],
): [number, number][] {
  const indices: number[] = sheet.indices;
  const incidence: Map<string, [number, number, number][]> = new Map<string, [number, number, number][]>();
  const refused: Set<string> = new Set<string>();
  let firstError: string | undefined;
  for (let at: number = 0; at < indices.length; at += 3) {
    for (let side: number = 0; side < 3; side++) {
      const a: number = indices[at + side];
      const b: number = indices[at + ((side + 1) % 3)];
      const key: string = Polygon.edge(a, b);
      const faces: [number, number, number][] = incidence.get(key) ?? [];
      if (faces.length >= 2) {
        refused.add(key);
        firstError ??= "A conforming sheet edge must have at most two incident triangles.";
      } else if (faces.length === 1) {
        const prior: [number, number, number] = faces[0];
        if (prior[0] !== b || prior[1] !== a) {
          refused.add(key);
          firstError ??= "Conforming interior triangles need opposite shared-edge orientation.";
        }
      }
      faces.push([a, b, at / 3]);
      incidence.set(key, faces);
    }
  }
  if (firstError !== undefined) {
    const witnesses: IHumanFaceConformingIncidenceWitness[] = [...refused].map((key: string): IHumanFaceConformingIncidenceWitness => {
      const faces: [number, number, number][] = incidence.get(key)!;
      const [a, b]: [number, number, number] = faces[0];
      const edge: [number, number] = a < b ? [a, b] : [b, a];
      const triangles: number[] = faces.map((face: [number, number, number]): number  => face[2]);
      return {
        reason: faces.length > 2 ? "nonmanifold" : "orientation",
        edge,
        triangles,
        directions: faces.map((face: [number, number, number]): [number, number]  => [face[0], face[1]]),
        sourceTriangles: triangles.map((triangle: number): number  => sheet.sourceTriangles[triangle]),
        gridTriangles: triangles.map((triangle: number): [number, number, number]  => [...gridTriangles[triangle]]),
        gridDirections: triangles.map((triangle: number): number  => gridDirections[triangle]),
        vertices: edge.map((vertex: number): IHumanFaceConformingSheetVertex  => sheet.vertices[vertex]),
        gridSamples: triangles.map((triangle: number): IHumanFacePeriocularHostSample[]  => gridTriangles[triangle].map((vertex: number): IHumanFacePeriocularHostSample  => samples[vertex])),
      };
    });
    throw new Error(firstError + " incidence:" + JSON.stringify(witnesses));
  }
  const edges: Map<string, [number, number]> = new Map<string, [number, number]>();
  for (const [key, faces] of incidence)
    if (faces.length === 1) edges.set(key, [faces[0][0], faces[0][1]]);
  const next: Map<number, number> = new Map<number, number>();
  const incoming: Set<number> = new Set<number>();
  for (const [a, b] of edges.values()) {
    if (next.has(a) || incoming.has(b))
      throw new Error(
        "A conforming boundary needs one incoming and outgoing edge per vertex.",
      );
    next.set(a, b);
    incoming.add(b);
  }
  const first: number | undefined = next.keys().next().value;
  if (first === undefined)
    throw new Error("A conforming sheet needs a nonempty closed boundary.");
  const result: [number, number][] = [];
  let current: number = first;
  do {
    const target: number | undefined = next.get(current);
    if (target === undefined || result.length >= edges.size)
      throw new Error("A conforming sheet boundary must close exactly once.");
    result.push([current, target]);
    current = target;
  } while (current !== first);
  if (result.length !== edges.size)
    throw new Error(
      "A conforming material sheet must have one boundary component.",
    );
  return result;
}
