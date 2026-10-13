/**
 * The travel one named state gives one panel.
 *
 * The value is a displacement from the panel element's rest pose, so `0` is
 * the authored rest pose, and it must be finite and within the panel's own
 * `[min, max]` travel.
 *
 * @evidence contracts/common.md#principled-implementation A rest-relative displacement, radians about the panel's pivot for a revolute panel and metres along its normalized axis for a prismatic one, composed after the element's rest pose by the engine's travel delta.
 * @evidence contracts/common.md#clear-and-simple-design Two fields; the unit follows from the referenced panel's motion kind, so the record carries no unit field that could disagree with it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An out-of-range or non-finite value is refused rather than clamped into the travel, and no panel id is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States which panel, the unit per motion kind, that the value is relative to rest, and the range it must lie in.
 * @author Samchon
 */
export interface IAutoMoviePanelValue {
  /** Panel id inside the same operation. */
  panel: string;

  /** Radians for a revolute panel, metres for a prismatic one. */
  value: number;
}
