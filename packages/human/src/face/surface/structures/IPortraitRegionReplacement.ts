import type { IControlMesh } from "../../mesh/structures/IControlMesh";

/**
 * A component's reserved region replaced after the host has refined its skin.
 * The append operation receives the actual oriented boundary and preserves its
 * resident vertex identities. It adds source geometry and its joining faces;
 * it does not move or remove surviving host vertices or unrelated faces.
 * An appender also extends any resident reference/RGB attributes in the same
 * vertex order. The head assembler pairs current and reference appenders.
 *
 * @evidence contracts/common.md#principled-implementation A replacement is a unique reserved face-region label and an append function that receives the actual oriented boundary, adds source geometry and its joining faces and never moves or removes surviving vertices.
 * @evidence contracts/common.md#clear-and-simple-design Two members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitRegionReplacement carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States the timing (after host refinement), the identity-preserving rule and the attribute duty.
 * @evidence contracts/modeling.md#shared-boundaries The appender receives the fixed refined host boundary and joins its own geometry to those resident vertices.
 * @evidenceExclude contracts/modeling.md#spatial-conventions IPortraitRegionReplacement states no unit or frame beyond what its members document.
 * @evidenceExclude contracts/anatomy.md#anatomical-source IPortraitRegionReplacement carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range IPortraitRegionReplacement admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitRegionReplacement defines no input through which a caller shapes a human form.
 * @author Samchon
 */
export interface IPortraitRegionReplacement {
  /** Unique reserved face-region label, inherited through host subdivision. */
  group: number;

  /**
   * Append owned millimetre geometry against the fixed refined host boundary.
   *
   * @evidence contracts/common.md#principled-implementation The appender receives the cage and the actual oriented boundary loop and adds source geometry and its joining faces without moving surviving vertices, extending reference and colour attributes in the same vertex order.
   * @evidence contracts/common.md#clear-and-simple-design One function of the cage and the boundary.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitRegionReplacement.append is a signature; it carries no behaviour, special case or compensating path.
   * @evidence contracts/common.md#meaningful-documentation States that it appends millimetre geometry against a fixed refined host boundary.
   * @evidence contracts/modeling.md#shared-boundaries The patch is joined to the boundary vertices it is handed, so it shares the host boundary exactly.
   * @evidence contracts/modeling.md#spatial-conventions Millimetre geometry in the cage's frame.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitRegionReplacement.append is a declaration and defines no part or group of parts.
   * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitRegionReplacement.append carries no parameter channel of a form.
   * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitRegionReplacement.append decides no primitive population; it only describes data.
   * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitRegionReplacement.append is a declaration and displays nothing itself; the parts built from it are observed by their owners.
   * @evidenceExclude contracts/anatomy.md#anatomical-source IPortraitRegionReplacement.append carries no anatomical value, range, proportion, landmark or tissue behaviour.
   * @evidenceExclude contracts/anatomy.md#permitted-range IPortraitRegionReplacement.append admits, bounds and combines no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitRegionReplacement.append defines no input through which a caller shapes a human form.
   */
  append: (cage: IControlMesh, boundary: readonly number[]) => void;
}
