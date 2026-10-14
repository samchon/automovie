/**
 * The travel one named state gives one panel.
 *
 * The value is a displacement from the panel element's rest pose, so `0` is
 * the authored rest pose, and it must be finite and within the panel's own
 * `[min, max]` travel.
 *
 * @evidence contracts/common.md#principled-implementation The engine turns the value into an element-local delta: a translation of `value` metres along the normalized axis, or a right-handed rotation of `value` radians about the normalized axis through the pivot, composed after the element's rest transform.
 * @evidence contracts/common.md#clear-and-simple-design One scalar per panel is enough because each panel has exactly one degree of freedom, whose kind decides the unit, so the value needs no vector or unit field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An out-of-range or non-finite value is refused by validation rather than clamped into the panel's travel, and a value naming an unknown panel is refused rather than skipped.
 * @evidence contracts/common.md#meaningful-documentation States that the value is relative to the rest pose, its unit per motion kind, its range, and which panel ids it may name.
 * @author Samchon
 */
export interface IAutoMoviePanelValue {
  /** Panel id inside the same operation. */
  panel: string;

  /**
   * Radians about the panel's axis by the right-hand rule for a revolute
   * panel, metres along its unit axis for a prismatic one.
   */
  value: number;
}
