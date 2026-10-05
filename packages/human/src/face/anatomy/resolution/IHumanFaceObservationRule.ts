/**
 * How the face resolver treats one clinical observation field.
 *
 * `path` is a dot path into the observations record (`mouth.fissureWidthMm`,
 * `dentition.stage`), where a `*` segment matches any one key
 * (`dentition.teeth.*.state`); the longest matching rule applies to a field
 * and all of its descendants. `observed` keeps the value in the document
 * without moving shape; `refused` rejects a document that supplies it, with
 * `reason`. `values`, when present, lists the only values an observed field
 * may carry; any other is refused with `reason`. A supplied field with no
 * rule is refused, so no value is silently ignored.
 *
 * @evidence contracts/common.md#principled-implementation Every observation field resolves to kept or refused by an explicit rule; nothing is dropped silently.
 * @evidence contracts/common.md#clear-and-simple-design Path, outcome, reason and an optional admitted value list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unruled field refuses instead of being ignored.
 * @evidence contracts/common.md#meaningful-documentation States path and wildcard matching, both outcomes, the value list and the unruled case.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A rule names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Observations move no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A rule emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions A rule carries no value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries A rule builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Rules change nothing displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The observation types state their sources.
 * @evidenceExclude contracts/anatomy.md#permitted-range A rule bounds no value.
 * @evidence contracts/anatomy.md#parametric-authority Refusal keeps unsupported anatomical states out of the editable document.
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
