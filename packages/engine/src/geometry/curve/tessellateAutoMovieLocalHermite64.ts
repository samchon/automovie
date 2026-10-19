import { AutoMovieBernsteinAlgebra64 as B } from "./AutoMovieBernsteinAlgebra64";
import { AutoMovieBernsteinGrid64 as G } from "./AutoMovieBernsteinGrid64";
import { AutoMovieCurveMath64 as V } from "./AutoMovieCurveMath64";
import { AutoMovieLocalHermiteField64 as F } from "./AutoMovieLocalHermiteField64";
import type { IAutoMovieLocalHermiteStream64 } from "./IAutoMovieLocalHermiteStream64";
import { planAutoMovieLocalHermite64 } from "./planAutoMovieLocalHermite64";
import { triangulateAutoMovieParameterCell64 } from "./triangulateAutoMovieParameterCell64";

type Plan = ReturnType<ReturnType<typeof planAutoMovieLocalHermite64>["plan"]>;
type Leaf = Plan["leaves"][number];
type Vertex = {
  index: number;
  position: B.Vec;
  normal: B.Vec;
  identity: string;
};
type Counts = IAutoMovieLocalHermiteStream64.Chunk["counts"];
type FaceRange = IAutoMovieLocalHermiteStream64.Chunk["faceRanges"][number];
type StreamInput = tessellateAutoMovieLocalHermite64.Input;
type StreamChunk = tessellateAutoMovieLocalHermite64.Chunk;
type StreamSummary = tessellateAutoMovieLocalHermite64.Summary;

/**
 * Stream a conforming open mesh of the local linear physical Hermite field.
 * Input courses are complete millimetre cubic curves with common normalized phase;
 * their direction and ordinary-run graph authority are supplied by the caller.
 * Positions/construction are published in metres. Indices are global, beginning at
 * vertexOffset, and may reference vertices published in earlier chunks of this run.
 * Every shared station uses the same actual vertex index and authoritative source jet.
 *
 * Exact tensor restrictions are refined until Muu/8+Muv/4+Mvv/8 <= toleranceMm,
 * using maxima of Bernstein second-derivative coefficient norms on each local unit
 * cell. Taylor's formula and barycentric coordinate variances <=1/4 bound the
 * same-parameter affine error of each parameter triangle in exact arithmetic.
 * Binary64 estimates are not outward-rounded certificates. This bound concerns the
 * new Hermite field, not source-surface distance, monotonicity or injectivity.
 * Bottom/top boundary chains are zipped and exterior hanging edges subdivided
 * using existing samples only. Identical translated polygons with matching phase
 * samples retain station-parallel face planes; general normal error is unbounded.
 *
 * Corners use right-sided analytic normals (u=1 left-sided); unresolved normals remain
 * zero with diagnostics. Zero-area triangles are counted and omitted. Resource limits
 * or unresolved interval arithmetic leave a diagnostic gap while other intervals survive.
 * Input admission failures reject the run. Ruled station interpolation is C0 only and
 * chooses right incident station normals, with the final station left-sided.
 * Quadratic mode C1 requires same-chart C1 input courses;
 * crease/G1 input does not acquire parametric C1 from station interpolation.
 *
 * @evidence contracts/common.md#principled-implementation Exact local Hermite tensors, Bernstein derivative bounds, adaptive binary restrictions and shared parameter-boundary triangulation preserve supplied curves and shared boundaries before binary64 rounding. Matching extruded polygons use fiber edges rather than an additional curved center.
 * @evidence contracts/common.md#clear-and-simple-design Two-interval lookahead owns station edge samples; local line registries insert hanging corners without propagating a global phase partition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source mesh, coordinate weld, omitted source knot, hidden limiter, arbitrary run split or fallback normal supplies the result.
 * @evidence contracts/common.md#meaningful-documentation States units, append-only indexing, approximation bound, derivative authority, failure effects and separate geometric qualifications.
 * @evidence contracts/performance.md#efficient-algorithms Field admission is O(N+S); local interval construction uses at most four source partitions. For L retained cells, refinement is O(L), line sorting O(L log L), and each ordered cell perimeter triangulates in linear sample count before evaluations and logarithmic line queries, without S times global-knot storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Adjacent interval plans share one station sample union and one position/normal/index owner. Local vertex identity, not coordinate equality, reuses internal boundary vertices.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The generator retains source admission, two bounded interval plans, current-interval vertices and two station edge maps, plus one vertex-bounded output chunk. Completed interval maps are released; yielded chunks belong to the consumer. Cancellation releases generator-owned state and no external handles exist.
 */
