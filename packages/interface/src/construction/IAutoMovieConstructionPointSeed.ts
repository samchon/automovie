/**
 * A join's seed given as a chart point near the curve on the part's face and on the host's face, from the landmarks that locate the contact.
 *
 * A face is named by the view part or the join that made it: a view part's name for its lofted surface, a join's name for its blend. Newton's method refines the seed onto the curve; a seed with no meeting near it is one diagnostic and the join is left out.
 *
 * @evidence contracts/common.md#principled-implementation The curve is traced by continuation from one point, and a landmark's feet on both surfaces put that point on the right loop when two solids meet along several.
 * @evidence contracts/common.md#clear-and-simple-design Two face names and two chart points are the whole seed; faces are named, not indexed, so a seed survives edits elsewhere in the tree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A seed far from any meeting is reported, never searched for over the whole surface.
 * @evidence contracts/common.md#meaningful-documentation States the face naming, each chart point's units and the failure effect.
 */
export interface IAutoMovieConstructionPointSeed {
  /** Discriminator. */
  type: "point";

  /** The face of the part that meets the host: a view part's name in the part's subtree. */
  partFace: string;

  /** The host face the seed lies on: a view part's or a join's name in the host's subtree. */
  hostFace: string;

  /** The part face's chart point `[station, phase]` near the curve, metres and radians. */
  part: [number, number];

  /** The host face's chart point `[station, phase]` near the curve, metres and radians; a blend face's station runs from its host rail (0) to its part rail. */
  host: [number, number];
}
