/**
 * How a bounding envelope face is read, from its own outward normal.
 *
 * The split is the ordinary architectural one at forty-five degrees: a
 * separation more vertical than horizontal is read in elevation and owes a
 * facade observation, while one more horizontal than vertical is read from
 * above or below and owes a roof or underside observation. The threshold is
 * geometric rather than a label, so a record that calls a steep mansard slope a
 * `roof` and a record that calls it a `wall` derive the same population.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Classifies each exposed separation into the observation role it owes.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Types the closed envelope-face aspect the derivation partitions by.
 */
export type AutoMovieEnvelopeFaceAspect = "facade" | "roof" | "underside";
