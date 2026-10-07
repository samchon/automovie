/**
 * An ancestral shading field built from reference parent areas: the dense
 * per-vertex unit normals of both halves (face, then body; zero for unused
 * vertices), and a lookup of one canonical sample's unit normal under a parent.
 * Normals are dimensionless in the shared Y-up, +Z-forward frame.
 *
 * @evidence contracts/common.md#principled-implementation Transport needs both the full ancestral field and individual source-star normals from the same reference areas.
 * @evidence contracts/common.md#clear-and-simple-design One array and one lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both come from the source-normal owner's own evaluation; transport does not rebuild them.
 * @evidence contracts/common.md#meaningful-documentation States both members, order, unused vertices and frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A field defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The field shades existing geometry and emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Unit vectors in the shared Y-up, +Z-forward frame.
 * @evidence contracts/modeling.md#shared-boundaries One field covers both halves, so a shared sample reads one normal.
 * @evidenceExclude contracts/modeling.md#rendered-observation The person assembly owns the displayed shading.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical geometry, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Evaluated geometry or compiled lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonReferenceNormalField {
  /** Dense unit normals, face then body, flat triples; zero for unused vertices. */
  normals: number[];

  /**
   * Unit normal of one canonical sample under one parent.
   *
   * @evidence contracts/common.md#principled-implementation Transport reads each required source star's ancestral normal from the same field as the dense normals.
   * @evidence contracts/common.md#clear-and-simple-design One function of a sample and a parent.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts IAutoMovieHumanPersonReferenceNormalField.at is a signature; it carries no behaviour, special case or compensating path.
   * @evidence contracts/common.md#meaningful-documentation States what it returns and for which arguments.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IAutoMovieHumanPersonReferenceNormalField.at is a declaration and defines no part or group of parts.
   * @evidenceExclude contracts/modeling.md#parameter-channels IAutoMovieHumanPersonReferenceNormalField.at carries no parameter channel of a form.
   * @evidenceExclude contracts/modeling.md#emitted-geometry IAutoMovieHumanPersonReferenceNormalField.at decides no primitive population; it only describes data.
   * @evidence contracts/modeling.md#spatial-conventions Returns a unit vector in the shared Y-up, +Z-forward frame.
   * @evidenceExclude contracts/modeling.md#shared-boundaries IAutoMovieHumanPersonReferenceNormalField.at constructs no surface; it describes data only.
   * @evidenceExclude contracts/modeling.md#rendered-observation IAutoMovieHumanPersonReferenceNormalField.at is a declaration and displays nothing itself.
   * @evidenceExclude contracts/anatomy.md#anatomical-source IAutoMovieHumanPersonReferenceNormalField.at carries no anatomical value, range, proportion, landmark or tissue behaviour.
   * @evidenceExclude contracts/anatomy.md#permitted-range IAutoMovieHumanPersonReferenceNormalField.at admits, bounds and combines no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority IAutoMovieHumanPersonReferenceNormalField.at defines no input through which a caller shapes a human form.
   */
  at: (sample: number, parent: number) => readonly number[];
}
