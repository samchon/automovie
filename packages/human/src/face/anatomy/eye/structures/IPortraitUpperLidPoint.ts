/**
 * One visible upper-lid tissue station over the ocular-to-skin support bridge. It describes surface shape, not a measured muscle or fat-layer thickness.
 *
 * @evidence contracts/common.md#principled-implementation Outward aperture offset and anterior bridge relief are separate millimetre coordinates of a visible tissue station, not buried-layer thickness estimates.
 * @evidence contracts/common.md#clear-and-simple-design The same station shape serves all upper-lid roles so the section owns role order and the eye owns the shared support bridge.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No measured-muscle claim or special station fallback is encoded in this numerical surface-coordinate record.
 * @evidence contracts/common.md#meaningful-documentation The two member comments identify the planar outward normal and contact-to-host relief frame used by upper-lid construction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This upper-lid coordinate type has no sampling loop or allocation policy; its consumer interpolates the enclosing section's fixed roles.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Point coordinates do not identify completed work across requests, so caching remains outside this authored station contract.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources An upper-lid station contains two primitive scalars and owns no resource with a separate release operation.
 *
 * @author Samchon
 */
export interface IPortraitUpperLidPoint {
  /** Positive distance from the aperture along its planar outward normal, in mm. */
  offset: number;

  /** Signed anterior relief over the common contact-to-host bridge, in mm. */
  projection: number;
}
