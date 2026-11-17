/**
 * Data and callback contracts shared by the LoftParameter operations.
 *
 * @evidence contracts/development/design.md#principled-representation Rule is the closed choice of polar, sagittal or arclength correspondence for a section polygon; its result is a cyclic phase rather than elapsed time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface LoftParameter selects the correspondence used when lofting section samples.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The union admits only supported rules; polygon star-shapedness and sagittal traversal premises remain algorithm admission.
 * @evidence contracts/development/common.md#meaningful-documentation Names the three correspondence choices and their geometric admission boundary.
 */
export namespace IAutoMovieLoftParameter {
  /**
   * Polygon correspondence: polar angle about the area centroid, separate front/back anchored half-perimeters for sagittal, or the full anchored perimeter for arclength. Simple, oriented polygons and the selected rule's star-shape or crossing premises belong to the caller.
   *
   * @evidence contracts/development/design.md#principled-representation The closed union distinguishes polar angles, front-anchored whole arclength and separately anchored front/back half arclength.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One literal choice drives phases without independent mode flags that could disagree.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type selects a rule without proving star shape or anchor suitability; those remain caller geometry premises.
   * @evidence contracts/development/common.md#meaningful-documentation The namespace explains each rule's phase origin, orientation and admissible section shape.
   */
  export type Rule = "polar" | "sagittal" | "arclength";
}
