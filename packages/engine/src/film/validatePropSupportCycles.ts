import {
  IAutoMoviePropRelation,
  IAutoMoviePropRelationTarget,
  IAutoMoviePropSpec,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * Refuse a prop that transitively rests on, plugs into, or hangs from itself
 * through `prop-affordance` relations.
 *
 * Only props whose node is declared once take part, and a relation citing an unresolved, ambiguous or self-same prop is skipped, because `validatePropPlacements` already refuses those by name. Each encountered DFS back edge is reported at its closing relation under `$input.props[i].placement.relations[j].target.prop`, visiting props in declaration order.
 *
 * @param props The prop registry in declaration order.
 * @param out Collector the violations are appended to.
 *
 * @evidence contracts/common.md#principled-implementation Depth-first search over the contact graph with an on-stack set and a finished set, the standard back-edge test for a directed cycle, so a relation reaching a prop still on the stack closes a cycle and finished props are never re-entered.
 * @evidence contracts/common.md#clear-and-simple-design One graph check apart from the registry and geometry gates, indexing only the uniquely declared nodes it can follow, so `validatePropPlacements` composes it as one line.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ambiguous, missing and self-citing targets are skipped because another rule names them, not to hide a cycle, and no prop or affordance is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States which props and relations take part, why the others are skipped, where and how often a cycle is reported, and the visiting order.
 * @evidence contracts/performance.md#efficient-algorithms Linear in props plus all relations of uniquely declared props: each such prop is entered once and each relation is inspected once, following only prop-affordance targets, with constant-time set and map lookups; recursion depth is bounded by the longest contact chain.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One search per validation call; nothing is kept across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the node index and the two sets die with the call.
 */
export const validatePropSupportCycles: (
  props: readonly IAutoMoviePropSpec[],
  out: ViolationCollector,
) => void = (
  props: readonly IAutoMoviePropSpec[],
  out: ViolationCollector,
): void => {
  const counts: Map<string, number> = new Map();
  for (const prop of props)
    counts.set(prop.node, (counts.get(prop.node) ?? 0) + 1);
  const byNode: Map<string, number> = new Map();
  props.forEach((prop: IAutoMoviePropSpec, index: number): void => {
    if (counts.get(prop.node) === 1) byNode.set(prop.node, index);
  });
  const visiting: Set<string> = new Set<string>();
  const visited: Set<string> = new Set<string>();
  const visit: (index: number) => void = (index: number): void => {
    const prop: IAutoMoviePropSpec = props[index]!;
    if (visited.has(prop.node)) return;
    visiting.add(prop.node);
    (prop.placement?.relations ?? []).forEach(
      (relation: IAutoMoviePropRelation, at: number): void => {
        const target: IAutoMoviePropRelationTarget = relation.target;
        if (target.kind !== "prop-affordance" || target.prop === prop.node)
          return;
        const next: number | undefined = byNode.get(target.prop);
        if (next === undefined) return;
        if (visiting.has(target.prop))
          out.push(
            "type",
            `$input.props[${index}].placement.relations[${at}].target.prop`,
            `prop contact relation forms a cycle through "${target.prop}"`,
            target.prop,
          );
        else visit(next);
      },
    );
    visiting.delete(prop.node);
    visited.add(prop.node);
  };
  for (const index of byNode.values()) visit(index);
};
