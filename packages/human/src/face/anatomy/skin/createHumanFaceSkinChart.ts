import { HumanExactFraction as F } from "../../../common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";
import type { IHumanFaceSkinChart } from "./IHumanFaceSkinChart";
import type { IHumanFaceSkinChartCoordinate } from "./IHumanFaceSkinChartCoordinate";
import type { IHumanFaceSkinChartInput } from "./IHumanFaceSkinChartInput";
import type { IHumanFaceSkinChartSpan } from "./IHumanFaceSkinChartSpan";
import type { IHumanFaceSkinChartTriangle } from "./IHumanFaceSkinChartTriangle";
import { readHumanFaceSkinChartWeights } from "./readHumanFaceSkinChartWeights";
import { walkHumanFaceSkinChart } from "./walkHumanFaceSkinChart";

/**
 * Compile a source-facet tangent chart on the actual current skin topology.
 * The seed's first edge U and Gram-orthogonalized second edge V define one
 * orthogonal projection. Neither basis is normalized, so exact rational dot
 * products suffice and no rounded square root enters edge events. Each
 * native vertex has one chart coordinate, independent of display UV seams.
 *
 * Ordered chart chords lift by actual native adjacency from the seed facet's
 * centroid. The centroid is a geometric start convention, not an anatomical
 * average. Registered support vertices must lift back to their own native
 * identities. Folds, vertical cells, boundaries, nonmanifold edges and
 * ambiguous continuation refuse rather than selecting a nearby sheet.
 *
 * This is an authored source chart, not global nearest projection, a
 * geodesic or a measured follicle path. A changed source/state invalidates
 * its chart and every course, shaft, contact and export that consumes it.
 * The chart captures its host and seed together with its owned geometry;
 * changing the caller's input record cannot replace one of those owners.
 * The brow assembly owns complete current-source rendered observation.
 *
 * @evidence contracts/common.md#principled-implementation Exact orthogonal chart coordinates and oriented native-cell inverses supply a piecewise affine path lift on the actual source topology; registered anchors verify its intended branch.
 * @evidence contracts/common.md#clear-and-simple-design Owns the immutable chart and native adjacency; exact inverse and chord walking have separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No UV weld, head-axis proxy, nearest-face preference, geodesic substitution or hidden source-coordinate change supplies support.
 * @evidence contracts/common.md#meaningful-documentation States frame construction, geometric seed convention, branch checks, unsupported domains and derivative invalidation.
 * @evidence contracts/modeling.md#spatial-conventions Native positions are head-frame metres; chart values are dimensionless coefficients of the unnormalized source-facet basis.
 * @evidence contracts/modeling.md#shared-boundaries One per-vertex chart definition and actual native adjacency keep inverse pieces on their shared source edges.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines a chart on an existing skin part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no public authoring trait.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The shaft consumer owns its render lattice.
 * @evidenceExclude contracts/modeling.md#rendered-observation The brow assembly owns coupled observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Source geometry and chart convention establish no clinical follicle trajectory.
 * @evidenceExclude contracts/anatomy.md#permitted-range Actual source support and contact owners admit construction.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal source coordinates do not extend the personal document schema.
 * @author Samchon
 */
