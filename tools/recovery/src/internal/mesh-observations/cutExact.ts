import { CutPoint } from "./CutPoint.ts";
import { IAutoMovieRecoveryIndexedMesh } from "./IAutoMovieRecoveryIndexedMesh.ts";
import { Plane } from "./Plane.ts";
import { Polyline } from "./Polyline.ts";
import { V3 } from "./V3.ts";

/**
 * Intersect a triangle surface with a plane without epsilon displacement or branch loss.
 * Equal signed zero vertices retain exact source positions. Coplanar triangles contribute
 * only qualified patch-boundary edges; binary64 signs are not exact predicates. Every graph edge is
 * visited once in maximal degree-two chains, so junctions terminate separate open chains.
 * Isolated tangent contacts return one-point open polylines instead of disappearing.
 * A supplied scalar chart shares the exact height samples used for PL topology;
 * its signs and edge fractions use height minus level without reprojecting an origin.
 *
 * @evidence contracts/common.md#principled-implementation Signed linear interpolation and canonical source-edge incidence build the plane intersection multigraph. Only two opposite coplanar incidences whose triangles lie on opposite sides of their edge cancel as a patch interior; edge visitation preserves every remaining contribution. Equal-position canonical aliases must already be qualified by registration.
 * @evidence contracts/common.md#clear-and-simple-design The operator owns source observation only and returns the existing Polyline contract; callers own source registration and generated-surface reconstruction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No distance epsilon, positional weld, invented closure, component selection or generated surface is introduced. Canonical identities must already be supplied by registration.
 * @evidence contracts/common.md#meaningful-documentation States exact-zero convention, coplanar boundaries, isolated contacts, maximal chains and binary64 predicate limits.
 * @evidence contracts/performance.md#efficient-algorithms For V positions and T triangles, signed distances, edge incidence and graph walks require expected O(V+T) time and O(V+T) temporary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Direct calls admit one source chart and reuse each visited vertex's signed difference and each canonical crossing within intersection. Repeated planes can share prepare admission for one immutable source; no global cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Graph maps and visited edges expire on return; only ordered physical observations with private source support addresses escape.
 */
export function cutExact(
  skin: IAutoMovieRecoveryIndexedMesh,
  plane: Plane,
  select?: (triangle: number) => boolean,
  chart?: { heights: readonly number[]; level: number },
): Polyline[] {
  const heights: readonly number[] =
    chart?.heights ??
    skin.vertices.map(
      (p: V3): number =>
        (p[0] - plane.origin[0]) * plane.n[0] +
        (p[1] - plane.origin[1]) * plane.n[1] +
        (p[2] - plane.origin[2]) * plane.n[2],
    );
  const level: number = chart?.level ?? 0;
  if (
    !Number.isFinite(level) ||
    heights.some((height: number): boolean => !Number.isFinite(height - level))
  )
    throw new Error("Exact section signed distances are unresolved");
  return cutExact.prepare(skin, heights)(plane, level, undefined, select);
}

/**
 * Reusable admission for deterministic source-plane observations.
 * Prepared queries consume one immutable source and scalar chart, with optional complete face candidates.
 *
 * @evidence contracts/common.md#principled-implementation Admission validates finite aligned positions and heights plus source addresses. Queries use the same scalar differences, face order, incidence graph and maximal-chain walk as direct calls. An external immutable interval index supplies complete inclusive candidates; completeness is a caller premise, not inferred from output.
 * @evidence contracts/common.md#clear-and-simple-design A closure retains one admitted source and lazily computes signed differences only at candidate vertices. There is one shared intersection implementation for indexed and complete traversal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Candidate order and addresses are checked; no largest component, epsilon, source-specific omission or global cache is introduced. Callers must supply every intersecting face and qualified canonical aliases.
 * @evidence contracts/common.md#meaningful-documentation Documents source immutability, scalar authority, inclusive candidate completeness, default traversal and binary64 predicate limits inherited from cutExact.
 * @evidence contracts/performance.md#efficient-algorithms Admission costs O(V+T) time with constant extra storage. For A queried faces, query work and temporary storage are expected O(A), including signed-difference memoization, multigraph construction and edge visitation. The complete path uses A=T; no whole-source query scan or initialization occurs with candidates.
 * @evidence contracts/performance.md#reuse-equivalent-work Finite source and address admission is reused only for the same immutable source and height chart. Each query owns its signed-difference cache; another source requires another closure.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the closure and its source references until extraction ends. Per-query maps expire after returning physical polylines; no cross-query result or mutable cache survives.
 */
