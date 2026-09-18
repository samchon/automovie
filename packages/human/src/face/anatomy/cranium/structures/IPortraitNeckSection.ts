/**
 * A horizontal neck section with independent anterior/posterior radii.
 * Distances are millimetres in the shared head frame.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Exposes transverse, anterior, posterior and axis controls for one cervical section.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines the metric cross-section used to sample the neck around its cranial attachment.
 */
export interface IPortraitNeckSection {
  /** Height of this section; sections descend from upper to lower to crop. */
  y: number;
  /** Positive transverse half-width. */
  width: number;
  /** Positive radius anterior to the section's axis. */
  front: number;
  /** Positive radius posterior to the section's axis. */
  back: number;
  /** Sagittal position of the cervical axis; positive Z points forwards. */
  centre: number;
}
