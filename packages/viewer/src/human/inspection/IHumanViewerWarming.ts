import type { IHumanViewerWarmFailure } from "./IHumanViewerWarmFailure.js";
import type { IHumanViewerWarmLastFailure } from "./IHumanViewerWarmLastFailure.js";

/**
 * Progress of the current background warm pass, as `/health` reports it.
 *
 * @evidence contracts/common.md#principled-implementation Warm progress ties total, successful draws, skipped failures and current document to one pass revision.
 * @evidence contracts/common.md#clear-and-simple-design Current-pass counters and the cross-pass last failure coexist in one health record with distinct lifetimes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Skipped documents retain explicit reasons and do not contribute to the successful draw counter.
 * @evidence contracts/common.md#meaningful-documentation Explains warm revision, total/done/skipped counts, nullable current document and retained latest failure.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Warm progress ties total, successful draws, skipped failures and current document to one pass revision.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review Current-pass counters and the cross-pass last failure coexist in one health record with distinct lifetimes.
 * @author Samchon
 */
export interface IHumanViewerWarming {
  /**
   * Source generation the pass warms.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Source generation the pass warms. Warm progress ties total, successful draws, skipped failures and current document to one pass revision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Source generation the pass warms. Current-pass counters and the cross-pass last failure coexist in one health record with distinct lifetimes.
   */
  revision: string;

  /**
   * Published documents the pass covers.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Published documents the pass covers. Warm progress ties total, successful draws, skipped failures and current document to one pass revision.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review Published documents the pass covers. Current-pass counters and the cross-pass last failure coexist in one health record with distinct lifetimes.
   */
  total: number;

  /**
   * Documents already drawn, including those found warm.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Documents already drawn, including those found warm. Warm progress ties total, successful draws, skipped failures and current document to one pass revision.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review Documents already drawn, including those found warm. Current-pass counters and the cross-pass last failure coexist in one health record with distinct lifetimes.
   */
  done: number;

  /**
   * Documents whose capture failed.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Documents whose capture failed. Warm progress ties total, successful draws, skipped failures and current document to one pass revision.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review Documents whose capture failed. Current-pass counters and the cross-pass last failure coexist in one health record with distinct lifetimes.
   */
  skipped: number;

  /**
   * Why each skipped document failed.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Why each skipped document failed. Warm progress ties total, successful draws, skipped failures and current document to one pass revision.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review Why each skipped document failed. Current-pass counters and the cross-pass last failure coexist in one health record with distinct lifetimes.
   */
  failures: IHumanViewerWarmFailure[];

  /**
   * Document being warmed, or null between documents.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Document being warmed, or null between documents. Warm progress ties total, successful draws, skipped failures and current document to one pass revision.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review Document being warmed, or null between documents. Current-pass counters and the cross-pass last failure coexist in one health record with distinct lifetimes.
   */
  current: string | null;

  /**
   * The latest failure of any pass, kept when a new pass resets the counters; null before the first.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review The latest failure of any pass, kept when a new pass resets the counters; null before the first. Warm progress ties total, successful draws, skipped failures and current document to one pass revision.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The latest failure of any pass, kept when a new pass resets the counters; null before the first. Current-pass counters and the cross-pass last failure coexist in one health record with distinct lifetimes.
   */
  lastFailure: IHumanViewerWarmLastFailure | null;
}
