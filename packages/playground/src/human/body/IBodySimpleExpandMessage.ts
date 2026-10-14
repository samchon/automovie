import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

/**
 * Expand a simple-tier shape to detailed channels, keeping the residue of `over`. The body worker passes these fields to the Human expansion owner. This message declares the operation and payload; numerical admission occurs in that owner rather than in this structural type.
 *
 * @evidence contracts/common.md#principled-implementation The expand discriminant selects the worker's simple-to-detailed inversion, and an optional base shape preserves detailed channels the simple tier does not control.
 * @evidence contracts/common.md#clear-and-simple-design Correlation identity and expansion operands travel in one structured-clone message; the numerical package remains responsible for inversion and refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Expansion inputs are authored simple values and an optional detailed base, without substituted answers for particular bodies or panels.
 * @evidence contracts/common.md#meaningful-documentation The fields describe reply correlation, operation selection and the absent-base meaning; the comment locates numerical admission in the worker's Human callee.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This expansion payload chooses no search algorithm or sample count; expansion cost belongs to the numerical worker operation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Correlation IDs distinguish requests rather than prove equivalent expansion effects; this type contains no sharing or cache machinery.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The message carries cloneable authored values and no transferable buffer or live handle; the transport owns queued-request lifetime.
 *
 * @author Samchon
 */
export interface IBodySimpleExpandMessage {
  /** Correlates the reply. */
  id: number;

  /** Request discriminant. */
  kind: "expand";

  /** The simple-tier values to expand. */
  simple: IAutoMovieHumanBodySimpleShape;

  /** The detailed shape to keep the residue of; absent for a fresh body. */
  over?: Record<string, number>;
}
