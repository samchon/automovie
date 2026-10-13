import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Midline coccyx inferior to sacrum, distinct from both coxal bones.
 *
 * Adult coccygeal segments may fuse; whole volume does not specify segment count, sacrococcygeal mobility or posterior soft-tissue attachments.
 *
 * @evidence contracts/common.md#principled-implementation Required coccygeal volume preserves target/observation provenance and keeps coccyx distinct from sacrum and paired coxal bones.
 * @evidence contracts/common.md#clear-and-simple-design One midline component owns its osseous quantity without duplicating pelvic side records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Whole volume does not invent segment count, sacrococcygeal mobility or soft-tissue attachments.
 * @evidence contracts/common.md#meaningful-documentation Documentation names inferior midline ownership, possible segment fusion and limits of a volume scalar.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Coccyx quantity typing performs no segment reconstruction or sacrococcygeal motion solving.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This midline bone record coordinates no repeated pelvic reconstruction result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The coccyx schema retains no segmented bone bytes or pelvic solver resources.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyCoccyxMeasurements {
  /** Coccygeal osseous volume excluding sacrum. */
  readonly boneVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
