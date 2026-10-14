import { HumanExactFraction as F } from "../../../common/measure/HumanExactFraction";
import { createHumanFaceAttachmentChartHost } from "../eye/createHumanFaceAttachmentChartHost";
import type { IHumanFaceSkinChart } from "./IHumanFaceSkinChart";
import type { IHumanFaceSkinChartCoordinate } from "./IHumanFaceSkinChartCoordinate";
import type { IHumanFaceSkinChartInput } from "./IHumanFaceSkinChartInput";
import type { IHumanFaceSkinChartSpan } from "./IHumanFaceSkinChartSpan";
import type { IHumanFaceSkinChartTriangle } from "./IHumanFaceSkinChartTriangle";
import { readHumanFaceSkinChartWeights } from "./readHumanFaceSkinChartWeights";
import { walkHumanFaceSkinChart } from "./walkHumanFaceSkinChart";
import { createHumanFaceSkinHost } from "./createHumanFaceSkinHost";
import type { IHumanFaceSkinHost } from "./IHumanFaceSkinHost";
import type { IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported } from "../../../index";
import type { IAutoMovieHumanFaceAttachmentChart as IAutoMovieHumanFaceAttachmentChartImported } from "../../structures/IAutoMovieHumanFaceAttachmentChart";
import type { IHumanExactFraction as IHumanExactFractionImported } from "../../../common/measure/IHumanExactFraction";
import type { IHumanFaceExactSkinSeat as IHumanFaceExactSkinSeatImported } from "./IHumanFaceExactSkinSeat";
import type { IHumanFaceSkinFrame as IHumanFaceSkinFrameImported } from "./IHumanFaceSkinFrame";
import type { IHumanFaceSkinSeat as IHumanFaceSkinSeatImported } from "./IHumanFaceSkinSeat";


/**
 * Read one publisher-registered material disk through the current skin host.
 * Native vertex identities, positive material coordinates and actual triangle
 * adjacency are fixed by the source generation. Identity or performance changes
 * only the host frame, never the material inverse or selected sheet. The first
 * registered anchor's first incident disk facet supplies the walking seed.
 * A part-owned registration, such as an existing lid cage disk, can be supplied
 * directly instead of duplicating it in the surface's named material domains.
 * Both routes require the same source generation, sample identities and winding.
 *
 * A finite metre displacement advances the actual shape-only reference point.
 * The existing native nearest owner registers that guide on the reference skin
 * once; its represented barycentrics are normalized by their exact sum and
 * mapped into this same material disk. Current geometry never selects a new
 * nearest sheet. This source registration is an authored convention, not a
 * geodesic or clinical crease. Missing native coverage refuses.
 * The native nearest helper uses F64 geometry, its existing triangle tie rule
 * and bounded barycentric recovery. Exact material arithmetic preserves that
 * represented registration, not a mathematical exact-nearest certificate.
 * Source/topology/reference changes invalidate every consuming course and asset.
 *
 * @evidence contracts/common.md#principled-implementation A cloned publisher-registered positive material disk fixes exact affine facet inverses and native adjacency; current host incidence must agree, and reference-metre offsets register through the same shape-only native skin rather than choosing a new performed sheet.
 * @evidence contracts/common.md#clear-and-simple-design Coordinate lookup, reference registration, offsets and chord compilation share one disk/cell owner; the host retains physical positions/normals and the walker retains continuation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing generation/coverage, nonpositive facets, changed incidence and lost native anchors refuse. Reference seating normalizes only represented barycentric sum, which preserves that registration but proves no exact-nearest or clinical course.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes fixed source identity from current physical frame, seed selection, part-owned registration, reference offsets, numerical nearest limits and invalidation.
 * @evidence contracts/performance.md#efficient-algorithms Compiling D disk facets builds edge adjacency, cells and vertex lookup once; each support check/chord walk traverses reached native cells with rational bit cost. Support membership currently scans registered vertices and reference nearest-index creation is deferred until a nonzero registration needs it.
 * @evidence contracts/performance.md#reuse-equivalent-work The immutable cell map, exact inverses and adjacency serve every coordinate/walk on this chart; one lazy reference host serves offsets, while changed source generation, reference or physical host requires a new chart.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The chart closure retains cloned registration, reference arrays, O(D) cells/adjacency and its optional reference host; per-walk equations/spans are invocation-owned, and failed compilation returns no retained chart or external resource.
 *
 * @author Samchon
 */