export function createHumanFaceSkinChart(
  input: IHumanFaceSkinChartInput,
): IHumanFaceSkinChart {
  const host = input.host,
    seedTriangle = input.seedTriangle;
  const points = [...input.positions],
    indices = [...input.indices],
    count = points.length / 3;
  if (
    !Number.isInteger(count) ||
    points.some((value) => !Number.isFinite(value)) ||
    indices.length % 3 !== 0 ||
    indices.some((id) => !Number.isInteger(id) || id < 0 || id >= count) ||
    !Number.isInteger(seedTriangle) ||
    seedTriangle < 0 ||
    seedTriangle >= indices.length / 3 ||
    input.supportVertices.length === 0 ||
    input.supportVertices.some(
      (id) => !Number.isInteger(id) || id < 0 || id >= count,
    )
  )
    throw new Error(
      "A source skin chart needs finite native geometry, registered support and a current seed facet.",
    );
  const native = (vertex: number) =>
    [0, 1, 2].map((axis) => F.from(points[3 * vertex + axis]));
  const subtract = (
    a: readonly IHumanExactFraction[],
    b: readonly IHumanExactFraction[],
  ) => a.map((value, axis) => F.subtract(value, b[axis]));
  const dot = (
    a: readonly IHumanExactFraction[],
    b: readonly IHumanExactFraction[],
  ) =>
    a.reduce(
      (sum, value, axis) => F.add(sum, F.multiply(value, b[axis])),
      F.create(0n),
    );
  const seedIds = indices.slice(3 * seedTriangle, 3 * seedTriangle + 3),
    origin = native(seedIds[0]),
    u = subtract(native(seedIds[1]), origin),
    second = subtract(native(seedIds[2]), origin),
    uu = dot(u, u);
  if (uu.numerator <= 0n)
    throw new Error("A source skin chart seed has no native edge.");
  const shear = F.divide(dot(second, u), uu),
    v = second.map((value, axis) =>
      F.subtract(value, F.multiply(u[axis], shear)),
    ),
    vv = dot(v, v);
  if (vv.numerator <= 0n)
    throw new Error("A source skin chart seed has no native plane.");
  const projectExact = (
    point: readonly IHumanExactFraction[],
  ): IHumanFaceSkinChartCoordinate => {
    const delta = subtract(point, origin);
    return { x: F.divide(dot(delta, u), uu), y: F.divide(dot(delta, v), vv) };
  };
  const coordinates = new Map<number, IHumanFaceSkinChartCoordinate>();
  const coordinate = (vertex: number) => {
    let value = coordinates.get(vertex);
    if (value === undefined) {
      value = projectExact(native(vertex));
      coordinates.set(vertex, value);
    }
    return value;
  };
  const neighbors: number[][][] = Array.from(
    { length: indices.length / 3 },
    () => [[], [], []],
  );
  const edges = new Map<string, [number, number][]>();
  for (let triangle = 0; triangle < indices.length / 3; triangle++)
    for (let axis = 0; axis < 3; axis++) {
      const a = indices[3 * triangle + ((axis + 1) % 3)],
        b = indices[3 * triangle + ((axis + 2) % 3)],
        key = Math.min(a, b) + ":" + Math.max(a, b),
        entries = edges.get(key) ?? [];
      entries.push([triangle, axis]);
      edges.set(key, entries);
    }
  for (const entries of edges.values())
    for (const [triangle, axis] of entries)
      neighbors[triangle][axis] = entries
        .filter(([other]) => other !== triangle)
        .map(([other]) => other);
  const cells = new Map<number, IHumanFaceSkinChartTriangle>();
  const cell = (ordinal: number): IHumanFaceSkinChartTriangle => {
    let value = cells.get(ordinal);
    if (value === undefined) {
      const ids: [number, number, number] = [
        indices[3 * ordinal],
        indices[3 * ordinal + 1],
        indices[3 * ordinal + 2],
      ];
      if (ids.some((id, at) => host.corners(ordinal)[at] !== id))
        throw new Error(
          "Source skin chart and frame host disagree about native winding.",
        );
      const corners: [
        IHumanFaceSkinChartCoordinate,
        IHumanFaceSkinChartCoordinate,
        IHumanFaceSkinChartCoordinate,
      ] = [coordinate(ids[0]), coordinate(ids[1]), coordinate(ids[2])];
      const [a, b, c] = corners;
      const determinant = F.subtract(
        F.multiply(F.subtract(b.x, a.x), F.subtract(c.y, a.y)),
        F.multiply(F.subtract(b.y, a.y), F.subtract(c.x, a.x)),
      );
      value = {
        ordinal,
        vertices: ids,
        corners,
        determinant,
        neighbors: neighbors[ordinal],
      };
      cells.set(ordinal, value);
    }
    return value;
  };
  const seed = cell(seedTriangle),
    third = F.create(1n, 3n);
  const seedCoordinate: IHumanFaceSkinChartCoordinate = {
    x: F.multiply(
      seed.corners.reduce((sum, point) => F.add(sum, point.x), F.create(0n)),
      third,
    ),
    y: F.multiply(
      seed.corners.reduce((sum, point) => F.add(sum, point.y), F.create(0n)),
      third,
    ),
  };
  const frame = host.frameExact;
  for (const vertex of new Set(input.supportVertices)) {
    const target = coordinate(vertex),
      spans: IHumanFaceSkinChartSpan[] = [];
    const ordinal = walkHumanFaceSkinChart({
      from: seedCoordinate,
      to: target,
      startTriangle: seedTriangle,
      cell,
      frame,
      spans,
    });
    const support = cell(ordinal),
      weights = readHumanFaceSkinChartWeights(support, target);
    if (
      !support.vertices.some(
        (id, axis) =>
          id === vertex &&
          weights[axis].numerator === weights[axis].denominator &&
          weights.every(
            (weight, other) => axis === other || weight.numerator === 0n,
          ),
      )
    )
      throw new Error(
        "Source skin chart cannot retain registered band vertex identity: " +
          vertex,
      );
  }
  return {
    project: (point) => {
      if (point.length !== 3 || point.some((value) => !Number.isFinite(value)))
        throw new Error(
          "A source skin chart point needs three finite head-frame coordinates.",
        );
      return projectExact(point.map((value) => F.from(value)));
    },
    compile: (guide) => {
      if (guide.length < 2)
        throw new Error("A source skin chart course needs an ordered guide.");
      const connector: IHumanFaceSkinChartSpan[] = [];
      let ordinal = walkHumanFaceSkinChart({
        from: seedCoordinate,
        to: guide[0],
        startTriangle: seedTriangle,
        cell,
        frame,
        spans: connector,
      });
      const spans: IHumanFaceSkinChartSpan[] = [];
      for (let segment = 0; segment + 1 < guide.length; segment++)
        ordinal = walkHumanFaceSkinChart({
          from: guide[segment],
          to: guide[segment + 1],
          startTriangle: ordinal,
          cell,
          frame,
          spans,
        });
      return spans;
    },
  };
}
