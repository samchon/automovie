/** Data and callback contracts shared by the LoftParameter operations. */
export namespace IAutoMovieLoftParameter {
  /**
   * Polygon correspondence: polar angle about the area centroid, separate
   * front/back anchored half-perimeters for sagittal, or the full anchored
   * perimeter for arclength. Simple, oriented polygons and the selected rule's
   * star-shape or crossing premises belong to the caller.
   */
  export type Rule = "polar" | "sagittal" | "arclength";
}
