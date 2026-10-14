/**
 * A point in the lower lid's transverse section. Offset runs outward from the aperture in its local image-plane normal; projection is signed anterior relief over the common globe-to-skin depth bridge. Both use millimetres. These describe visible tissue, not measured muscle thickness.
 *
 * @evidence contracts/common.md#principled-implementation The two section scalars separate outward aperture distance from signed anterior relief; neither claims a measured internal tissue thickness.
 * @evidence contracts/common.md#clear-and-simple-design A single point record is reused by each lower-lid anatomical station, leaving longitudinal interpolation to the section sampler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There are no fixture branches or replacement methods in this offset/projection declaration; numeric admission belongs to createPortraitLidSectionSampler.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies the local image-plane normal, support bridge, millimetres and the distinction between visible shape and muscle thickness.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This scalar point type chooses no traversal; interpolation cost belongs to the sampler over the surrounding profile witnesses.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Offset and relief fields declare no cache or cross-request coordination, so there is no equivalent work to merge here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The two numbers own no handles or tasks; lifetime follows whichever section contains this point.
 *
 * @author Samchon
 */
export interface IPortraitLowerLidPoint {
  /** Positive distance from the aperture, in millimetres. */
  offset: number;

  /** Signed anterior relief relative to the section's support bridge, in mm. */
  projection: number;
}
