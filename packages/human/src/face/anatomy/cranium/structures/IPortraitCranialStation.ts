/**
 * One sagittal cranial section. Dimensions are millimetres; the crown and
 * mandibular floor are separate envelopes rather than a scaled sphere.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Names the cranial section's transverse, superior, inferior and posterior controls.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Carries the sections used to continue facial skin across the cranial vault.
 * @author Samchon
 */
export interface IPortraitCranialStation {
  /** Posterior station depth in head Z; stations descend in Z. */
  z: number;
  /** Superior station depth in head Z; at least z. */
  crownZ: number;
  /** Positive transverse half-width. */
  width: number;
  /** Superior envelope height in head Y. */
  crown: number;
  /** Inferior envelope height, or offset from the host's chin when chinRelative. */
  floor: number;
  /** Omission is absolute Y; true adds the host's lowest facial-oval Y to floor. */
  chinRelative?: boolean;
}
