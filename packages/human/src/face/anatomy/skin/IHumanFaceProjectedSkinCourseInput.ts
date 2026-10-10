/**
 * Immutable native triangle sheet and ordered free guide in head-frame metres.
 * The guide is an internal anatomical registration result, not a personal
 * sculpting input. Width does not participate in its geometric representation.
 *
 * @author Samchon
 */
export interface IHumanFaceProjectedSkinCourseInput {
  /** Flat triples owned by the immutable skin host. */
  positions: readonly number[];

  /** Actual resident triangle winding, flat triples. */
  indices: readonly number[];

  /** Ordered finite three-dimensional guide points, in the same frame. */
  guide: readonly (readonly number[])[];
}
