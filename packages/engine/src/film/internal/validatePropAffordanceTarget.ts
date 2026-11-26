import {
  AutoMovieAffordanceKind,
  IAutoMovieAffordance,
  IAutoMoviePropRelationTarget,
  type IAutoMovieValidatePropAffordanceTarget,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

/**
 * Gate one relation that cites another prop's declared contact point.
 *
 * The cited prop must differ from the citing one and be declared exactly once,
 * its model must declare the cited affordance, and that affordance must have
 * the kind the relation needs: `stack-top` to rest on (`on-support`), `socket`
 * to attach, `hook` to hang (`suspended`). The first failing rule is reported
 * under `<path>.target.prop` or `<path>.target.affordance` and the rest are not
 * judged, because each depends on the one before.
 *
 * @param props.relation The relation whose target is checked; its kind picks
 *   the affordance kind.
 * @param props.target The relation's prop-affordance target.
 * @param props.path Violation path of the relation.
 * @param props.node Node id of the citing prop.
 * @param props.matches Every registry prop declaring the cited node.
 * @param out Collector the violations are appended to.
 */
export function validatePropAffordanceTarget(
  props: IAutoMovieValidatePropAffordanceTarget.IProps,
  out: IAutoMovieViolationCollector,
): void {
  const target: IAutoMoviePropRelationTarget.IPropAffordance = props.target;
  if (target.prop === props.node) {
    out.push(
      "type",
      `${props.path}.target.prop`,
      "a prop cannot rest on, plug into, or hang from itself",
      target.prop,
    );
    return;
  }
  if (props.matches.length !== 1) {
    out.push(
      "type",
      `${props.path}.target.prop`,
      props.matches.length === 0
        ? `prop "${target.prop}" does not resolve`
        : `prop "${target.prop}" is ambiguous`,
      target.prop,
    );
    return;
  }
  const affordance: IAutoMovieAffordance | undefined =
    props.matches[0]!.value.model.affordances?.find(
      (candidate: IAutoMovieAffordance): boolean =>
        candidate.id === target.affordance,
    );
  if (affordance === undefined) {
    out.push(
      "type",
      `${props.path}.target.affordance`,
      `affordance "${target.affordance}" does not resolve on prop "${target.prop}"`,
      target.affordance,
    );
    return;
  }
  const expected: AutoMovieAffordanceKind =
    props.relation.kind === "attached"
      ? "socket"
      : props.relation.kind === "suspended"
        ? "hook"
        : "stack-top";
  if (affordance.kind !== expected)
    out.push(
      "type",
      `${props.path}.target.affordance`,
      `relation "${props.relation.kind}" needs a "${expected}" affordance, but "${target.affordance}" is a "${affordance.kind}"`,
      affordance.kind,
    );
}
