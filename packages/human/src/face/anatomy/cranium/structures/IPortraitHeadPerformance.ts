/**
 * Reference formation and performance of newly appended head tissue. Existing
 * facial/component vertices keep their performed positions and shared IDs.
 * Only continuation vertices are posed before common refinement and normals.
 *
 * @evidence contracts/common.md#principled-implementation Two pure functions restore and pose only newly appended continuation vertices, while existing facial vertices keep their performed positions and shared identities.
 * @evidence contracts/common.md#clear-and-simple-design Two members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitHeadPerformance carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States what is posed, that inputs are not mutated and that the unit is millimetres.
 * @evidence contracts/modeling.md#spatial-conventions Both functions read and return head-frame millimetres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitHeadPerformance is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitHeadPerformance carries no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitHeadPerformance decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitHeadPerformance constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitHeadPerformance is a declaration and displays nothing itself; the parts built from it are observed by their owners.
 * @evidenceExclude contracts/anatomy.md#anatomical-source IPortraitHeadPerformance carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range IPortraitHeadPerformance admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitHeadPerformance defines no input through which a caller shapes a human form.
 * @author Samchon
 */
export interface IPortraitHeadPerformance {
  /**
   * Restore reference coordinates for construction; do not mutate the input.
   *
   * @evidence contracts/common.md#principled-implementation It restores the reference coordinates of one vertex for construction without mutating the input, so continuation tissue is built in the reference pose.
   * @evidence contracts/common.md#clear-and-simple-design One pure function of a point and its vertex.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitHeadPerformance.reference is a signature; it carries no behaviour, special case or compensating path.
   * @evidence contracts/common.md#meaningful-documentation States that it restores reference coordinates and does not mutate its input.
   * @evidence contracts/modeling.md#spatial-conventions Head-frame millimetres in and out.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitHeadPerformance.reference is a declaration and defines no part or group of parts.
   * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitHeadPerformance.reference carries no parameter channel of a form.
   * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitHeadPerformance.reference decides no primitive population; it only describes data.
   * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitHeadPerformance.reference constructs no surface; it describes data only.
   * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitHeadPerformance.reference is a declaration and displays nothing itself; the parts built from it are observed by their owners.
   * @evidenceExclude contracts/anatomy.md#anatomical-source IPortraitHeadPerformance.reference carries no anatomical value, range, proportion, landmark or tissue behaviour.
   * @evidenceExclude contracts/anatomy.md#permitted-range IPortraitHeadPerformance.reference admits, bounds and combines no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitHeadPerformance.reference defines no input through which a caller shapes a human form.
   */
  reference: (point: number[], vertex: number) => number[];

  /**
   * Pose one new reference vertex in millimetres; do not mutate the input.
   *
   * @evidence contracts/common.md#principled-implementation It poses one new reference vertex in millimetres without mutating its input, so only appended tissue is posed before common refinement.
   * @evidence contracts/common.md#clear-and-simple-design One pure function of a point.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitHeadPerformance.pose is a signature; it carries no behaviour, special case or compensating path.
   * @evidence contracts/common.md#meaningful-documentation States that it poses one new reference vertex in millimetres and does not mutate its input.
   * @evidence contracts/modeling.md#spatial-conventions Head-frame millimetres in and out.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitHeadPerformance.pose is a declaration and defines no part or group of parts.
   * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitHeadPerformance.pose carries no parameter channel of a form.
   * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitHeadPerformance.pose decides no primitive population; it only describes data.
   * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitHeadPerformance.pose constructs no surface; it describes data only.
   * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitHeadPerformance.pose is a declaration and displays nothing itself; the parts built from it are observed by their owners.
   * @evidenceExclude contracts/anatomy.md#anatomical-source IPortraitHeadPerformance.pose carries no anatomical value, range, proportion, landmark or tissue behaviour.
   * @evidenceExclude contracts/anatomy.md#permitted-range IPortraitHeadPerformance.pose admits, bounds and combines no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitHeadPerformance.pose defines no input through which a caller shapes a human form.
   */
  pose: (point: number[]) => number[];
}
