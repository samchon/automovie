/**
 * One named anatomical support on the common skin. All vectors use millimetres
 * in the head frame. The binding follows the host after component replacement;
 * offset locates the support relative to that retained anatomical attachment.
 *
 * @evidence contracts/common.md#principled-implementation A region is a named retained vertex anchor, an offset, positive support radii and a signed displacement, which is exactly what the relief adapter converts to one engine field; the binding follows the host after component replacement.
 * @evidence contracts/common.md#clear-and-simple-design Five fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitReliefRegion carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States the units, that the anchor follows replacement and that zero displacement is the unchanged host.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the head frame, stated on the members.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitReliefRegion is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitReliefRegion carries no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitReliefRegion decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitReliefRegion constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitReliefRegion is a declaration and displays nothing itself; the parts built from it are observed by their owners.
 * @author Samchon
 */
export interface IPortraitReliefRegion {
  /** Anatomical responsibility within this layer; unique and nonempty. */
  name: string;

  /** Retained skin vertex identity, owned by the subject. */
  anchor: number;

  /** XYZ offset of the support centre from the current attachment. */
  offset: [number, number, number];

  /** Positive XYZ support radii; the cubic envelope vanishes at their boundary. */
  radius: [number, number, number];

  /** Signed XYZ displacement at the centre. Zero is the unchanged host. */
  displacement: [number, number, number];
}
