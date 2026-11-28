/** Data and callback contracts shared by the LoftParameter operations. */
export namespace IAutoMovieLoftParameter {
  /**
   * Polygon correspondence for phase interpolation. Polar measures the angle
   * about the area centroid. Sagittal assigns one half-turn to each perimeter
   * arc between its front and back crossings. Arclength maps the full perimeter
   * from the front crossing to one turn. Use simple oriented sections with the
   * crossings or star geometry required by the selected rule.
   */
  export type Rule = "polar" | "sagittal" | "arclength";
}
