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
