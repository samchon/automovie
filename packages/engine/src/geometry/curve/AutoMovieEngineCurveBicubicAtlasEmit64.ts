import type {
  AutoMovieBernsteinGrid64,
  AutoMovieBernsteinPolynomial64,
  AutoMovieVector3Tuple,
  IAutoMovieBicubicAtlas64,
  IAutoMovieBicubicAtlasPlan64,
  IAutoMovieBicubicAtlasRegistry64,
  IAutoMovieBicubicAtlasTessellation64,
  IAutoMovieCanonicalBoundaryPhase64,
} from "@automovie/interface";

import { AutoMovieBernsteinAlgebra64 as B } from "./AutoMovieBernsteinAlgebra64";
import { AutoMovieBernsteinGrid64 as G } from "./AutoMovieBernsteinGrid64";
import { AutoMovieBicubicAtlasVertex64 } from "./internal/AutoMovieBicubicAtlasVertex64";
import { AutoMovieCanonicalBoundary64 as Q } from "./AutoMovieCanonicalBoundary64";
import { AutoMovieCurveMath64 as V } from "./AutoMovieCurveMath64";
import { triangulateAutoMovieParameterCell64 } from "./internal/triangulateAutoMovieParameterCell64";
import { overflowsBinary64 } from "../../math/internal/overflowsBinary64";

/**
 * Emit planned atlas patches with unchanged yield, allocation and cleanup
 * order.
 */
