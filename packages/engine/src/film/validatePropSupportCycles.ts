import {
  IAutoMoviePropRelation,
  IAutoMoviePropRelationTarget,
  IAutoMoviePropSpec,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

/**
 * Refuse a prop that transitively rests on, plugs into, or hangs from itself
 * through `prop-affordance` relations.
 *
 * Only props whose node is declared once take part, and a relation citing an
 * unresolved, ambiguous or self-same prop is skipped, because
 * `validatePropPlacements` already refuses those by name. Each encountered DFS
 * back edge is reported at its closing relation under
 * `$input.props[i].placement.relations[j].target.prop`, visiting props in
 * declaration order.
 *
 * @param props The prop registry in declaration order.
 * @param out Collector the violations are appended to.
 */
export const validatePropSupportCycles: (
  props: readonly IAutoMoviePropSpec[],
  out: IAutoMovieViolationCollector,
) => void = (
  props: readonly IAutoMoviePropSpec[],
  out: IAutoMovieViolationCollector,
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