export function createHumanFaceSkinChart(
  input: IHumanFaceSkinChartInput,
): IHumanFaceSkinChart {
  const host: IHumanFaceSkinHost = input.host;
  const domain: string = input.domain;
  const supports: number[] = [...input.supportVertices];
  const source: IAutoMovieHumanFaceBasisSurfaceImported = input.surface;
  const registered: IAutoMovieHumanFaceAttachmentChartImported | undefined = input.registration ?? source.materialCharts?.[domain];
  if (registered === undefined || supports.length === 0 ||
    supports.some((vertex: number): boolean  => !registered.vertices.includes(vertex)))
    throw new Error("A skin course needs its registered material disk covering every native anchor: " + domain);
  const registration: IAutoMovieHumanFaceAttachmentChartImported = structuredClone(registered);
  createHumanFaceAttachmentChartHost(registration, source);
  const points: number[] = [...input.referencePositions];
  const referenceIndices: number[] = [...source.indices];
  if (points.length !== source.positions.length || points.length % 3 !== 0 || points.some((value: number): boolean  => !Number.isFinite(value)))
    throw new Error("A skin material chart needs finite source-reference positions.");
  const ordinal: Map<number, number> = new Map(registration.vertices.map((vertex: number, at: number): [number, number]  => [vertex, at]));
  const coordinate: (vertex: number) => IHumanFaceSkinChartCoordinate = (vertex: number): IHumanFaceSkinChartCoordinate => {
    const at: number | undefined = ordinal.get(vertex);
    if (at === undefined)
      throw new Error("A skin material station is outside its registered source disk.");
    return {
      x: F.from(registration.coordinates[2 * at]),
      y: F.from(registration.coordinates[2 * at + 1]),
    };
  };
  const edges: Map<string, [number, number][]> = new Map<string, [number, number][]>();
  for (const triangle of registration.sourceTriangles)
    for (let axis: number = 0; axis < 3; axis++) {
      const a: number = source.indices[3 * triangle + ((axis + 1) % 3)];
      const b: number = source.indices[3 * triangle + ((axis + 2) % 3)];
      const key: string = Math.min(a, b) + ":" + Math.max(a, b);
      const entries: [number, number][] = edges.get(key) ?? [];
      entries.push([triangle, axis]);
      edges.set(key, entries);
    }
  const neighbors: Map<number, number[][]> = new Map(registration.sourceTriangles.map((triangle: number): [number, number[][]]  => [triangle, [[], [], []] as number[][]]));
  for (const entries of edges.values())
    for (const [triangle, axis] of entries)
      neighbors.get(triangle)![axis] = entries.filter(([other]: [number, number]): boolean  => other !== triangle).map(([other]: [number, number]): number  => other);
  const cells: Map<number, IHumanFaceSkinChartTriangle> = new Map<number, IHumanFaceSkinChartTriangle>();
  for (let at: number = 0; at < registration.sourceTriangles.length; at++) {
    const triangle: number = registration.sourceTriangles[at];
    const vertices: [number, number, number] = [
      registration.vertices[registration.indices[3 * at]],
      registration.vertices[registration.indices[3 * at + 1]],
      registration.vertices[registration.indices[3 * at + 2]],
    ];
    if (vertices.some((vertex: number, corner: number): boolean  => host.corners(triangle)[corner] !== vertex))
      throw new Error("A skin material chart and current host disagree about native incidence.");
    const corners: [IHumanFaceSkinChartCoordinate, IHumanFaceSkinChartCoordinate, IHumanFaceSkinChartCoordinate] =
      [coordinate(vertices[0]), coordinate(vertices[1]), coordinate(vertices[2])];
    const [a, b, c]: [IHumanFaceSkinChartCoordinate, IHumanFaceSkinChartCoordinate, IHumanFaceSkinChartCoordinate] = corners;
    const determinant: IHumanExactFractionImported = F.subtract(
      F.multiply(F.subtract(b.x, a.x), F.subtract(c.y, a.y)),
      F.multiply(F.subtract(b.y, a.y), F.subtract(c.x, a.x)),
    );
    if (determinant.numerator <= 0n)
      throw new Error("A registered skin material disk has a nonpositive exact facet.");
    cells.set(triangle, { ordinal: triangle, vertices, corners, determinant, neighbors: neighbors.get(triangle)! });
  }
  const cell: (triangle: number) => IHumanFaceSkinChartTriangle = (triangle: number): IHumanFaceSkinChartTriangle => {
    const result: IHumanFaceSkinChartTriangle | undefined = cells.get(triangle);
    if (result === undefined)
      throw new Error("A skin material walk left its registered disk.");
    return result;
  };
  const seedTriangle: number | undefined = registration.sourceTriangles.find((triangle: number): boolean  => cell(triangle).vertices.includes(supports[0]));
  if (seedTriangle === undefined)
    throw new Error("A registered skin anchor needs actual native incidence.");
  const seed: IHumanFaceSkinChartTriangle = cell(seedTriangle);
  const third: IHumanExactFractionImported = F.create(1n, 3n);
  const origin: IHumanFaceSkinChartCoordinate = {
    x: F.multiply(seed.corners.reduce((sum: IHumanExactFractionImported, point: IHumanFaceSkinChartCoordinate): IHumanExactFractionImported  => F.add(sum, point.x), F.create(0n)), third),
    y: F.multiply(seed.corners.reduce((sum: IHumanExactFractionImported, point: IHumanFaceSkinChartCoordinate): IHumanExactFractionImported  => F.add(sum, point.y), F.create(0n)), third),
  };
  const frame: (seat: IHumanFaceExactSkinSeatImported) => IHumanFaceSkinFrameImported = host.frameExact;
  const locate: (point: IHumanFaceSkinChartCoordinate) => number = (point: IHumanFaceSkinChartCoordinate): number => {
    try {
      return walkHumanFaceSkinChart({ from: origin, to: point, startTriangle: seedTriangle, cell, frame, spans: [] });
    } catch (error) {
      throw new Error(
        `Skin material domain ${domain}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  };
  for (const vertex of supports) {
    const point: IHumanFaceSkinChartCoordinate = coordinate(vertex);
    const support: IHumanFaceSkinChartTriangle = cell(locate(point));
    const weights: [IHumanExactFractionImported, IHumanExactFractionImported, IHumanExactFractionImported] = readHumanFaceSkinChartWeights(support, point);
    if (!support.vertices.some((id: number, axis: number): boolean  => id === vertex && weights[axis].numerator === weights[axis].denominator && weights.every((weight: IHumanExactFractionImported, other: number): boolean  => other === axis || weight.numerator === 0n)))
      throw new Error("A skin material chart cannot retain registered native anchor identity: " + vertex);
  }
  let referenceHost: IHumanFaceSkinHost | undefined;
  const register: (point: readonly number[]) => IHumanFaceSkinChartCoordinate = (point: readonly number[]): IHumanFaceSkinChartCoordinate => {
    if (point.length !== 3 || point.some((value: number): boolean  => !Number.isFinite(value)))
      throw new Error("Reference material registration needs three finite head-frame metres.");
    referenceHost ??= createHumanFaceSkinHost(referenceIndices, points);
    const seat: IHumanFaceSkinSeatImported = referenceHost.seat(point);
    const target: IHumanFaceSkinChartTriangle | undefined = cells.get(seat.triangle);
    if (target === undefined)
      throw new Error(`Skin material domain ${domain} lacks reference triangle ${seat.triangle}: ${JSON.stringify({ point, weights: seat.weights })}`);
    // Normalize only the exact sum of represented geometric barycentrics;
    // the finite reference guide and anatomical quantities stay unchanged.
    const weights: IHumanExactFractionImported[] = seat.weights.map((value: number): IHumanExactFractionImported  => F.from(value));
    const total: IHumanExactFractionImported = weights.reduce((sum: IHumanExactFractionImported, value: IHumanExactFractionImported): IHumanExactFractionImported  => F.add(sum, value), F.create(0n));
    const normalized: IHumanExactFractionImported[] = weights.map((value: IHumanExactFractionImported): IHumanExactFractionImported  => F.divide(value, total));
    return {
      x: target.corners.reduce((sum: IHumanExactFractionImported, corner: IHumanFaceSkinChartCoordinate, at: number): IHumanExactFractionImported  => F.add(sum, F.multiply(normalized[at], corner.x)), F.create(0n)),
      y: target.corners.reduce((sum: IHumanExactFractionImported, corner: IHumanFaceSkinChartCoordinate, at: number): IHumanExactFractionImported  => F.add(sum, F.multiply(normalized[at], corner.y)), F.create(0n)),
    };
  };
  return {
    coordinate,
    register,
    offset: (point: IHumanFaceSkinChartCoordinate, displacement: readonly number[]): IHumanFaceSkinChartCoordinate  => {
      if (displacement.length !== 3 || displacement.some((value: number): boolean  => !Number.isFinite(value)))
        throw new Error("A reference material displacement needs three finite head-frame metres.");
      const facet: IHumanFaceSkinChartTriangle = cell(locate(point));
      if (displacement.every((value: number): boolean  => value === 0))
        return { x: point.x, y: point.y };
      referenceHost ??= createHumanFaceSkinHost(referenceIndices, points);
      const origin: number[] = referenceHost.frameExact({
        triangle: facet.ordinal,
        weights: readHumanFaceSkinChartWeights(facet, point),
      }).point;
      return register(origin.map((value: number, axis: number): number  => value + displacement[axis]));
    },
    compile: (guide: readonly IHumanFaceSkinChartCoordinate[]): IHumanFaceSkinChartSpan[]  => {
      if (guide.length < 2)
        throw new Error("A skin material course needs at least two ordered stations.");
      let triangle: number = locate(guide[0]);
      const spans: IHumanFaceSkinChartSpan[] = [];
      for (let at: number = 0; at + 1 < guide.length; at++)
        triangle = walkHumanFaceSkinChart({ from: guide[at], to: guide[at + 1], startTriangle: triangle, cell, frame, spans });
      return spans;
    },
  };
}
