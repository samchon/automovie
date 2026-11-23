/** A null span denotes the existing constant ellipse cap law. */
export interface IAutoMovieLoftViewSourceCap {
  /** Declared pole station, mm. */
  pole: number;

  /** Original nearest non-pole knot station; null for the constant law. */
  near: number | null;

  /** Its actual distance from the pole; null for the constant law. */
  span: number | null;
}