export namespace cutExact {
  /**
   * Admit immutable source positions, incidence and scalar heights once.
   * The caller keeps every supplied array unchanged until all queries finish.
   * Each query accepts original face IDs in strictly increasing order; candidates
   * must include every face whose scalar interval contains level, including ties.
   * Omitting candidates scans every face. The optional filter sees original IDs.
   * The supplied plane retains the physical chart, while heights minus level own predicates.
   */
  export function prepare(
    skin: IAutoMovieRecoveryIndexedMesh,
    heights: readonly number[],
  ): (
    plane: Plane,
    level: number,
    candidates?: readonly number[],
    select?: (triangle: number) => boolean,
  ) => Polyline[] {
    if (
      skin.canon.length !== skin.vertices.length ||
      heights.length !== skin.vertices.length
    )
      throw new Error(
        "Section scalar chart does not align with finite source positions",
      );
    for (let i: number = 0; i < skin.vertices.length; i++)
      if (
        !Number.isFinite(heights[i]) ||
        skin.vertices[i]!.length !== 3 ||
        !skin.vertices[i]!.every(Number.isFinite) ||
        skin.canon[i]! < 0 ||
        skin.canon[i]! >= skin.vertices.length
      )
        throw new Error(
          "Finite positions and valid canonical source addresses are required",
        );
    for (const triangle of skin.triangles)
      if (
        triangle.length !== 3 ||
        triangle.some(
          (i: number): boolean =>
            !Number.isSafeInteger(i) || i < 0 || i >= skin.vertices.length,
        )
      )
        throw new Error(
          "Section face addresses do not align with source positions",
        );
    return (
      _plane: Plane,
      level: number,
      candidates?: readonly number[],
      select?: (triangle: number) => boolean,
    ): Polyline[] => {
      if (!Number.isFinite(level))
        throw new Error("A finite section level is required");
      const distances: Map<number, number> = new Map();
      const distance: (i: number) => number = (i: number): number => {
        const known: number | undefined = distances.get(i);
        if (known !== undefined) return known;
        const value: number = heights[i]! - level;
        if (!Number.isFinite(value))
          throw new Error("Exact section signed distances are unresolved");
        distances.set(i, value);
        return value;
      };
      const points: Map<string, CutPoint> = new Map();
      const segments: Map<string, [string, string]> = new Map();
      const contacts: Set<string> = new Set();
      const coplanarVertices: Set<string> = new Set();
      const coplanar: Map<
        string,
        { ends: [string, string]; triangle: number; opposite: V3 }[]
      > = new Map();
      const key: (a: string, b: string) => string = (
        a: string,
        b: string,
      ): string => JSON.stringify(a < b ? [a, b] : [b, a]);
      const vertex: (i: number) => string = (i: number): string => {
        const id: string = `v:${skin.canon[i]}`;
        if (!points.has(id))
          points.set(id, {
            p: [...skin.vertices[i]!],
            a: skin.canon[i]!,
            b: skin.canon[i]!,
            t: 0,
          });
        return id;
      };
      const crossing: (i: number, j: number) => string = (
        i: number,
        j: number,
      ): string => {
        if (skin.canon[i]! > skin.canon[j]!) [i, j] = [j, i];
        const id: string = `e:${skin.canon[i]},${skin.canon[j]}`;
        if (!points.has(id)) {
          const a: V3 = skin.vertices[i]!,
            b: V3 = skin.vertices[j]!;
          // Opposite finite signs permit a ratio without overflowing their difference.
          const da: number = Math.abs(distance(i)),
            db: number = Math.abs(distance(j));
          const ratio: number = Math.min(da, db) / Math.max(da, db);
          const t: number = da <= db ? ratio / (1 + ratio) : 1 / (1 + ratio);
          if (!(t > 0 && t < 1))
            throw new Error("Exact section edge fraction is unresolved");
          const p: V3 = [
            a[0] * (1 - t) + b[0] * t,
            a[1] * (1 - t) + b[1] * t,
            a[2] * (1 - t) + b[2] * t,
          ];
          if (!p.every(Number.isFinite))
            throw new Error("Exact section crossing is unresolved");
          points.set(id, { p, a: skin.canon[i]!, b: skin.canon[j]!, t });
        }
        return id;
      };
      let previous: number = -1;
      for (
        let fi: number = 0;
        fi < (candidates?.length ?? skin.triangles.length);
        fi++
      ) {
        const ti: number = candidates === undefined ? fi : candidates[fi]!;
        if (
          !Number.isSafeInteger(ti) ||
          ti <= previous ||
          ti >= skin.triangles.length
        )
          throw new Error(
            "Section candidates must be increasing original face addresses",
          );
        previous = ti;
        if (select && !select(ti)) continue;
        const t: [number, number, number] = skin.triangles[ti]!;
        if (t.every((i: number): boolean => distance(i) === 0)) {
          for (let k: number = 0; k < 3; k++) {
            const a: string = vertex(t[k]!),
              b: string = vertex(t[(k + 1) % 3]!);
            coplanarVertices.add(a);
            coplanarVertices.add(b);
            if (a === b) continue;
            const id: string = key(a, b);
            if (!coplanar.has(id)) coplanar.set(id, []);
            coplanar.get(id)!.push({
              ends: [a, b],
              triangle: ti,
              opposite: skin.vertices[t[(k + 2) % 3]!]!,
            });
          }
          continue;
        }
        const hits: Set<string> = new Set();
        for (let k: number = 0; k < 3; k++) {
          const i: number = t[k]!,
            j: number = t[(k + 1) % 3]!;
          if (distance(i) === 0) hits.add(vertex(i));
          if (
            (distance(i) < 0 && distance(j) > 0) ||
            (distance(i) > 0 && distance(j) < 0)
          )
            hits.add(crossing(i, j));
        }
        if (hits.size === 1) contacts.add([...hits][0]!);
        if (hits.size === 2) {
          const ends: [string, string] = [...hits] as [string, string];
          // Only a plane-coincident physical source edge is shared across faces.
          const onEdge: boolean =
            t.filter((i: number): boolean => distance(i) === 0).length === 2;
          if (ends[0] !== ends[1])
            segments.set(onEdge ? key(...ends) : `face:${ti}`, ends);
        }
      }
      for (const [id, patch] of coplanar) {
        let interior: boolean = false;
        if (
          patch.length === 2 &&
          patch[0]!.ends[0] === patch[1]!.ends[1] &&
          patch[0]!.ends[1] === patch[1]!.ends[0]
        ) {
          const a: V3 = points.get(patch[0]!.ends[0])!.p,
            b: V3 = points.get(patch[0]!.ends[1])!.p;
          const e: number[] = b.map(
            (x: number, i: number): number => x - a[i]!,
          );
          const u: number[] = patch[0]!.opposite.map(
            (x: number, i: number): number => x - a[i]!,
          );
          const v: number[] = patch[1]!.opposite.map(
            (x: number, i: number): number => x - a[i]!,
          );
          const cross: (p: number[], q: number[]) => number[] = (
            p: number[],
            q: number[],
          ): number[] => [
            p[1]! * q[2]! - p[2]! * q[1]!,
            p[2]! * q[0]! - p[0]! * q[2]!,
            p[0]! * q[1]! - p[1]! * q[0]!,
          ];
          const c: number[] = cross(e, u),
            d: number[] = cross(e, v);
          const sense: number = c.reduce(
            (sum: number, x: number, i: number): number => sum + x * d[i]!,
            0,
          );
          // Duplicate or overlapping coplanar faces do not bound one patch interior.
          interior = Number.isFinite(sense) && sense < 0;
        }
        if (interior) continue;
        if (patch.length === 1) segments.set(id, patch[0]!.ends);
        else
          for (let i: number = 0; i < patch.length; i++)
            segments.set(
              `coplanar:${patch[i]!.triangle}:${id}:${i}`,
              patch[i]!.ends,
            );
      }
      const adjacency: Map<string, { edge: string; next: string }[]> =
        new Map();
      for (const [edge, [a, b]] of segments) {
        if (!adjacency.has(a)) adjacency.set(a, []);
        if (!adjacency.has(b)) adjacency.set(b, []);
        adjacency.get(a)!.push({ edge, next: b });
        adjacency.get(b)!.push({ edge, next: a });
      }
      const visited: Set<string> = new Set();
      const output: Polyline[] = [];
      const walk: (
        start: string,
        first: { edge: string; next: string },
      ) => Polyline = (
        start: string,
        first: { edge: string; next: string },
      ): Polyline => {
        const keys: string[] = [start];
        let step: typeof first | undefined = first;
        while (step && !visited.has(step.edge)) {
          visited.add(step.edge);
          const current: string = step.next;
          if (current === start) {
            const closed: boolean = adjacency.get(start)!.length === 2;
            // A chain returning to a junction still has two junction terminals.
            // Keep its closing edge without publishing it as an independent loop.
            return {
              closed,
              pts: (closed ? keys : [...keys, start]).map(
                (id: string): CutPoint => points.get(id)!,
              ),
            };
          }
          keys.push(current);
          const neighbors: typeof adjacency extends Map<string, infer T>
            ? T
            : never = adjacency.get(current)!;
          if (neighbors.length !== 2) break;
          step = neighbors.find(
            (candidate: (typeof neighbors)[number]): boolean =>
              !visited.has(candidate.edge),
          );
        }
        return {
          closed: false,
          pts: keys.map((id: string): CutPoint => points.get(id)!),
        };
      };
      for (const [start, neighbors] of adjacency)
        if (neighbors.length !== 2)
          for (const first of neighbors)
            if (!visited.has(first.edge)) output.push(walk(start, first));
      for (const [start, neighbors] of adjacency)
        for (const first of neighbors)
          if (!visited.has(first.edge)) output.push(walk(start, first));
      for (const id of contacts)
        if (!adjacency.has(id) && !coplanarVertices.has(id))
          output.push({ closed: false, pts: [points.get(id)!] });
      return output;
    };
  }
}
