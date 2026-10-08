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
 * @evidence contracts/common.md#principled-implementation Registered material coordinates and exact native-cell lifting retain correspondence; finite 3D guide registration belongs to one shape-only reference rather than a tangent differential extrapolated beyond its facet.
 * @evidence contracts/common.md#clear-and-simple-design One immutable disk owns native continuation; its lazy reference host registers dimensioned guides while the current host alone supplies performed geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shape-only native nearest registration retains the helper's geometric barycentric bounds without changing anatomical guide dimensions; current-state reseating, fallback sheets and source alteration are absent.
 * @evidence contracts/common.md#meaningful-documentation States source domain, shape-only registration, represented-weight normalization, units and invalidation.
 * @evidence contracts/modeling.md#spatial-conventions Reference displacements and host positions are canonical head-frame metres; material coordinates and barycentrics are dimensionless.
 * @evidence contracts/modeling.md#shared-boundaries Exact source incidence and one coordinate per native vertex preserve each joined material interval on actual shared edges.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reads a registered disk on existing skin.
 * @evidenceExclude contracts/modeling.md#parameter-channels The relief and brow owners retain numerical input meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits internal course intervals only.
 * @evidenceExclude contracts/modeling.md#rendered-observation Consuming relief and brow assemblies observe the final output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Source registration and finite reference guides are geometric conventions, not clinical tissue measurements.
 * @evidenceExclude contracts/anatomy.md#permitted-range Actual source coverage and downstream contact retain admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Introduces no personal source vertex or sculpt input.
 * @author Samchon
 */
