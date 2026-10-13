import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

/**
 * Display-only companion seating owned by the body page. Calls supersede older head requests; null hides the companion. Close permanently withdraws publication and waits for pending work before retiring numerical and GPU ownership.
 *
 * @evidence contracts/common.md#principled-implementation A callable seating operation carries the body document independently of the displayed model, while explicit closure supplies the page-owned companion's final lifetime boundary.
 * @evidence contracts/common.md#clear-and-simple-design The existing seat callback remains callable and gains one close operation, avoiding a second head-control or document-transaction layer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The companion is display-only and cannot certify a complete body export or replace refused head evaluation with fixed geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment states supersession, null hiding, display-only qualification and permanent close with pending-work retirement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This companion-handle type selects no numerical head or rendering algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration specifies lifetime and publication authority without implementing resident-frame reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Worker and GPU ownership belongs to the returned handle's implementation, which exposes its close boundary here.
 *
 * @author Samchon
 */
export interface IConnectedBodyHeadSeat {
  /**
   * Request the body document's companion head, or hide it when model is null. Throws after permanent close. The displayed model controls visibility and is not inferred anatomical source data; worker supersession and prepared-frame resources belong to the seating implementation.
   */
  (model: unknown, body: IAutoMovieHumanBodyBasisDocument): void;

  /**
   * Permanently close seating, cancel its numerical request and await prepared-frame work and companion retirement.
   *
   * @evidence contracts/common.md#principled-implementation Close withdraws publication before disposing the numerical connection and retiring GPU frames, preventing late work from restoring a retired companion.
   * @evidence contracts/common.md#clear-and-simple-design A single completion lets the mounting page await the head seat's whole shutdown without managing its worker or renderer separately.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Shutdown does not dispose the body's borrowed GPU context or report unfinished work as an accepted head.
   * @evidence contracts/common.md#meaningful-documentation The member names permanent withdrawal, numerical cancellation, pending-frame work and companion retirement.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This close declaration chooses no request or frame-retirement traversal implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work One shutdown completion is coordinated by the seat owner, not cached numerical equivalence in this schema.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The seat implementation owns the worker and companion lifetimes released through this operation.
   */
  close: () => Promise<void>;
}
