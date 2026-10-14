import type { IConnectedBodyFemoralHeadMeasurement } from "./IConnectedBodyFemoralHeadMeasurement";

/**
 * Readings for the femoral-head radii actually requested in the document, or an unavailable result when contact inspection found skin crossings. Missing sides produce no substituted radius; a document without either target or observed radius returns null at the producer instead of this record. Compact fit records omit the radius producer's acquisition metadata.
 *
 * @evidence contracts/common.md#principled-implementation The status distinguishes completed specified-radius sphere fits from known crossed-skin refusal, retaining only the requested side population.
 * @evidence contracts/common.md#clear-and-simple-design One status and head array are the preview transport result, with absent-request null owned by its caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unavailable result contains no fabricated readings; measured means the numerical query completed, not that joint anatomy was clinically validated.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes missing radii, crossed-skin refusal, omitted acquisition metadata and the geometric meaning of measured.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This status record implements no sphere or crossing query.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type does not share capped-skin work across heads.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration owns no query lifetime or geometry handle.
 *
 * @author Samchon
 */
export interface IConnectedBodyFemoralHeads {
  /** Measured, or unavailable on a self-crossing skin. */
  status: "measured" | "skin-crossing";

  /** One reading per specified head; empty when unavailable. */
  heads: IConnectedBodyFemoralHeadMeasurement[];
}
