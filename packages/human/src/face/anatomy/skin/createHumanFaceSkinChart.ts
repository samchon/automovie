import { HumanExactFraction as F } from "../../../common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";
import { createHumanFaceAttachmentChartHost } from "../eye/createHumanFaceAttachmentChartHost";
import type { IHumanFaceSkinChart } from "./IHumanFaceSkinChart";
import type { IHumanFaceSkinChartCoordinate } from "./IHumanFaceSkinChartCoordinate";
import type { IHumanFaceSkinChartInput } from "./IHumanFaceSkinChartInput";
import type { IHumanFaceSkinChartSpan } from "./IHumanFaceSkinChartSpan";
import type { IHumanFaceSkinChartTriangle } from "./IHumanFaceSkinChartTriangle";
import { readHumanFaceSkinChartWeights } from "./readHumanFaceSkinChartWeights";
import { walkHumanFaceSkinChart } from "./walkHumanFaceSkinChart";

/**
 * Read one publisher-registered material disk through the current skin host.
 * Native vertex identities, positive material coordinates and actual triangle
 * adjacency are fixed by the source generation. Identity or performance changes
 * only the host frame, never the material inverse or selected sheet. The first
 * registered anchor's first incident disk facet supplies the walking seed.
 *
 * A reference-metre guide displacement is converted by the least-squares
 * differential of its source facet: E(E^T E)^-1 E^T removes the normal component,
 * and the same edge coefficients advance the material coordinates. This local
 * affine convention does not prescribe a finite geodesic or clinical crease.
 * A singular reference facet, missing registration or uncovered guide refuses.
 * Source/topology/reference changes invalidate every consuming course and asset.
 *
 * @evidence contracts/common.md#principled-implementation Registered positive material coordinates and exact native-cell path lifting preserve correspondence; the reference Gram solve separates dimensionless coordinates from physical displacements.
 * @evidence contracts/common.md#clear-and-simple-design One immutable material disk owns coordinates, reference conversion and native continuation; the current host alone supplies performed geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No current-state projection, nearby sheet, tolerance, clamp or altered source geometry supplies correspondence.
 * @evidence contracts/common.md#meaningful-documentation States source registration, seed, reference differential, units, refusal and invalidation.
 * @evidence contracts/modeling.md#spatial-conventions Reference displacements and host positions are canonical head-frame metres; material coordinates and barycentrics are dimensionless.
 * @evidence contracts/modeling.md#shared-boundaries Exact source incidence and one coordinate per native vertex preserve each joined material interval on actual shared edges.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reads a registered disk on existing skin.
 * @evidenceExclude contracts/modeling.md#parameter-channels The relief and brow owners retain numerical input meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits internal course intervals only.
 * @evidenceExclude contracts/modeling.md#rendered-observation Consuming relief and brow assemblies observe the final output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Source registration and local differential are geometric conventions, not clinical tissue measurements.
 * @evidenceExclude contracts/anatomy.md#permitted-range Actual source coverage and downstream contact retain admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Introduces no personal source vertex or sculpt input.
 * @author Samchon
 */
export function createHumanFaceSkinChart(
  input: IHumanFaceSkinChartInput,
): IHumanFaceSkinChart {
  const host = input.host;
  const supports = [...input.supportVertices];
  const source = input.surface;
  const registered = source.materialCharts?.[input.domain];
  if (registered === undefined || supports.length === 0 ||
    supports.some((vertex) => !registered.vertices.includes(vertex)))
    throw new Error("A skin course needs its registered material disk covering every native anchor: " + input.domain);
  const registration = structuredClone(registered);
  createHumanFaceAttachmentChartHost(registration, source);
  const points = [...source.positions];
  if (points.length % 3 !== 0 || points.some((value) => !Number.isFinite(value)))
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
  const locate = (point: IHumanFaceSkinChartCoordinate): number =>
    walkHumanFaceSkinChart({ from: origin, to: point, startTriangle: seedTriangle, cell, frame, spans: [] });
  for (const vertex of supports) {
    const point = coordinate(vertex);
    const support = cell(locate(point));
    const weights = readHumanFaceSkinChartWeights(support, point);
    if (!support.vertices.some((id, axis) => id === vertex && weights[axis].numerator === weights[axis].denominator && weights.every((weight, other) => other === axis || weight.numerator === 0n)))
      throw new Error("A skin material chart cannot retain registered native anchor identity: " + vertex);
  }
  const native = (vertex: number): IHumanExactFraction[] =>
    [0, 1, 2].map((axis) => F.from(points[3 * vertex + axis]));
  const subtract = (a: readonly IHumanExactFraction[], b: readonly IHumanExactFraction[]) =>
    a.map((value, axis) => F.subtract(value, b[axis]));
  const dot = (a: readonly IHumanExactFraction[], b: readonly IHumanExactFraction[]) =>
    a.reduce((sum, value, axis) => F.add(sum, F.multiply(value, b[axis])), F.create(0n));
  return {
    coordinate,
    offset: (point, displacement) => {
      if (displacement.length !== 3 || displacement.some((value) => !Number.isFinite(value)))
        throw new Error("A reference material displacement needs three finite head-frame metres.");
      const facet = cell(locate(point));
      const [a, b, c] = facet.vertices.map(native);
      const u = subtract(b, a), v = subtract(c, a);
      const uu = dot(u, u), uv = dot(u, v), vv = dot(v, v);
      const determinant = F.subtract(F.multiply(uu, vv), F.multiply(uv, uv));
      if (determinant.numerator <= 0n)
        throw new Error("A source-reference material differential needs a nonsingular native facet.");
      const delta = displacement.map((value) => F.from(value));
      const du = dot(u, delta), dv = dot(v, delta);
      const s = F.divide(F.subtract(F.multiply(vv, du), F.multiply(uv, dv)), determinant);
      const t = F.divide(F.subtract(F.multiply(uu, dv), F.multiply(uv, du)), determinant);
      const [qa, qb, qc] = facet.corners;
      return {
        x: F.add(point.x, F.add(F.multiply(s, F.subtract(qb.x, qa.x)), F.multiply(t, F.subtract(qc.x, qa.x)))),
        y: F.add(point.y, F.add(F.multiply(s, F.subtract(qb.y, qa.y)), F.multiply(t, F.subtract(qc.y, qa.y)))),
      };
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
