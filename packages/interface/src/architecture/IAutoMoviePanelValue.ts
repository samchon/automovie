/** The travel one named state gives one panel. */
export interface IAutoMoviePanelValue {
  /** Panel id inside the same operation. */
  panel: string;

  /** Radians for a revolute panel, metres for a prismatic one. */
  value: number;
}
