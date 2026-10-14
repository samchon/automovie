/**
 * How the face resolver treats one clinical observation field.
 *
 * `path` is a dot path into the observations record (`mouth.fissureWidthMm`, `dentition.stage`), where a `*` segment matches any one key (`dentition.teeth.*.state`); the longest matching rule applies to a field and all of its descendants. `observed` keeps the value in the document without moving shape; `refused` rejects a document that supplies it, with `reason`. `values`, when present, lists the only values an observed field may carry; any other is refused with `reason`. A supplied field with no rule is refused, so no value is silently ignored.
 *
 * @evidence contracts/common.md#principled-implementation Longest wildcard-capable path selection either retains supplied observation leaves or refuses them with an explicit reason/value policy.
 * @evidence contracts/common.md#clear-and-simple-design Observed clinical metadata stays separate from authored geometry channels and measurement targets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A retained observation alone moves no shape and does not validate anatomy; uncovered leaves are refused by admission.
 * @evidence contracts/common.md#meaningful-documentation A wildcard matches one path key and longer matching paths override parent subtree rules.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Rule traversal and leaf checks execute in admitHumanFaceAnatomicalRequest.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One module rule table is shared across document admissions rather than per-field hardcoded readers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The registry owns scalar/path/value metadata; this type allocates no geometry and admission retains no observation tree.
 *
 * @author Samchon
 */
export interface IHumanFaceObservationRule {
  /** Dot path into the observations record. */
  path: string;

  /** Keep the value without shape effect, or refuse a document supplying it. */
  outcome: "observed" | "refused";

  /** Why, stated in the refusal or shown beside the kept value. */
  reason: string;

  /** The only values an observed field may carry; omission admits any value. */
  values?: readonly (string | number | boolean)[];
}
