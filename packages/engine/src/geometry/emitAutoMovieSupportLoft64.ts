import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieSupportLoftPlan64 } from "./IAutoMovieSupportLoftPlan64";
import { AutoMovieBernsteinAlgebra64 as B } from "./curve/AutoMovieBernsteinAlgebra64";

/**
 * Tessellate planned ruled support faces with their own analytic normals.
 * A face nx X + nz Z = h(Y) has outward normal (nx,-dh/dY,nz), including
 * a vanishing edge endpoint where a tensor-chart derivative would collapse.
 * Plane-pair identity and algebraic event incidence own shared positions;
 * distinct faces retain their normal fans. Exact collapsed triangles are omitted.
 * Endpoint roundoff is checked separately from the requested chord tolerance.
 *
 * @evidence contracts/common.md#principled-implementation Planned cubic intersection curves define both side boundaries of every ruled face. Event triple incidence unites the corresponding endpoint identities; one canonical boundary position is reused exactly, and plane derivatives generate normals independently of any source or triangle field.
 * @evidence contracts/common.md#clear-and-simple-design This engine emitter owns newly allocated mesh, physical correspondence and sampled generating construction; the planner owns continuous incidence and the caller owns saved coefficients and admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate welding, source mesh/normal, per-row table or missing cap supplies output. Canonical endpoint disagreement beyond the stated binary64 conditioning allowance refuses; exact zero-area triangles remain counted omissions.
 * @evidence contracts/common.md#meaningful-documentation States metre coordinates, plane-derived normal limits, physical versus normal-fan identity, collapsed triangles, numerical boundary diagnostics and open ends.
 * @evidence contracts/performance.md#efficient-algorithms For C strips, P planes, S spans, E events and T triple-incidence visits at their stations, geometry emission costs O(C); canonical union lookups have a conservative O(T P squared) bound and compress visited paths. T is bounded by O((S+E+1) P cubed). Local point/union maps retain O(C + (S+E+1) P squared) records; maxVertices precedes output allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work The planner's fixed pair determinant serves every point roundoff bound. One canonical physical position is stored per station/pair-equivalence key and reused across adjoining faces and spans; each incident curve's own evaluation still checks its disagreement with that position. The same evaluated rows supply construction without another fit or mesh scan. Each triangle reads its three integer physical identities once and compares them pairwise instead of allocating an identity array and Set.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Mesh, physical source table, construction and diagnostics transfer to the caller; local point/union maps expire after this synchronous operation, without GPU, I/O or retained worker.
 */
