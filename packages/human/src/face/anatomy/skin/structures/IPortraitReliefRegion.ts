/**
 * One named anatomical support on the common skin. All vectors use millimetres
 * in the head frame. The binding follows the host after component replacement;
 * offset locates the support relative to that retained anatomical attachment.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Locates one named soft-tissue support on the common skin rather than in a detached mesh.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines a retained anchor, millimetre offset, positive support radii and signed XYZ displacement.
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
