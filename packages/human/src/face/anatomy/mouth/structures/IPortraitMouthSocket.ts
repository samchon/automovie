/**
 * Subject-owned oral boundaries. Upper and lower curves share their endpoints and run from negative to positive X. No landmark identity belongs to the replaceable mouth implementation.
 *
 * @evidence contracts/common.md#principled-implementation Source-owned outer and paired inner vertex loops plus an interior seed register the existing oral band.
 * @evidence contracts/common.md#clear-and-simple-design Topology selection and component constraints consume shared boundaries without implementation-owned landmark ids.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Resident ordered loops and common corners remain host premises; this record does not locate anatomy from images.
 * @evidence contracts/common.md#meaningful-documentation Ids address the caller's millimetre host, with inner curves ordered negative to positive head X.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Flood selection and boundary sampling execute in lip/component producers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One registered socket supplies both constraint and lining attachment identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller owns index arrays and the component copies its retained socket data.
 *
 * @author Samchon
 */
export interface IPortraitMouthSocket {
  /** Closed outer vermilion loop, in boundary order. */
  outer: number[];

  /** Upper inner lip from negative to positive X. */
  upper: number[];

  /** Lower inner lip in the same direction. */
  lower: number[];

  /** A vertex strictly inside the connected vermilion band. */
  lipSeed: number;
}
