/**
 * One sagittal cranial section. Dimensions are millimetres; the crown and
 * mandibular floor are separate envelopes rather than a scaled sphere.
 *
 *
 * @evidence contracts/common.md#principled-implementation Independent sagittal crown/floor envelopes and positive half-width define one authored cranial section instead of a scaled sphere.
 * @evidence contracts/common.md#clear-and-simple-design Posterior and superior depths remain separate from vertical envelopes and optional current-chin-relative floor interpretation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Chin-relative omission means absolute Y; the shape resolver owns finite/order/positivity admission rather than this type certifying anatomy.
 * @evidence contracts/common.md#meaningful-documentation Members state millimetres, descending Z, crown depth, half-width and current facial-oval floor datum.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitCranialStation is erased by TypeScript and evaluates no anatomy, geometry or material algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitCranialStation declares caller data; concrete producers own copying and equivalence rather than this schema caching results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitCranialStation starts no task or handle and retains no runtime state; actual callback/array lifetimes belong to its owners.
 *
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
