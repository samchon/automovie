/**
 * The substrate a replaceable anatomical component fits. Landmark identities
 * belong to the subject's socket binding, never to the generic host assembler.
 *
 * @evidence contracts/common.md#principled-implementation The host is exactly the three things a component fits: positions, oriented triangles and the recorded viewing direction; a component's landmarks come from its own socket binding, so the host carries no anatomy.
 * @evidence contracts/common.md#clear-and-simple-design Three fields with no options.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitComponentHost carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States what a host is, where landmark identities live, the unit and frame of the positions and that the view ray is a direction.
 * @evidence contracts/modeling.md#spatial-conventions Positions are construction millimetres with +Y up and +Z anterior, stated on the member; the view ray is unitless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitComponentHost is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitComponentHost carries no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitComponentHost decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitComponentHost constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitComponentHost is a declaration and displays nothing itself; the parts built from it are observed by their owners.
 * @evidenceExclude contracts/anatomy.md#anatomical-source IPortraitComponentHost carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range IPortraitComponentHost admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitComponentHost defines no input through which a caller shapes a human form.
 * @author Samchon
 */
export interface IPortraitComponentHost {
  /**
   * Original measured control positions, including any non-skin gaze markers,
   * in construction millimetres with +Y up and +Z anterior.
   */
  positions: number[][];

  /** Original oriented skin triangles; their ordinals identify removable faces. */
  indices: number[];

  /** Recorded image-depth direction used to preserve measured gaze placement; a direction, so it carries no unit. */
  viewRay: number[];
}
