import type {
  IAutoMovieBicubicAtlas64,
  IAutoMovieBicubicAtlasPlan64,
  IAutoMovieBicubicAtlasRegistry64,
  IAutoMovieBicubicAtlasTessellation64,
  IAutoMovieCanonicalBoundary64,
  IAutoMovieCanonicalBoundaryPhase64,
} from "@automovie/interface";

import { AutoMovieCanonicalBoundary64 as Q } from "./AutoMovieCanonicalBoundary64";

type Patch = IAutoMovieBicubicAtlas64.Patch;
type Cell = IAutoMovieBicubicAtlas64.Cell;
type Plan = IAutoMovieBicubicAtlas64.Plan;
type Binding = IAutoMovieBicubicAtlas64.Binding;
/**
 * Register shared corners, exact edge phases and incidence before atlas
 * emission.
 */
export function AutoMovieBicubicAtlasRegistry64(
  input: IAutoMovieBicubicAtlasTessellation64.Input,
  prepared: IAutoMovieBicubicAtlasPlan64.IResult,
  SIDES: readonly (readonly number[])[],
  CORNERS: readonly (readonly [number, number, number])[],
): IAutoMovieBicubicAtlasRegistry64.IResult {
  const { plans, boundary }: IAutoMovieBicubicAtlasPlan64.IResult = prepared;
  const { authorities, bindings, root }: typeof boundary = boundary;
  const edges: Map<string, IAutoMovieBicubicAtlas64.Edge> = new Map(),
    corners: Map<string, IAutoMovieBicubicAtlas64.Corner> = new Map();
  const patchEdges: (IAutoMovieBicubicAtlas64.Edge | undefined)[][] = plans.map(
    (): (IAutoMovieBicubicAtlas64.Edge | undefined)[] => [],
  );
  const occurrences: (IAutoMovieBicubicAtlas64.Occurrence | undefined)[][] =
    plans.map((): (IAutoMovieBicubicAtlas64.Occurrence | undefined)[] => []);
  for (let p: number = 0; p < plans.length; p++) {
    const plan: Plan = plans[p]!,
      patch: Patch = input.patches[p]!;
    for (const [slot, u, v] of CORNERS)
      if (
        plan.cells.some(
          (c: Cell): boolean =>
            (u === 0 ? c.u0 === 0 : c.u1 === 1) &&
            (v === 0 ? c.v0 === 0 : c.v1 === 1),
        )
      ) {
        const key: string = root(`control:${patch.controlIds[slot]}`),
          corner: IAutoMovieBicubicAtlas64.Corner | undefined =
            corners.get(key);
        if (corner) corner.last = p;
        else
          corners.set(key, {
            owner: { patch: p, u, v },
            position: plan.grid[v * 3]![u * 3]!,
            last: p,
          });
      }
    for (let side: number = 0; side < 4; side++) {
      const touching: Cell[] = plan.cells.filter((c: Cell): boolean =>
        side === 0
          ? c.v0 === 0
          : side === 1
            ? c.u1 === 1
            : side === 2
              ? c.v1 === 1
              : c.u0 === 0,
      );
      if (!touching.length) continue;
      const ids: number[] = SIDES[side]!.map(
        (i: number): number => patch.controlIds[i]!,
      );
      const reverseIds: number[] = [...ids].reverse();
      let reverse: boolean = false;
      for (let i: number = 0; i < 4; i++)
        if (ids[i] !== reverseIds[i]) {
          reverse = ids[i]! > reverseIds[i]!;
          break;
        }
      const binding: Binding | undefined = bindings.get(`${patch.id}:${side}`);
      const canonical: number[] = binding
          ? [...authorities.get(binding.authority)!]
          : reverse
            ? reverseIds
            : ids,
        key: string = binding
          ? `authority:${binding.authority}`
          : canonical.join(","),
        occurrence: IAutoMovieBicubicAtlas64.Occurrence = {
          patch: p,
          side,
          reverse,
          requests: new Map(),
          binding,
        };
      let edge: IAutoMovieBicubicAtlas64.Edge | undefined = edges.get(key);
      if (!edge) {
        edge = {
          key,
          ids: canonical,
          incidents: [],
          phases: new Map(),
          samples: [],
          roundedCollisions: 0,
          vertices: new Map(),
          owner: occurrence,
          last: p,
        };
        edges.set(key, edge);
      }
      edge.incidents.push(occurrence);
      edge.last = p;
      patchEdges[p]![side] = edge;
      occurrences[p]![side] = occurrence;
      for (const c of touching)
        for (const t of side % 2 === 0 ? [c.u0, c.u1] : [c.v0, c.v1]) {
          const phase: IAutoMovieCanonicalBoundaryPhase64 = binding
            ? Q.phase(binding.start, binding.end, t)
            : Q.phase(reverse ? 1 : 0, reverse ? 0 : 1, t);
          edge.phases.set(phase.key, phase);
          occurrence.requests.set(phase.key, t);
        }
    }
  }
  // Numeric views order distinct doubles; exact dyadic keys break rounded ties.
  // The registered keys were admitted by Q.phase, so their bounded encoding is known.
  const comparePhase: (
    a: IAutoMovieCanonicalBoundaryPhase64,
    b: IAutoMovieCanonicalBoundaryPhase64,
  ) => number = (
    a: IAutoMovieCanonicalBoundaryPhase64,
    b: IAutoMovieCanonicalBoundaryPhase64,
  ): number => {
    if (a.value !== b.value) return a.value < b.value ? -1 : 1;
    const parts: { n: bigint; e: number }[] = [a, b].map(
      (q: IAutoMovieCanonicalBoundaryPhase64): { n: bigint; e: number } => {
        const split: number = q.key.indexOf("p");
        return {
          n: BigInt(`0x${q.key.slice(2, split)}`),
          e: Number(q.key.slice(split + 1)),
        };
      },
    );
    const exponent: number = Math.min(parts[0]!.e, parts[1]!.e),
      difference: bigint =
        (parts[0]!.n << BigInt(parts[0]!.e - exponent)) -
        (parts[1]!.n << BigInt(parts[1]!.e - exponent));
    return difference < 0n ? -1 : difference > 0n ? 1 : 0;
  };
  for (const edge of edges.values()) {
    edge.samples = [...edge.phases.values()].sort(comparePhase);
    edge.roundedCollisions = edge.samples.reduce(
      (
        count: number,
        q: IAutoMovieCanonicalBoundaryPhase64,
        i: number,
      ): number =>
        count + (i > 0 && edge.samples[i - 1]!.value === q.value ? 1 : 0),
      0,
    );
  }
  const excessiveIncidence: Set<string> = new Set();
  for (const edge of edges.values()) {
    const uses: [
      readonly {
        id: string;
        authority: string;
        start: number;
        end: number;
        walk: 1 | -1;
      }[],
    ][0] = edge.incidents.map(
      (
        occurrence: IAutoMovieBicubicAtlas64.Occurrence,
        i: number,
      ): [
        readonly {
          id: string;
          authority: string;
          start: number;
          end: number;
          walk: 1 | -1;
        }[],
      ][0][number] => ({
        id: `${i}`,
        authority: edge.key,
        start: occurrence.binding?.start ?? (occurrence.reverse ? 1 : 0),
        end: occurrence.binding?.end ?? (occurrence.reverse ? 0 : 1),
        walk: occurrence.side < 2 ? 1 : -1,
      }),
    );
    if (
      Q.partition(uses).atoms.some(
        (
          atom: IAutoMovieCanonicalBoundary64.IPartitionResult["atoms"][number],
        ): boolean => atom.uses.length > 2,
      )
    )
      excessiveIncidence.add(edge.key);
  }
  const retainedCoarseCells: number = plans.reduce(
    (sum: number, plan: Plan): number =>
      sum +
      plan.cells.filter((cell: Cell): boolean => cell.error > input.toleranceMm)
        .length,
    0,
  );
  const summary: IAutoMovieBicubicAtlasTessellation64.Summary = {
    patches: plans.length,
    omittedPatches: plans.filter((p: Plan): boolean =>
      p.diagnostics.some(
        (message: string): boolean =>
          !message.startsWith("approximation-unqualified:"),
      ),
    ).length,
    approximationQualified: retainedCoarseCells === 0,
    retainedCoarseCells,
    vertices: 0,
    triangles: 0,
    diagnostics: [],
  };
  const unprocessed: Set<number> = new Set(
    plans.flatMap((plan: Plan, p: number): number[] =>
      plan.diagnostics.some(
        (message: string): boolean =>
          !message.startsWith("approximation-unqualified:"),
      )
        ? [p]
        : [],
    ),
  );

  return {
    edges,
    corners,
    patchEdges,
    occurrences,
    comparePhase,
    excessiveIncidence,
    summary,
    unprocessed,
  };
}
