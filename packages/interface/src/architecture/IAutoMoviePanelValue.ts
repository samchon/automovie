/**
 * The travel one named state gives one panel.
 *
 * The value is a displacement from the panel element's rest pose, so `0` is the
 * authored rest pose, and it must be finite and within the panel's own `[min,
 * max]` travel.
 */
export interface IAutoMoviePanelValue {
  /** Panel id inside the same operation. */
  panel: string;

  /**
   * Radians about the panel's axis by the right-hand rule for a revolute panel,
   * metres along its unit axis for a prismatic one.
   */
  value: number;
}