export function createHumanFaceSkinChart(
  input: IHumanFaceSkinChartInput,
): IHumanFaceSkinChart {
  const host = input.host;
  const domain = input.domain;
  const supports = [...input.supportVertices];
  const source = input.surface;
  const registered = input.registration ?? source.materialCharts?.[domain];
  if (registered === undefined || supports.length === 0 ||
    supports.some((vertex) => !registered.vertices.includes(vertex)))
    throw new Error("A skin course needs its registered material disk covering every native anchor: " + domain);
  const registration = structuredClone(registered);
  createHumanFaceAttachmentChartHost(registration, source);
  const points = [...input.referencePositions];
  const referenceIndices = [...source.indices];
  if (points.length !== source.positions.length || points.length % 3 !== 0 || points.some((value) => !Number.isFinite(value)))
    throw new Error("A skin material chart needs finite source-reference positions.");
  const ordinal = new Map(registration.vertices.map((vertex, at) => [vertex, at]));
  const coordinate = (vertex: number): IHumanFaceSkinChartCoordinate => {
    const at = ordinal.get(vertex);
    if (at === undefined)
      throw new Error("A skin material station is outside its registered source disk.");
    return {
      x: F.from(registration.coordinates[2 * at]),
      y: F.from(registration.coordinates[2 * at + 1]),
    };
  };
  const edges = new Map<string, [number, number][]>();
  for (const triangle of registration.sourceTriangles)
    for (let axis = 0; axis < 3; axis++) {
      const a = source.indices[3 * triangle + ((axis + 1) % 3)];
      const b = source.indices[3 * triangle + ((axis + 2) % 3)];
      const key = Math.min(a, b) + ":" + Math.max(a, b);
      const entries = edges.get(key) ?? [];
      entries.push([triangle, axis]);
      edges.set(key, entries);
    }
  const neighbors = new Map(registration.sourceTriangles.map((triangle) => [triangle, [[], [], []] as number[][]]));
  for (const entries of edges.values())
    for (const [triangle, axis] of entries)
      neighbors.get(triangle)![axis] = entries.filter(([other]) => other !== triangle).map(([other]) => other);
  const cells = new Map<number, IHumanFaceSkinChartTriangle>();
  for (let at = 0; at < registration.sourceTriangles.length; at++) {
    const triangle = registration.sourceTriangles[at];
    const vertices: [number, number, number] = [
      registration.vertices[registration.indices[3 * at]],
      registration.vertices[registration.indices[3 * at + 1]],
      registration.vertices[registration.indices[3 * at + 2]],
    ];
    if (vertices.some((vertex, corner) => host.corners(triangle)[corner] !== vertex))
      throw new Error("A skin material chart and current host disagree about native incidence.");
    const corners: [IHumanFaceSkinChartCoordinate, IHumanFaceSkinChartCoordinate, IHumanFaceSkinChartCoordinate] =
      [coordinate(vertices[0]), coordinate(vertices[1]), coordinate(vertices[2])];
    const [a, b, c] = corners;
    const determinant = F.subtract(
      F.multiply(F.subtract(b.x, a.x), F.subtract(c.y, a.y)),
      F.multiply(F.subtract(b.y, a.y), F.subtract(c.x, a.x)),
    );
    if (determinant.numerator <= 0n)
      throw new Error("A registered skin material disk has a nonpositive exact facet.");
    cells.set(triangle, { ordinal: triangle, vertices, corners, determinant, neighbors: neighbors.get(triangle)! });
  }
  const cell = (triangle: number): IHumanFaceSkinChartTriangle => {
    const result = cells.get(triangle);
    if (result === undefined)
      throw new Error("A skin material walk left its registered disk.");
    return result;
  };
  const seedTriangle = registration.sourceTriangles.find((triangle) => cell(triangle).vertices.includes(supports[0]));
  if (seedTriangle === undefined)
    throw new Error("A registered skin anchor needs actual native incidence.");
  const seed = cell(seedTriangle);
  const third = F.create(1n, 3n);
  const origin: IHumanFaceSkinChartCoordinate = {
    x: F.multiply(seed.corners.reduce((sum, point) => F.add(sum, point.x), F.create(0n)), third),
    y: F.multiply(seed.corners.reduce((sum, point) => F.add(sum, point.y), F.create(0n)), third),
  };
  const frame = host.frameExact;
  const locate = (point: IHumanFaceSkinChartCoordinate): number => {
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
    const point = coordinate(vertex);
    const support = cell(locate(point));
    const weights = readHumanFaceSkinChartWeights(support, point);
    if (!support.vertices.some((id, axis) => id === vertex && weights[axis].numerator === weights[axis].denominator && weights.every((weight, other) => other === axis || weight.numerator === 0n)))
      throw new Error("A skin material chart cannot retain registered native anchor identity: " + vertex);
  }
  let referenceHost: IHumanFaceSkinHost | undefined;
  const register = (point: readonly number[]): IHumanFaceSkinChartCoordinate => {
    if (point.length !== 3 || point.some((value) => !Number.isFinite(value)))
      throw new Error("Reference material registration needs three finite head-frame metres.");
    referenceHost ??= createHumanFaceSkinHost(referenceIndices, points);
    const seat = referenceHost.seat(point);
    const target = cells.get(seat.triangle);
    if (target === undefined)
      throw new Error(`Skin material domain ${domain} lacks reference triangle ${seat.triangle}: ${JSON.stringify({ point, weights: seat.weights })}`);
    // Normalize only the exact sum of represented geometric barycentrics;
    // the finite reference guide and anatomical quantities stay unchanged.
    const weights = seat.weights.map((value) => F.from(value));
    const total = weights.reduce((sum, value) => F.add(sum, value), F.create(0n));
    const normalized = weights.map((value) => F.divide(value, total));
    return {
      x: target.corners.reduce((sum, corner, at) => F.add(sum, F.multiply(normalized[at], corner.x)), F.create(0n)),
      y: target.corners.reduce((sum, corner, at) => F.add(sum, F.multiply(normalized[at], corner.y)), F.create(0n)),
    };
  };
  return {
    coordinate,
    register,
    offset: (point, displacement) => {
      if (displacement.length !== 3 || displacement.some((value) => !Number.isFinite(value)))
        throw new Error("A reference material displacement needs three finite head-frame metres.");
      const facet = cell(locate(point));
      if (displacement.every((value) => value === 0))
        return { x: point.x, y: point.y };
      referenceHost ??= createHumanFaceSkinHost(referenceIndices, points);
      const origin = referenceHost.frameExact({
        triangle: facet.ordinal,
        weights: readHumanFaceSkinChartWeights(facet, point),
      }).point;
      return register(origin.map((value, axis) => value + displacement[axis]));
    },
    compile: (guide) => {
      if (guide.length < 2)
        throw new Error("A skin material course needs at least two ordered stations.");
      let triangle = locate(guide[0]);
      const spans: IHumanFaceSkinChartSpan[] = [];
      for (let at = 0; at + 1 < guide.length; at++)
        triangle = walkHumanFaceSkinChart({ from: guide[at], to: guide[at + 1], startTriangle: triangle, cell, frame, spans });
      return spans;
    },
  };
}
