/**
 * A final shared rim sample and its positive exterior transverse direction.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Shares the final aperture position and exterior direction between nasal skin and lining.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Carries one cyclic unit tangent and outward co-normal at each retained rim sample.
 * @author Samchon
 */
export interface IPortraitNasalRimJet {
  /** Shared rim position in head millimetres. */
  point: readonly number[];
  /** Unit tangent along the ordered cyclic aperture boundary. */
  tangent: readonly number[];
  /** Unit surface co-normal pointing from the rim towards exterior skin. */
  transverse: readonly number[];
}
