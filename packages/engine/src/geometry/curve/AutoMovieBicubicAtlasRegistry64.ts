import type { AutoMovieBicubicAtlasPlan64 } from "./AutoMovieBicubicAtlasPlan64";
import type { AutoMovieBicubicAtlasTypes64 } from "./AutoMovieBicubicAtlasTypes64";
import { AutoMovieCanonicalBoundary64 as Q } from "./AutoMovieCanonicalBoundary64";

type Patch = AutoMovieBicubicAtlasTypes64["Patch"];
type AtlasInput = AutoMovieBicubicAtlasTypes64["AtlasInput"];

type AtlasSummary = AutoMovieBicubicAtlasTypes64["AtlasSummary"];
type Cell = AutoMovieBicubicAtlasTypes64["Cell"];
type Plan = AutoMovieBicubicAtlasTypes64["Plan"];
type Binding = AutoMovieBicubicAtlasTypes64["Binding"];
type Occurrence = AutoMovieBicubicAtlasTypes64["Occurrence"];

type Phase = AutoMovieBicubicAtlasTypes64["Phase"];

type Edge = AutoMovieBicubicAtlasTypes64["Edge"];
type Corner = AutoMovieBicubicAtlasTypes64["Corner"];
/**
 * Register shared corners, exact edge phases and incidence before atlas emission.
 *
 * @evidence contracts/common.md#principled-implementation Original patch order, phase-key comparison and boundary atom incidence determine unchanged first and last owners.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Visits planned boundary cells, sorts each exact phase population and checks its declared incidents.
 * @evidence contracts/performance.md#reuse-equivalent-work One registry is reused across every emitted patch and normal fan.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps stay generator-owned until their original last-owner cleanup; the summary remains one shared mutable record.
 */
export function AutoMovieBicubicAtlasRegistry64(
  input: AtlasInput,
  prepared: ReturnType<typeof AutoMovieBicubicAtlasPlan64>,
  SIDES: readonly (readonly number[])[],
  CORNERS: readonly (readonly [number, number, number])[],
): {
  edges: Map<string, Edge>;
  corners: Map<string, Corner>;
  patchEdges: (Edge | undefined)[][];
  occurrences: (Occurrence | undefined)[][];
  comparePhase: (a: Phase, b: Phase) => number;
  excessiveIncidence: Set<string>;
  summary: AtlasSummary;
  unprocessed: Set<number>;
} {
  const { plans, boundary }: ReturnType<typeof AutoMovieBicubicAtlasPlan64> =
    prepared;
  const { authorities, bindings, root }: typeof boundary = boundary;
  const edges: Map<string, Edge> = new Map(),
    corners: Map<string, Corner> = new Map();
  const patchEdges: (Edge | undefined)[][] = plans.map(
    (): (Edge | undefined)[] => [],
  );
  const occurrences: (Occurrence | undefined)[][] = plans.map(
    (): (Occurrence | undefined)[] => [],
  );
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
          corner: Corner | undefined = corners.get(key);
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
        occurrence: Occurrence = {
          patch: p,
          side,
          reverse,
          requests: new Map(),
          binding,
        };
      let edge: Edge | undefined = edges.get(key);
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
          const phase: ReturnType<typeof Q.phase> = binding
            ? Q.phase(binding.start, binding.end, t)
            : Q.phase(reverse ? 1 : 0, reverse ? 0 : 1, t);
          edge.phases.set(phase.key, phase);
          occurrence.requests.set(phase.key, t);
        }
    }
  }
  // Numeric views order distinct doubles; exact dyadic keys break rounded ties.
  // The registered keys were admitted by Q.phase, so their bounded encoding is known.
  const comparePhase: (a: Phase, b: Phase) => number = (
    a: Phase,
    b: Phase,
  ): number => {
    if (a.value !== b.value) return a.value < b.value ? -1 : 1;
    const parts: { n: bigint; e: number }[] = [a, b].map(
      (q: Phase): { n: bigint; e: number } => {
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
      (count: number, q: Phase, i: number): number =>
        count + (i > 0 && edge.samples[i - 1]!.value === q.value ? 1 : 0),
      0,
    );
  }
  const excessiveIncidence: Set<string> = new Set();
  for (const edge of edges.values()) {
    const uses: Parameters<typeof Q.partition>[0] = edge.incidents.map(
      (
        occurrence: Occurrence,
        i: number,
      ): Parameters<typeof Q.partition>[0][number] => ({
        id: `${i}`,
        authority: edge.key,
        start: occurrence.binding?.start ?? (occurrence.reverse ? 1 : 0),
        end: occurrence.binding?.end ?? (occurrence.reverse ? 0 : 1),
        walk: occurrence.side < 2 ? 1 : -1,
      }),
    );
    if (
      Q.partition(uses).atoms.some(
        (atom: ReturnType<typeof Q.partition>["atoms"][number]): boolean =>
          atom.uses.length > 2,
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
  const summary: AtlasSummary = {
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