export function emitAutoMovieSupportLoft64(input: {
  plan: IAutoMovieSupportLoftPlan64;
  topologyDomain: string;
  maxVertices: number;
}): {
  mesh: IAutoMovieMesh;
  construction: {
    id: string;
    closed: boolean;
    points: [number, number, number][];
  }[];
  maximumBoundaryDefectMeters: number;
  omittedCollapsedTriangles: number;
} {
  const plan: IAutoMovieSupportLoftPlan64 = input.plan;
  const mesh: IAutoMovieMesh = {
    positions: [],
    normals: [],
    indices: [],
    uvs: null,
    skin: null,
    physicalVertices: { sources: [], vertices: [] },
  };
  const construction: ReturnType<
    typeof emitAutoMovieSupportLoft64
  >["construction"] = [];
  const points: Map<
    string,
    { point: [number, number, number]; id: number; roundoff: number }
  > = new Map();
  const stations: Map<string, Map<string, string>> = new Map();
  let maximumBoundaryDefectMeters: number = 0,
    omittedCollapsedTriangles: number = 0;
  const parent: (map: Map<string, string>, key: string) => string = (
    map: Map<string, string>,
    key: string,
  ): string => {
    let root: string = key;
    while (map.has(root) && map.get(root) !== root) root = map.get(root)!;
    let cursor: string = key;
    while (map.has(cursor) && map.get(cursor) !== cursor) {
      const next: string = map.get(cursor)!;
      map.set(cursor, root);
      cursor = next;
    }
    return root;
  };
  for (let spanIndex: number = 0; spanIndex < plan.spans.length; spanIndex++) {
    const span: IAutoMovieSupportLoftPlan64["spans"][number] =
      plan.spans[spanIndex];
    const offsetScale: number = Math.max(
      ...span.field.offsets.flat().map(Math.abs),
    );
    const stationKey: (ordinal: number) => string = (
      ordinal: number,
    ): string =>
      ordinal === 0
        ? `boundary.${spanIndex}`
        : ordinal + 1 === span.stations.length
          ? `boundary.${spanIndex + 1}`
          : `span.${spanIndex}.event.${ordinal}`;
    const stationUnion: (ordinal: number) => Map<string, string> = (
      ordinal: number,
    ): Map<string, string> => {
      const key: string = stationKey(ordinal);
      const previous: Map<string, string> | undefined = stations.get(key);
      if (previous) return previous;
      const map: Map<string, string> = new Map();
      const triples: [number, number, number][] = [
        ...span.continuities,
        ...span.stations[ordinal].triples,
      ];
      if (ordinal === 0 && spanIndex > 0) {
        const neighbour: typeof span = plan.spans[spanIndex - 1];
        triples.push(
          ...neighbour.continuities,
          ...neighbour.stations.at(-1)!.triples,
        );
      }
      if (
        ordinal + 1 === span.stations.length &&
        spanIndex + 1 < plan.spans.length
      ) {
        const neighbour: typeof span = plan.spans[spanIndex + 1];
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
          .map((pair: string): string => parent(map, pair))
          .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0));
        for (const root of roots) map.set(root, roots[0]);
      }
      stations.set(key, map);
      return map;
    };
    const point: (
      pair: string,
      phase: number,
      station: string,
      union?: Map<string, string>,
    ) => { point: [number, number, number]; id: number; roundoff: number } = (
      pair: string,
      phase: number,
      station: string,
      union?: Map<string, string>,
    ): { point: [number, number, number]; id: number; roundoff: number } => {
      const representative: string = union ? parent(union, pair) : pair;
      const key: string = `${station}/${representative}`;
      const curve: NonNullable<ReturnType<typeof span.curves.get>> =
        span.curves.get(pair)!;
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
      const previous: ReturnType<typeof point> | undefined = points.get(key);
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
        if (!Number.isFinite(defect) || defect > roundoff + previous.roundoff)
          throw new Error(
            "unresolved-support-boundary: algebraic incidence exceeds roundoff allowance",
          );
        return previous;
      }
      if (!own.every(Number.isFinite))
        throw new Error("nonfinite-support-vertex");
      const id: number = mesh.physicalVertices!.sources.length;
      mesh.physicalVertices!.sources.push({ domain: input.topologyDomain, id });
      const result: ReturnType<typeof point> = { point: own, id, roundoff };
      points.set(key, result);
      return result;
    };
    for (let ordinal: number = 0; ordinal < span.intervals.length; ordinal++) {
      const interval: (typeof span.intervals)[number] = span.intervals[ordinal];
      const before: number = span.stations[interval.before].phase;
      const after: number = span.stations[interval.after].phase;
      const required: number =
        2 * interval.pairs.length * (interval.segments + 1);
      if (
        !Number.isSafeInteger(required) ||
        required + mesh.positions.length / 3 > input.maxVertices
      )
        throw new Error(
          "support-vertex-budget-exhausted: no partial mesh transferred",
        );
      const rows: ReturnType<typeof point>[][] = [];
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
        const ring: ReturnType<typeof point>[] = interval.pairs.map(
          (pair: string): ReturnType<typeof point> =>
            point(pair, phase, key, union),
        );
        if (
          new Set(
            ring.map((vertex: ReturnType<typeof point>): number => vertex.id),
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
          if (!Number.isFinite(length) || !(length > 0))
            throw new Error("nonfinite-support-normal");
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
            (row: (typeof rows)[number]): [number, number, number] =>
              row[edge].point,
          ),
        });
      for (const row of [0, interval.segments])
        construction.push({
          id: `section.${spanIndex}.${ordinal}.${row}`,
          closed: true,
          points: rows[row].map(
            (vertex: ReturnType<typeof point>): [number, number, number] =>
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
  };
}
