/**
 * Lower minus upper midline incisal point in the contact frame, millimetres.
 *
 * @evidence contracts/common.md#principled-implementation Lower-minus-upper registered incisal points resolve into shared contact up, anterior and anatomical-left axes.
 * @evidence contracts/common.md#clear-and-simple-design Absolute overlap/overjet/midline relationships remain distinct from reference-relative excursions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registered coarse source points are not acquired clinical incisal trajectories or tooth long axes.
 * @evidence contracts/common.md#meaningful-documentation Values are millimetres; positive up denotes overlap, negative forward upper-ahead overjet and left is signed lower midline offset.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Point and axis reading execute in readHumanFaceIncisalOffset.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The canonical aperture-direction owner keeps source unit-tolerance from scaling the result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only the scalar result is caller-owned; this type acquires no source array or reference snapshot.
 *
 * @author Samchon
 */
export interface IHumanFaceIncisalOffset {
  /** Along the opening direction; positive is vertical overlap (overbite), negative is opening. */
  up: number;

  /** Anterior; negative is the upper incisor ahead (overjet), positive is protrusion past it. */
  forward: number;

  /** Toward the face's left along the mandibular axis. */
  left: number;
}
