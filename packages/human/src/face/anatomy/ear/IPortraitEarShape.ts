/**
 * Subject-level pinna placement and dimensions. Lengths are millimetres of the
 * head frame (+X anatomical left, +Y up, +Z anterior) and scales multiply the
 * authored outline independently of the host's shape.
 *
 * `resolvePortraitEarSampling` admits a shape: finite placement, positive
 * scales and projection, nonnegative embedding and integer tessellation inside
 * its budget. It does not encode the range of a living pinna.
 *
 *
 * @evidence contracts/common.md#principled-implementation Source pinna outline scales and placement use head millimetres and declared anatomical axes independently of the current host shape.
 * @evidence contracts/common.md#clear-and-simple-design Anatomical dimensions and optional angular/radial tessellation are separate fields admitted by resolvePortraitEarSampling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Finite positive dimensions and sampling bounds are drawable premises, not encoded living-pinna ranges or personal hidden-ear acquisition.
 * @evidence contracts/common.md#meaningful-documentation Members state centres, outline scales, posterior projection, root embedding and omitted sampling counts/bounds.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitEarShape is an erased TypeScript contract and performs no geometry or numeric algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitEarShape declares source inputs/results; concrete producing/consuming operations own copying and equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitEarShape acquires no runtime task, state or handle; actual array and callback lifetimes stay with their owners.
 *
 * @author Samchon
 */
export interface IPortraitEarShape {
  /** Vertical centre in the head frame, in mm. */
  centerY: number;

  /** Sagittal centre in the head frame, in mm. */
  centerZ: number;

  /** Positive vertical outline multiplier. */
  heightScale: number;

  /** Positive anterior/posterior outline multiplier. */
  depthScale: number;

  /** Positive posterior-rim projection beyond the sampled host surface, in mm. */
  projection: number;

  /** Nonnegative embedding depth at the anterior root, in mm. */
  embedding: number;

  /** Optional tessellation, independent of anatomical dimensions; omission uses 112 angular columns, 60 front rows and 40 back rows. */
  sampling?: {
    /** Angular columns in [8,512]. */
    columns: number;

    /** Radial anterior rows in [2,256]. */
    frontRows: number;

    /** Radial posterior rows in [2,256]. */
    backRows: number;
  };
}
