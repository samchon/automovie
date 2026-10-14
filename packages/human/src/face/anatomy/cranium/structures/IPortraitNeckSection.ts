/**
 * A horizontal neck section with independent anterior/posterior radii.
 * Distances are millimetres in the shared head frame.
 *
 *
 * @evidence contracts/common.md#principled-implementation A horizontal cervical ellipse uses independent anterior/posterior radii and one sagittal axis in the shared head frame.
 * @evidence contracts/common.md#clear-and-simple-design Section height, transverse width, front/back depth and axis centre stay independent authored dimensions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positive radii and descending section heights are admitted by the neck builder; this schema supplies no shoulder/torso or clinical-neck reconstruction.
 * @evidence contracts/common.md#meaningful-documentation Members state head millimetres, upper/lower/crop order, positive half-width/radii and forward-positive Z centre.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitNeckSection is erased by TypeScript and evaluates no anatomy, geometry or material algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitNeckSection declares caller data; concrete producers own copying and equivalence rather than this schema caching results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitNeckSection starts no task or handle and retains no runtime state; actual callback/array lifetimes belong to its owners.
 *
 * @author Samchon
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
