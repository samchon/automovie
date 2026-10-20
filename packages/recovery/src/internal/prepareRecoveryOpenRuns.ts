import type { IAutoMovieRecoveryMeshSections } from "../structures/mesh/IAutoMovieRecoveryMeshSections";
import type { IAutoMovieRecoveryOpenContinuation } from "../structures/curve/IAutoMovieRecoveryOpenContinuation";


type Node = { section: number; arc: number };
type Edge = {
  before: Node;
  after: Node;
  reverse: boolean;
  pairOrdinal: number;
};
/**
 * Admit saved open continuation and prepare one-to-one ordinary run ownership.
 *
 * @evidence contracts/common.md#principled-implementation The unchanged saved-arc range, overlap, orientation and complete adjacency checks construct the same incoming and outgoing maps.
 * @evidence contracts/common.md#clear-and-simple-design Graph admission is separated from engine streaming and immutable mesh publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing arithmetic, admission, coefficient authority and explicit failure meanings remain unchanged; no source geometry fallback is added.
 * @evidence contracts/common.md#meaningful-documentation States the owned stage and immutable inputs; output qualification remains with the caller.
 * @evidence contracts/performance.md#efficient-algorithms Each saved arc and ordinary pair is visited a constant number of times, retaining O(P+A) graph maps.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call reuses its prepared data for the same original lifetime without a new cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned maps live for one reconstruction call; source geometry is never read or retained.
 */
export function prepareRecoveryOpenRuns(
  bundle: IAutoMovieRecoveryMeshSections,
  graph: IAutoMovieRecoveryOpenContinuation,
  operator: "quadratic" | "ruled",
): {
  outgoing: Map<string, Edge>;
  incoming: Map<string, Edge>;
  pairs: number;
  unsupportedGroups: number;
  unsupportedGroupsWithOpenArcs: number;
} {
  const key: (n: Node) => string = (n: Node): string => `${n.section}:${n.arc}`;
  if (
    (operator !== "quadratic" && operator !== "ruled") ||
    !(
      bundle.policy.toleranceMm > 0 &&
      Number.isFinite(bundle.policy.toleranceMm)
    )
  )
    throw new Error(
      "Explicit interpolation and a positive physical approximation budget required",
    );
  if (
    graph.intervals.length !== bundle.reports.length - 1 ||
    graph.orientations.length !== bundle.reports.length ||
    !(graph.resolutionMm > 0 && Number.isFinite(graph.resolutionMm)) ||
    !Number.isSafeInteger(graph.maxVerticesPerRun) ||
    graph.maxVerticesPerRun < 4
  )
    throw new Error(
      "A complete source-free open-continuation sidecar is required",
    );
  const outgoing: Map<string, Edge> = new Map(),
    incoming: Map<string, Edge> = new Map();
  let pairs: number = 0,
    unsupportedGroups: number = 0,
    unsupportedGroupsWithOpenArcs: number = 0;
  const address: (section: number, arc: number) => void = (
    section: number,
    arc: number,
  ): void => {
    if (
      !Number.isSafeInteger(arc) ||
      arc < 0 ||
      arc >= bundle.reports[section]!.open.length
    )
      throw new Error(
        "Open curve address does not match saved coefficient authority",
      );
  };
  for (let i: number = 0; i < graph.intervals.length; i++) {
    const interval: IAutoMovieRecoveryOpenContinuation["intervals"][number] = graph.intervals[i]!;
    if (
      interval.beforeSection !== i ||
      interval.afterSection !== i + 1 ||
      graph.orientations[i]!.length !== bundle.reports[i]!.open.length
    )
      throw new Error(
        "Open continuation must address every adjacent saved section exactly",
      );
    const seen: [Set<number>, Set<number>] = [new Set(), new Set()];
    const claim: (side: 0 | 1, arc: number) => void = (
      side: 0 | 1,
      arc: number,
    ): void => {
      address(i + side, arc);
      if (seen[side].has(arc))
        throw new Error("Open adjacency records overlap");
      seen[side].add(arc);
    };
    for (const [pairOrdinal, pair] of interval.pairs.entries()) {
      claim(0, pair.before);
      claim(1, pair.after);
      if (typeof pair.reverseAfter !== "boolean")
        throw new Error("Endpoint reversal must be explicit");
      const edge: Edge = {
        before: { section: i, arc: pair.before },
        after: { section: i + 1, arc: pair.after },
        reverse: pair.reverseAfter,
        pairOrdinal,
      };
      if (outgoing.has(key(edge.before)) || incoming.has(key(edge.after)))
        throw new Error(
          "Ordinary open continuation has multiple incident strips",
        );
      outgoing.set(key(edge.before), edge);
      incoming.set(key(edge.after), edge);
      pairs++;
    }
    for (const group of interval.unresolved) {
      for (const arc of group.before) claim(0, arc);
      for (const arc of group.after) claim(1, arc);
      unsupportedGroups++;
      if (group.before.length || group.after.length)
        unsupportedGroupsWithOpenArcs++;
    }
    if (
      seen[0].size !== bundle.reports[i]!.open.length ||
      seen[1].size !== bundle.reports[i + 1]!.open.length
    )
      throw new Error(
        "Open adjacency omits a saved arc rather than reporting its local uncertainty",
      );
  }
  if (
    graph.orientations.at(-1)!.length !== bundle.reports.at(-1)!.open.length ||
    graph.orientations.some((row: (1 | -1 | null)[]): boolean =>
      row.some(
        (x: 1 | -1 | null): boolean => x !== null && x !== 1 && x !== -1,
      ),
    )
  )
    throw new Error("Orientation witnesses must align with saved arcs");
  return {
    outgoing,
    incoming,
    pairs,
    unsupportedGroups,
    unsupportedGroupsWithOpenArcs,
  };
}