export namespace AutoMovieEngineCurveBicubicAtlasEmit64 {
  /**
   * Emit planned atlas patches with unchanged yield, allocation and cleanup
   * order.
   */
  export function* emit(
  input: IAutoMovieBicubicAtlasTessellation64.Input,
  prepared: IAutoMovieBicubicAtlasPlan64.IResult,
  registered: IAutoMovieBicubicAtlasRegistry64.IResult,
  SIDES: readonly (readonly number[])[],
  CORNERS: readonly (readonly [number, number, number])[],
): Generator<
  IAutoMovieBicubicAtlasTessellation64.Chunk,
  IAutoMovieBicubicAtlasTessellation64.Summary,
  void
> {
  const { plans, boundary, norm, cross }: IAutoMovieBicubicAtlasPlan64.IResult =
    prepared;
  const { root }: typeof boundary = boundary;
  const {
    corners,
    patchEdges,
    occurrences,
    excessiveIncidence,
    summary,
    unprocessed,
    comparePhase,
  }: IAutoMovieBicubicAtlasRegistry64.IResult = registered;
  const jet: (
    p: number,
    u: number,
    v: number,
  ) => {
    position: AutoMovieVector3Tuple;
    normal: AutoMovieVector3Tuple;
    regular: boolean;
  } = (
    p: number,
    u: number,
    v: number,
  ): {
    position: AutoMovieVector3Tuple;
    normal: AutoMovieVector3Tuple;
    regular: boolean;
  } => {
    const grid: AutoMovieBernsteinGrid64 = plans[p]!.grid,
      poly: AutoMovieBernsteinPolynomial64 = G.gridValue(grid, v),
      du: AutoMovieVector3Tuple = B.value(B.tangent(poly), u),
      dv: AutoMovieVector3Tuple = B.value(
        G.gridValue(G.gridTangent(grid), v),
        u,
      ),
      n: AutoMovieVector3Tuple = cross(du, dv),
      length: number = norm(n);
    // A cross product of finite tangents can overflow binary64.
    const regular: boolean = length > 0 && !overflowsBinary64(length);
    return {
      position: B.value(poly, u),
      normal: regular ? V.scale(n, 1 / length) : [0, 0, 0],
      regular,
    };
  };
  const edgeUV: (side: number, t: number) => [number, number] = (
    side: number,
    t: number,
  ): [number, number] =>
    side === 0 ? [t, 0] : side === 1 ? [1, t] : side === 2 ? [t, 1] : [0, t];
  const between: (xs: number[], a: number, b: number) => number[] = (
    xs: number[],
    a: number,
    b: number,
  ): number[] => {
    let lo: number = 0,
      hi: number = xs.length;
    while (lo < hi) {
      const m: number = Math.floor((lo + hi) / 2);
      if (xs[m]! < a) lo = m + 1;
      else hi = m;
    }
    const out: number[] = [];
    for (let i: number = lo; i < xs.length && xs[i]! <= b; i++)
      out.push(xs[i]!);
    return out;
  };
  const cursor: { nextIndex: number } = { nextIndex: input.vertexOffset ?? 0 };
  for (let p: number = 0; p < plans.length; p++) {
    const plan: Plan = plans[p]!,
      patch: Patch = input.patches[p]!;
    const fresh: () => IAutoMovieBicubicAtlasTessellation64.Chunk =
      (): IAutoMovieBicubicAtlasTessellation64.Chunk => ({
        patch: patch.id,
        vertexStart: cursor.nextIndex,
        positions: [],
        normals: [],
        physicalVertexIds: [],
        indices: [],
        ...(input.retainTriangleParameters ? { triangleParameters: [] } : {}),
        ...(input.retainPatchCoefficients && plan.grid.length === 4
          ? {
              patchCoefficients: plan.grid.map(
                (
                  row: AutoMovieBernsteinPolynomial64,
                ): [number, number, number][] =>
                  row.map(
                    (
                      point: AutoMovieVector3Tuple,
                    ): [number, number, number] => [
                      point[0],
                      point[1],
                      point[2],
                    ],
                  ),
              ),
            }
          : {}),
        faceRanges: [],
        diagnostics: [],
        counts: {
          cells: 0,
          retainedCoarseCells: 0,
          vertices: 0,
          triangles: 0,
          omittedZeroAreaTriangles: 0,
          unresolvedVertexNormals: 0,
          maxErrorBoundMm: 0,
        },
      });
    let chunk: IAutoMovieBicubicAtlasTessellation64.Chunk = fresh();
    const qualify: () => void = (): void => {
      chunk.diagnostics.push(
        "Canonical position identity is separate from analytic normal fans; legacy edges share their first retained owner. Outward orientation, G1, immersion, embedding and original-source fidelity are unverified.",
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
    for (const diagnostic of plan.diagnostics) {
      const reason: string = `${patch.id}: ${diagnostic}`;
      chunk.diagnostics.push(reason);
      summary.diagnostics.push(reason);
    }
    for (const diagnostic of boundary.diagnostics.get(patch.id) ?? []) {
      const reason: string = `${patch.id}: ${diagnostic}`;
      chunk.diagnostics.push(reason);
      summary.diagnostics.push(reason);
    }
    if (
      patchEdges[p]!.some(
        (edge: Edge | undefined): boolean =>
          edge !== undefined && excessiveIncidence.has(edge.key),
      )
    )
      chunk.diagnostics.push(
        "A canonical open boundary interval has more than two incidents; finite geometry remains without a manifold claim.",
      );
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
      for (const cell of plan.cells)
        for (const u of [cell.u0, cell.u1])
          for (const v of [cell.v0, cell.v1]) {
            add(horizontal, v, u);
            add(vertical, u, v);
          }
      const phaseMaps: Map<number, Phase[]>[] = [
        new Map(),
        new Map(),
        new Map(),
        new Map(),
      ];
      for (let side: number = 0; side < 4; side++) {
        const edge: Edge | undefined = patchEdges[p]![side],
          occurrence: Occurrence | undefined = occurrences[p]![side];
        if (!edge || !occurrence) continue;
        if (edge.roundedCollisions)
          chunk.diagnostics.push(
            `Rounded-coincident canonical phase views: ${edge.roundedCollisions}; exact identities remain distinct`,
          );
        const binding: Occurrence["binding"] = occurrence.binding;
        for (const phase of edge.samples) {
          // Exact interval membership is checked by local(), not by its rounded view.
          if (
            binding &&
            (comparePhase(phase, Q.phase(binding.start, binding.end, 0)) *
              Math.sign(binding.end - binding.start) <
              0 ||
              comparePhase(phase, Q.phase(binding.start, binding.end, 1)) *
                Math.sign(binding.end - binding.start) >
                0)
          )
            continue;
          let t: number;
          try {
            t =
              occurrence.requests.get(phase.key) ??
              (binding
                ? Q.local(binding.start, binding.end, phase)
                : occurrence.reverse
                  ? 1 - phase.value
                  : phase.value);
          } catch (error) {
            const reason: string = `${patch.id}: arithmetic-unprocessed: boundary request ${phase.key}: ${error instanceof Error ? error.message : "unrepresentable inverse"}`;
            chunk.diagnostics.push(reason);
            summary.diagnostics.push(reason);
            if (!unprocessed.has(p)) {
              unprocessed.add(p);
              summary.omittedPatches++;
            }
            continue;
          }
          const phases: Phase[] = phaseMaps[side]!.get(t) ?? [];
          phases.push(phase);
          phaseMaps[side]!.set(t, phases);
          if (side % 2 === 0) add(horizontal, side === 0 ? 0 : 1, t);
          else add(vertical, side === 1 ? 1 : 0, t);
        }
        for (const phases of phaseMaps[side]!.values())
          phases.sort(
            (a: Phase, b: Phase): number =>
              comparePhase(a, b) *
              (binding
                ? Math.sign(binding.end - binding.start)
                : occurrence.reverse
                  ? -1
                  : 1),
          );
      }
      const hs: Map<number, number[]> = new Map(
        [...horizontal].map(
          ([k, s]: [number, Set<number>]): [number, number[]] => [
            k,
            [...s].sort((a: number, b: number): number => a - b),
          ],
        ),
      );
      const vs: Map<number, number[]> = new Map(
        [...vertical].map(
          ([k, s]: [number, Set<number>]): [number, number[]] => [
            k,
            [...s].sort((a: number, b: number): number => a - b),
          ],
        ),
      );
      const local: Map<string, Vertex> = new Map();
      const vertex: (sample: Sample) => Vertex = AutoMovieBicubicAtlasVertex64(
        input,
        prepared,
        registered,
        p,
        patch,
        phaseMaps,
        local,
        cursor,
        (): IAutoMovieBicubicAtlasTessellation64.Chunk => chunk,
        jet,
        edgeUV,
        SIDES,
      );
      for (const cell of plan.cells) {
        const coordinates: [number, number][] = [
          ...between(hs.get(cell.v0)!, cell.u0, cell.u1).map(
            (u: number): [number, number] => [u, cell.v0],
          ),
          ...between(vs.get(cell.u1)!, cell.v0, cell.v1)
            .slice(1)
            .map((v: number): [number, number] => [cell.u1, v]),
          ...between(hs.get(cell.v1)!, cell.u0, cell.u1)
            .reverse()
            .slice(1)
            .map((u: number): [number, number] => [u, cell.v1]),
          ...between(vs.get(cell.u0)!, cell.v0, cell.v1)
            .reverse()
            .slice(1, -1)
            .map((v: number): [number, number] => [cell.u0, v]),
        ];
        const boundary: Sample[] = coordinates.flatMap(
          ([u, v]: [number, number]): Sample[] => {
            const sides: number[] = [
              v === 0 ? 0 : -1,
              u === 1 ? 1 : -1,
              v === 1 ? 2 : -1,
              u === 0 ? 3 : -1,
            ].filter((side: number): boolean => side >= 0);
            const side: number =
              sides.find(
                (candidate: number): boolean =>
                  occurrences[p]![candidate]?.binding !== undefined,
              ) ??
              sides[0] ??
              -1;
            const phases: Phase[] | undefined =
              side < 0
                ? undefined
                : phaseMaps[side]!.get(side % 2 === 0 ? u : v);
            if (!phases) return [{ u, v }];
            return (side < 2 ? phases : [...phases].reverse()).map(
              (phase: Phase): Sample => ({ u, v, side, phase }),
            );
          },
        );
        let counted: boolean = false;
        for (const samples of triangulateAutoMovieParameterCell64(
          boundary,
          (sample: Sample): [number, number] => [sample.u, sample.v],
        )) {
          if (chunk.counts.vertices + 3 > input.maxVerticesPerChunk) {
            qualify();
            yield chunk;
            chunk = fresh();
          }
          const a: Vertex = vertex(samples[0]),
            b: Vertex = vertex(samples[1]),
            c: Vertex = vertex(samples[2]);
          let range: Range | undefined = chunk.faceRanges.at(-1);
          if (
            !range ||
            range.u0 !== cell.u0 ||
            range.u1 !== cell.u1 ||
            range.v0 !== cell.v0 ||
            range.v1 !== cell.v1
          ) {
            range = {
              patch: patch.id,
              u0: cell.u0,
              u1: cell.u1,
              v0: cell.v0,
              v1: cell.v1,
              approximationBoundMm: cell.error,
              triangleStart: chunk.indices.length / 3,
              triangleCount: 0,
              omittedZeroAreaTriangles: 0,
            };
            chunk.faceRanges.push(range);
            if (!counted) {
              counted = true;
              chunk.counts.cells++;
              if (cell.error > input.toleranceMm)
                chunk.counts.retainedCoarseCells++;
            }
            chunk.counts.maxErrorBoundMm = Math.max(
              chunk.counts.maxErrorBoundMm,
              cell.error,
            );
          }
          const area: number = norm(
            cross(V.sub(b.position, a.position), V.sub(c.position, a.position)),
          );
          // A norm is nonnegative unless its cross product overflowed.
          if (!(area >= 0) || overflowsBinary64(area))
            throw new Error("nonfinite triangle arithmetic");
          if (area === 0) {
            chunk.counts.omittedZeroAreaTriangles++;
            range.omittedZeroAreaTriangles++;
          } else {
            chunk.indices.push(a.index, b.index, c.index);
            if (chunk.triangleParameters !== undefined)
              for (const sample of samples)
                chunk.triangleParameters.push(sample.u, sample.v);
            chunk.counts.triangles++;
            range.triangleCount++;
            summary.triangles++;
          }
        }
      }
    } catch (error) {
      const message: string =
        error instanceof Error ? error.message : "unresolved emission";
      const reason: string = `${patch.id}: ${message.startsWith("resource-unprocessed:") ? message : `arithmetic-unprocessed: ${message}`}`;
      chunk.diagnostics.push(reason);
      summary.diagnostics.push(reason);
      if (!unprocessed.has(p)) {
        unprocessed.add(p);
        summary.omittedPatches++;
      }
    }
    qualify();
    yield chunk;
    for (const edge of patchEdges[p]!)
      if (edge?.last === p) edge.vertices.clear();
    for (const [slot] of CORNERS) {
      const key: string = root(`control:${patch.controlIds[slot]}`);
      if (corners.get(key)?.last === p) corners.delete(key);
    }
  }
  return summary;
}

type Patch = IAutoMovieBicubicAtlas64.Patch;

type Range = IAutoMovieBicubicAtlas64.Range;

type Plan = IAutoMovieBicubicAtlas64.Plan;

type Occurrence = IAutoMovieBicubicAtlas64.Occurrence;
type Vertex = IAutoMovieBicubicAtlas64.Vertex;
type Phase = IAutoMovieCanonicalBoundaryPhase64;
type Sample = IAutoMovieBicubicAtlas64.Sample;
type Edge = IAutoMovieBicubicAtlas64.Edge;

}
