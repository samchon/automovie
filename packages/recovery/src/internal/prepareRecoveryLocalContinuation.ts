import type { IAutoMovieRecoveryTensorFamiliesInput } from "../structures/domain/IAutoMovieRecoveryTensorFamiliesInput";
import type { IAutoMovieRecoveryOpenContinuation } from "../structures/curve/IAutoMovieRecoveryOpenContinuation";

import type { realizeAutoMovieRecoveryAnalyticDomains } from "../reconstruction/realizeAutoMovieRecoveryAnalyticDomains";

type Node = { section: number; arc: number };
type Edge = {
  before: Node;
  after: Node;
  reverse: boolean;
  pairOrdinal: number;
};

/**
 * Prepare immutable saved open-arc continuation maps before local surface emission.
 *
 * @evidence contracts/common.md#principled-implementation Original adjacent-section addresses, nonoverlap claims, analytic ownership exclusions and orientation witnesses are admitted in their original order.
 * @evidence contracts/common.md#clear-and-simple-design This owner separates one admission or record responsibility from its existing caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The extraction preserves the original decisions, failure messages and iteration order without adding geometry, defaults or fallback authority.
 * @evidence contracts/common.md#meaningful-documentation States the owned inputs, output responsibility and retained qualification limits.
 * @evidence contracts/performance.md#efficient-algorithms For P pairs and A declared arc incidences, maps and seen sets retain O(P+A) expected time and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller consumes this one prepared result without repeating the extracted work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input bundle, graph and analytic ownership remain borrowed; returned local maps and key closure transfer to the reconstruction call.
 */
export function prepareRecoveryLocalContinuation(
  bundle: IAutoMovieRecoveryTensorFamiliesInput,
  graph: IAutoMovieRecoveryOpenContinuation,
  analytic: ReturnType<typeof realizeAutoMovieRecoveryAnalyticDomains>,
): {
  key: (n: Node) => string;
  outgoing: Map<string, Edge>;
  incoming: Map<string, Edge>;
  pairs: number;
  unsupportedGroups: number;
  unsupportedGroupsWithOpenArcs: number;
} {
  const key: (n: Node) => string = (n: Node): string => `${n.section}:${n.arc}`;
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
      if (analytic.openPairs.has(`${i}:${pairOrdinal}`)) continue;
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
    for (const [groupOrdinal, group] of interval.unresolved.entries()) {
      for (const arc of group.before) claim(0, arc);
      for (const arc of group.after) claim(1, arc);
      if (analytic.openUnresolved.has(`${i}:${groupOrdinal}`)) continue;
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
    key,
    outgoing,
    incoming,
    pairs,
    unsupportedGroups,
    unsupportedGroupsWithOpenArcs,
  };
}
