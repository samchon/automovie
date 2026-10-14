import {
  AutoMovieAffordanceKind,
  IAutoMovieAffordance,
  IAutoMoviePropRelation,
  IAutoMoviePropRelationTarget,
  IAutoMoviePropSpec,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * Gate one relation that cites another prop's declared contact point.
 *
 * The cited prop must differ from the citing one and be declared exactly once,
 * its model must declare the cited affordance, and that affordance must have
 * the kind the relation needs: `stack-top` to rest on (`on-support`), `socket`
 * to attach, `hook` to hang (`suspended`). The first failing rule is reported
 * under `<path>.target.prop` or `<path>.target.affordance` and the rest are
 * not judged, because each depends on the one before.
 *
 * @param props.relation The relation whose target is checked; its kind picks the affordance kind.
 * @param props.target The relation's prop-affordance target.
 * @param props.path Violation path of the relation.
 * @param props.node Node id of the citing prop.
 * @param props.matches Every registry prop declaring the cited node.
 * @param out Collector the violations are appended to.
 *
 * @evidence contracts/common.md#principled-implementation Resolves the cited node through the registry's own declaration list, so absence and ambiguity are distinct findings, then matches the affordance by id on the cited model and its kind against the one kind each relation physically needs.
 * @evidence contracts/common.md#clear-and-simple-design One gate for prop-to-prop contact, kept apart from the building-target gate in `validatePropPlacements` because it reads another prop's model rather than an environment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only `on-support`, `attached` and `suspended` admit a prop-affordance target under the relation kind table, so the three-way kind choice has no dead arm, and no prop or affordance id is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States each rule in order, the kind each relation needs, the reported paths, and why later rules are skipped after a failure.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One scan of the cited model's affordances, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Judges one relation per call; the registry index it reads is built once by the caller.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing and appends at most one violation per call.
 */
export const validatePropAffordanceTarget: (
  props: {
    relation: IAutoMoviePropRelation;
    target: IAutoMoviePropRelationTarget.IPropAffordance;
    path: string;
    node: string;
    matches: readonly { value: IAutoMoviePropSpec }[];
  },
  out: ViolationCollector,
) => void = (
  props: {
    relation: IAutoMoviePropRelation;
    target: IAutoMoviePropRelationTarget.IPropAffordance;
    path: string;
    node: string;
    matches: readonly { value: IAutoMoviePropSpec }[];
  },
  out: ViolationCollector,
): void => {
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
};
