import type {
  IAutoMovieConstructionPolyline,
  IAutoMovieMesh,
  IAutoMovieRealizeConvexSupportLoft,
} from "@automovie/interface";

import { AutoMovieBernsteinAlgebra64 as B } from "../../AutoMovieBernsteinAlgebra64";
import type { IAutoMovieSupportLoftPlan64 } from "./IAutoMovieSupportLoftPlan64";

/**
 * Tessellate planned ruled support faces with their own analytic normals. A
 * face nx X + nz Z = h(Y) has outward normal (nx,-dh/dY,nz), including a
 * vanishing edge endpoint where a tensor-chart derivative would collapse.
 * Plane-pair identity and algebraic event incidence own shared positions;
 * distinct faces retain their normal fans. Exact collapsed triangles are
 * omitted. Endpoint roundoff is checked separately from the requested chord
 * tolerance.
 */
export function emitAutoMovieSupportLoft64(
  plan: IAutoMovieSupportLoftPlan64,
  topologyDomain: string,
  maxVertices: number,
): IAutoMovieRealizeConvexSupportLoft.IResult {
  const mesh: IAutoMovieMesh = {
    positions: [],
    normals: [],
    indices: [],
    uvs: null,
    skin: null,
    physicalVertices: { sources: [], vertices: [] },
  };
  const construction: IAutoMovieConstructionPolyline.IMutable[] = [];
  const points: Map<string, IEmittedSupportLoftVertex> = new Map();
  const stations: Map<string, Map<string, string>> = new Map();
  let maximumBoundaryDefectMeters: number = 0,
    omittedCollapsedTriangles: number = 0;
  for (let spanIndex: number = 0; spanIndex < plan.spans.length; spanIndex++) {
    const span: IAutoMovieSupportLoftPlan64.ISpan = plan.spans[spanIndex];
    const offsetScale: number = Math.max(
      ...span.field.offsets.flat().map(Math.abs),
    );
    const stationKey = (ordinal: number): string =>
      ordinal === 0
        ? `boundary.${spanIndex}`
        : ordinal + 1 === span.stations.length
          ? `boundary.${spanIndex + 1}`
          : `span.${spanIndex}.event.${ordinal}`;
    const stationUnion = (ordinal: number): Map<string, string> => {
      const key: string = stationKey(ordinal);
      const previous: Map<string, string> | undefined = stations.get(key);
      if (previous) return previous;
      const map: Map<string, string> = new Map();
      const triples: [number, number, number][] = [
        ...span.continuities,
        ...span.stations[ordinal].triples,
      ];
      if (ordinal === 0 && spanIndex > 0) {
        const neighbour: IAutoMovieSupportLoftPlan64.ISpan =
          plan.spans[spanIndex - 1];
        triples.push(
          ...neighbour.continuities,
          ...neighbour.stations.at(-1)!.triples,
        );
      }
      if (
        ordinal + 1 === span.stations.length &&
        spanIndex + 1 < plan.spans.length
      ) {
        const neighbour: IAutoMovieSupportLoftPlan64.ISpan =
          plan.spans[spanIndex + 1];
        triples.push(
          ...neighbour.continuities,
          ...neighbour.stations[0].triples,
        );
      }
      for (const triple of triples) {
        const keys: string[] = [
          `${triple[0]}:${triple[1]}`,
          `${triple[0]}:${triple[2]}`,
          `${triple[1]}:${triple[2]}`,
        ].filter((pair: string): boolean => span.curves.has(pair));
        const roots: string[] = keys
          .map((pair: string): string => incidenceRepresentative(map, pair))
          .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0));
        for (const root of roots) map.set(root, roots[0]);
      }
      stations.set(key, map);
      return map;
    };
    const point = (
      pair: string,
      phase: number,
      station: string,
      union?: Map<string, string>,
    ): IEmittedSupportLoftVertex => {
      const representative: string = union
        ? incidenceRepresentative(union, pair)
        : pair;
      const key: string = `${station}/${representative}`;
      const curve: IAutoMovieSupportLoftPlan64.ICurve = span.curves.get(pair)!;
      const own: [number, number, number] = [
        B.scalar(curve.x, phase),
        phase === 0
          ? span.field.interval[0]
          : phase === 1
            ? span.field.interval[1]
            : span.field.interval[0] +
              phase * (span.field.interval[1] - span.field.interval[0]),
        B.scalar(curve.z, phase),
      ];
      const sine: number = Math.abs(curve.determinant);
      const roundoff: number =
        (2048 * Number.EPSILON * Math.max(...own.map(Math.abs), offsetScale)) /
        sine;
      const previous: IEmittedSupportLoftVertex | undefined = points.get(key);
      if (previous) {
        const defect: number = Math.hypot(
          own[0] - previous.point[0],
          own[1] - previous.point[1],
          own[2] - previous.point[2],
        );
        maximumBoundaryDefectMeters = Math.max(
          maximumBoundaryDefectMeters,
          defect,
        );
        if (defect > roundoff + previous.roundoff)
          throw new Error(
            "unresolved-support-boundary: algebraic incidence exceeds roundoff allowance",
          );
        return previous;
      }
      const id: number = mesh.physicalVertices!.sources.length;
      mesh.physicalVertices!.sources.push({ domain: topologyDomain, id });
      const result: IEmittedSupportLoftVertex = { point: own, id, roundoff };
      points.set(key, result);
      return result;
    };
    for (let ordinal: number = 0; ordinal < span.intervals.length; ordinal++) {
      const interval: IAutoMovieSupportLoftPlan64.IInterval =
        span.intervals[ordinal];
      const before: number = span.stations[interval.before].phase;
      const after: number = span.stations[interval.after].phase;
      const required: number =
        2 * interval.pairs.length * (interval.segments + 1);
      if (required + mesh.positions.length / 3 > maxVertices)
        throw new Error(
          "support-vertex-budget-exhausted: no partial mesh transferred",
        );
      const rows: IEmittedSupportLoftVertex[][] = [];
      for (let row: number = 0; row <= interval.segments; row++) {
        const phase: number =
          row === 0
            ? before
            : row === interval.segments
              ? after
              : before + ((after - before) * row) / interval.segments;
        const boundary: number | undefined =
          row === 0
            ? interval.before
            : row === interval.segments
              ? interval.after
              : undefined;
        const key: string =
          boundary === undefined
            ? `span.${spanIndex}.interval.${ordinal}.row.${row}`
            : stationKey(boundary);
        const union: Map<string, string> | undefined =
          boundary === undefined ? undefined : stationUnion(boundary);
        const ring: IEmittedSupportLoftVertex[] = interval.pairs.map(
          (pair: string): IEmittedSupportLoftVertex =>
            point(pair, phase, key, union),
        );
        if (
          new Set(
            ring.map((vertex: IEmittedSupportLoftVertex): number => vertex.id),
          ).size < 3
        )
          throw new Error(
            "unsupported-support-collapse: complete section degenerates at a boundary event",
          );
        if (rows.length && !(rows.at(-1)![0].point[1] < ring[0].point[1]))
          throw new Error(
            "unresolved-support-stations: physical Y increments are unrepresentable",
          );
        rows.push(ring);
      }
      for (let edge: number = 0; edge < interval.pairs.length; edge++) {
        const face: number = interval.faces[edge];
        const normal: readonly [number, number] = plan.normals[face];
        const derivative: number[] = B.dScalar(
          span.field.offsets[face],
          1 / (span.field.interval[1] - span.field.interval[0]),
        );
        const base: number = mesh.positions.length / 3;
        for (let row: number = 0; row <= interval.segments; row++) {
          const phase: number =
            row === 0
              ? before
              : row === interval.segments
                ? after
                : before + ((after - before) * row) / interval.segments;
          const dy: number = B.scalar(derivative, phase);
          const length: number = Math.hypot(normal[0], dy, normal[1]);
          if (!(length > 0)) throw new Error("nonfinite-support-normal");
          for (const vertex of [
            rows[row][edge],
            rows[row][(edge + 1) % interval.pairs.length],
          ]) {
            mesh.positions.push(...vertex.point);
            mesh.normals!.push(
              normal[0] / length,
              -dy / length,
              normal[1] / length,
            );
            mesh.physicalVertices!.vertices.push(vertex.id);
          }
        }
        for (let row: number = 0; row < interval.segments; row++)
          for (const triangle of [
            [base + 2 * row, base + 2 * row + 2, base + 2 * row + 1],
            [base + 2 * row + 1, base + 2 * row + 2, base + 2 * row + 3],
          ]) {
            const first: number = mesh.physicalVertices!.vertices[triangle[0]]!,
              second: number = mesh.physicalVertices!.vertices[triangle[1]]!,
              third: number = mesh.physicalVertices!.vertices[triangle[2]]!;
            if (first === second || second === third || third === first) {
              omittedCollapsedTriangles++;
              continue;
            }
            mesh.indices!.push(...triangle);
          }
      }
      for (let edge: number = 0; edge < interval.pairs.length; edge++)
        construction.push({
          id: `boundary.${spanIndex}.${ordinal}.${edge}`,
          closed: false,
          points: rows.map(
            (row: IEmittedSupportLoftVertex[]): [number, number, number] =>
              row[edge].point,
          ),
        });
      for (const row of [0, interval.segments])
        construction.push({
          id: `section.${spanIndex}.${ordinal}.${row}`,
          closed: true,
          points: rows[row].map(
            (vertex: IEmittedSupportLoftVertex): [number, number, number] =>
              vertex.point,
          ),
        });
    }
  }
  return {
    mesh,
    construction,
    maximumBoundaryDefectMeters,
    omittedCollapsedTriangles,
    events: plan.events,
    intervals: plan.spans.reduce(
      (sum: number, span: IAutoMovieSupportLoftPlan64.ISpan): number =>
        sum + span.intervals.length,
      0,
    ),
    faceChordBoundMeters: plan.tolerance,
    eventQualification: "binary64-numerical-not-certified",
  };
}

/** One cached physical position shared by its incident render vertices. */
interface IEmittedSupportLoftVertex {
  /** Canonical metre coordinates in the loft's local XYZ frame. */
  point: [number, number, number];

  /** Ordinal in the mesh's physical source table. */
  id: number;

  /** Metre error allowance for another construction of the same vertex. */
  roundoff: number;
}

/** Find the canonical key of an incidence component and compress its path. */
function incidenceRepresentative(
  map: Map<string, string>,
  key: string,
): string {
  let root: string = key;
  while (map.has(root) && map.get(root) !== root) root = map.get(root)!;
  let cursor: string = key;
  while (map.has(cursor) && map.get(cursor) !== cursor) {
    const next: string = map.get(cursor)!;
    map.set(cursor, root);
    cursor = next;
  }
  return root;
}