export function* tessellateAutoMovieLocalHermite64(
  input: StreamInput,
): Generator<StreamChunk, StreamSummary, void> {
  const prepared: ReturnType<typeof planAutoMovieLocalHermite64> =
    planAutoMovieLocalHermite64(input);
  const field: F.Prepared = prepared.field;
  const plan: (interval: number) => Plan = prepared.plan;
  const norm: (p: B.Vec) => number = (p: B.Vec): number => Math.hypot(...p);
  const cross: (a: B.Vec, b: B.Vec) => B.Vec = (a: B.Vec, b: B.Vec): B.Vec => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const edgeParameters: (p: Plan, end: boolean) => number[] = (
    p: Plan,
    end: boolean,
  ): number[] =>
    p.leaves
      .filter((c: Leaf): boolean => (end ? c.t1 === 1 : c.t0 === 0))
      .flatMap((c: Leaf): number[] => [c.u0, c.u1]);
  const zeros: () => Counts = (): Counts => ({
    cells: 0,
    vertices: 0,
    triangles: 0,
    omittedZeroAreaTriangles: 0,
    unresolvedVertexNormals: 0,
    maxErrorBoundMm: 0,
  });
  let current: Plan = plan(0),
    incoming: Map<number, Vertex> = new Map(),
    nextIndex: number = input.vertexOffset ?? 0;
  const summary: StreamSummary = {
    intervals: input.courses.length - 1,
    omittedIntervals: 0,
    vertices: 0,
    triangles: 0,
    diagnostics: [],
  };
  for (let j: number = 0; j < summary.intervals; j++) {
    const next: Plan = plan(j + 1);
    const endParameters: number[] = [
      ...new Set([
        ...edgeParameters(current, true),
        ...edgeParameters(next, false),
      ]),
    ].sort((a: number, b: number): number => a - b);
    const outgoing: Map<number, Vertex> = new Map();
    const fresh: () => StreamChunk = (): StreamChunk => ({
      interval: j,
      vertexStart: nextIndex,
      positions: [],
      normals: [],
      physicalVertexIds: [],
      indices: [],
      construction: [],
      diagnostics: [],
      counts: zeros(),
      faceRanges: [],
    });
    let chunk: StreamChunk = fresh();
    const qualify: () => void = (): void => {
      chunk.diagnostics.push(
        input.stationInterpolation === "ruled"
          ? "Ruled intervals have station C0 only. Shared station normals use the right incident secant, with the last station left-sided; normal display does not establish C1, immersion, injectivity or source fidelity."
          : "Analytic normals use right-sided course derivatives at knots; C1, immersion, injectivity and source-surface fidelity require separate qualification.",
      );
      if (chunk.counts.unresolvedVertexNormals)
        chunk.diagnostics.push(
          `Unresolved analytic vertex normals: ${chunk.counts.unresolvedVertexNormals}`,
        );
      if (chunk.counts.omittedZeroAreaTriangles)
        chunk.diagnostics.push(
          `Omitted zero-area triangles: ${chunk.counts.omittedZeroAreaTriangles}`,
        );
    };
    if (current.reason) {
      const reason: string = `interval.${j}: ${current.reason}`;
      chunk.diagnostics.push(reason);
      summary.diagnostics.push(reason);
      summary.omittedIntervals++;
      yield chunk;
      incoming = outgoing;
      current = next;
      continue;
    }
    try {
      const horizontal: Map<number, Set<number>> = new Map(),
        vertical: Map<number, Set<number>> = new Map();
      const add: (
        map: Map<number, Set<number>>,
        line: number,
        value: number,
      ) => void = (
        map: Map<number, Set<number>>,
        line: number,
        value: number,
      ): void => {
        if (!map.has(line)) map.set(line, new Set());
        map.get(line)!.add(value);
      };
      for (const cell of current.leaves)
        for (const u of [cell.u0, cell.u1])
          for (const t of [cell.t0, cell.t1]) {
            add(horizontal, t, u);
            add(vertical, u, t);
          }
      for (const u of incoming.keys()) add(horizontal, 0, u);
      for (const u of endParameters) add(horizontal, 1, u);
      const hs: Map<number, number[]> = new Map(
        [...horizontal].map(
          ([k, v]: [number, Set<number>]): [number, number[]] => [
            k,
            [...v].sort((a: number, b: number): number => a - b),
          ],
        ),
      );
      const vs: Map<number, number[]> = new Map(
        [...vertical].map(
          ([k, v]: [number, Set<number>]): [number, number[]] => [
            k,
            [...v].sort((a: number, b: number): number => a - b),
          ],
        ),
      );
      const between: (xs: number[], a: number, b: number) => number[] = (
        xs: number[],
        a: number,
        b: number,
      ): number[] => {
        let lo: number = 0,
          hi: number = xs.length;
        while (lo < hi) {
          const m: number = (lo + hi) >>> 1;
          if (xs[m]! < a) lo = m + 1;
          else hi = m;
        }
        const out: number[] = [];
        for (let k: number = lo; k < xs.length && xs[k]! <= b; k++)
          out.push(xs[k]!);
        return out;
      };
      const vertices: Map<string, Vertex> = new Map();
      const jet: (u: number, t: number) => F.Jet = (
        u: number,
        t: number,
      ): F.Jet => {
        if (t === 0 || t === 1) return field.station(j + t, u);
        let lo: number = 0,
          hi: number = current.cells.length - 1;
        while (lo < hi) {
          const m: number = Math.floor((lo + hi + 1) / 2);
          if (current.cells[m]!.u0 <= u) lo = m;
          else hi = m - 1;
        }
        const cell: F.Cell = current.cells[lo]!,
          x: number = (u - cell.u0) / (cell.u1 - cell.u0);
        const poly: B.Poly = G.gridValue(cell.grid, t);
        return {
          position: B.value(poly, x),
          coursePartial: B.value(B.tangent(poly, 1 / (cell.u1 - cell.u0)), x),
          stationPartial: B.value(
            G.gridValue(
              G.gridTangent(
                cell.grid,
                1 / (input.stations[j + 1]! - input.stations[j]!),
              ),
              t,
            ),
            x,
          ),
        };
      };
      const vertex: (u: number, t: number) => Vertex = (
        u: number,
        t: number,
      ): Vertex => {
        const key: string = `${u}:${t}`;
        const existing: Vertex | undefined =
          vertices.get(key) ??
          (t === 0 ? incoming.get(u) : t === 1 ? outgoing.get(u) : undefined);
        if (existing) return existing;
        const value: F.Jet = jet(u, t),
          n: B.Vec = cross(value.coursePartial, value.stationPartial),
          length: number = norm(n);
        if (!value.position.every(Number.isFinite))
          throw new Error("Nonfinite emitted field position");
        const regular: boolean = Number.isFinite(length) && length > 0;
        if (!Number.isSafeInteger(nextIndex + 1))
          throw new Error(
            "resource-unprocessed: global vertex index exceeds safe integer range",
          );
        const result: Vertex = {
          index: nextIndex++,
          position: V.scale(value.position, 0.001),
          normal: regular ? V.scale(n, 1 / length) : [0, 0, 0],
          identity:
            t === 0 || t === 1
              ? `${input.topologyDomain}:station:${j + t}:u:${u}`
              : `${input.topologyDomain}:interval:${j}:u:${u}:t:${t}`,
        };
        vertices.set(key, result);
        if (t === 1) outgoing.set(u, result);
        chunk.positions.push(...result.position);
        chunk.normals.push(...result.normal);
        chunk.physicalVertexIds.push(result.identity);
        chunk.counts.vertices++;
        summary.vertices++;
        if (!regular) chunk.counts.unresolvedVertexNormals++;
        return result;
      };
      for (const cell of current.leaves) {
        let counted: boolean = false;
        const boundary: [number, number][] = [
          ...between(hs.get(cell.t0)!, cell.u0, cell.u1).map(
            (u: number): [number, number] => [u, cell.t0],
          ),
          ...between(vs.get(cell.u1)!, cell.t0, cell.t1)
            .slice(1)
            .map((t: number): [number, number] => [cell.u1, t]),
          ...between(hs.get(cell.t1)!, cell.u0, cell.u1)
            .reverse()
            .slice(1)
            .map((u: number): [number, number] => [u, cell.t1]),
          ...between(vs.get(cell.u0)!, cell.t0, cell.t1)
            .reverse()
            .slice(1, -1)
            .map((t: number): [number, number] => [cell.u0, t]),
        ];
        for (const samples of triangulateAutoMovieParameterCell64(
          boundary,
          (sample: [number, number]): [number, number] => sample,
        )) {
          if (chunk.counts.vertices + 3 > input.maxVerticesPerChunk) {
            qualify();
            yield chunk;
            chunk = fresh();
          }
          const a: Vertex = vertex(...samples[0]),
            b: Vertex = vertex(...samples[1]),
            c: Vertex = vertex(...samples[2]);
          let range: FaceRange | undefined = chunk.faceRanges.at(-1);
          if (
            !range ||
            range.patch !== cell.patch ||
            range.u0 !== cell.u0 ||
            range.u1 !== cell.u1 ||
            range.t0 !== cell.t0 ||
            range.t1 !== cell.t1
          ) {
            range = {
              patch: cell.patch,
              u0: cell.u0,
              u1: cell.u1,
              t0: cell.t0,
              t1: cell.t1,
              triangleStart: chunk.indices.length / 3,
              triangleCount: 0,
              omittedZeroAreaTriangles: 0,
            };
            chunk.faceRanges.push(range);
            if (!counted) {
              chunk.counts.cells++;
              counted = true;
            }
            chunk.counts.maxErrorBoundMm = Math.max(
              chunk.counts.maxErrorBoundMm,
              cell.error,
            );
          }
          const area: number = norm(
            cross(V.sub(b.position, a.position), V.sub(c.position, a.position)),
          );
          if (!Number.isFinite(area))
            throw new Error("Nonfinite emitted triangle arithmetic");
          if (area === 0) {
            range.omittedZeroAreaTriangles++;
            chunk.counts.omittedZeroAreaTriangles++;
          } else {
            chunk.indices.push(a.index, b.index, c.index);
            range.triangleCount++;
            chunk.counts.triangles++;
            summary.triangles++;
          }
        }
      }
      const lines: [number, Map<number, Vertex>][] =
        incoming.size === 0
          ? [
              [
                j,
                new Map(
                  [...vertices]
                    .filter(([key]: [string, Vertex]): boolean =>
                      key.endsWith(":0"),
                    )
                    .map(([key, value]: [string, Vertex]): [number, Vertex] => [
                      Number(key.slice(0, -2)),
                      value,
                    ]),
                ),
              ],
              [j + 1, outgoing],
            ]
          : [[j + 1, outgoing]];
      for (const [station, edge] of lines)
        chunk.construction.push({
          id: input.courses[station]!.name,
          closed: false,
          points: [...edge]
            .sort(
              ([a]: [number, Vertex], [b]: [number, Vertex]): number => a - b,
            )
            .map(([, v]: [number, Vertex]): B.Vec => V.clone(v.position)),
        });
      qualify();
      yield chunk;
    } catch (error) {
      const message: string =
        error instanceof Error ? error.message : "unresolved emission";
      const reason: string = `interval.${j}: ${message.startsWith("resource-unprocessed:") ? message : `arithmetic-unprocessed: ${message}`}`;
      chunk.diagnostics.push(reason);
      summary.diagnostics.push(reason);
      summary.omittedIntervals++;
      qualify();
      yield chunk;
    }
    incoming = outgoing;
    current = next;
  }
  return summary;
}

/**
 * Streaming operator records; arrays in a yielded chunk transfer to its consumer.
 *
 * @evidence contracts/common.md#principled-implementation The types expose append-only global indexing and local approximation diagnostics.
 * @evidence contracts/common.md#clear-and-simple-design Function and records share one public name.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No type grants an embedding or original-source accuracy guarantee.
 * @evidence contracts/common.md#meaningful-documentation Records state units, ownership and indexing in the operator comment.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This namespace contains only types.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The types own no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The types retain no runtime data.
 */
export namespace tessellateAutoMovieLocalHermite64 {
  /** Original immutable physical run contract, owned by the stream record declaration. */
  export type Input = IAutoMovieLocalHermiteStream64.Input;
  /** Original append-only indexed chunk, with consumer-owned transferred arrays. */
  export type Chunk = IAutoMovieLocalHermiteStream64.Chunk;
  /** Original returned complete-run counts and explicit local omissions. */
  export type Summary = IAutoMovieLocalHermiteStream64.Summary;
}
