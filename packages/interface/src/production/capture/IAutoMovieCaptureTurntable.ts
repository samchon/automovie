import { IAutoMovieDiagnostic } from "../IAutoMovieDiagnostic";
import { IAutoMovieReviewTarget } from "../IAutoMovieReviewTarget";
import { IAutoMovieAssetTurntableView } from "./IAutoMovieAssetTurntableView";

/**
 * Retained complete-turntable result contract; its legacy orchestrator has been removed and no current repository producer returns this shape.
 *
 * Views describe intended canonical coverage, while supplied result fields alone prove neither capture completion nor image provenance.
 *
 * @evidence contracts/common.md#principled-implementation The record expresses intended all-view completion using one asset review target, ordered view rows and diagnostics. The active asset-review descriptor factory remains separate; no current producer computes this aggregate's capture success.
 * @evidence contracts/common.md#clear-and-simple-design Partial and whole-request outcomes share the retained result shape without adding a renderer or duplicating full frame receipts into every row.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A supplied true flag or nonnull frame path establishes no decoded pixel, current receipt or complete view coverage; producer removal introduces no alternate capture host or weaker success path.
 * @evidence contracts/common.md#meaningful-documentation Defines intended all-view success, canonical population, attribution and view-specific diagnostics while stating current producer absence.
 * @author Samchon
 */
export interface IAutoMovieCaptureTurntable {
  /** Intended all-required-view success flag; no current producer enforces it. */
  captured: boolean;

  /** Production namespace used for the attempt. */
  productionId: string;

  /** Review surface attributed to the intended request, or null. */
  reviewTarget: IAutoMovieReviewTarget | null;

  /** Every required view in canonical order, captured or not. */
  views: IAutoMovieAssetTurntableView[];

  /**
   * Exact refusal diagnostics, empty on success.
   *
   * A diagnostic whose `target` reads `<asset>#<view id>` belongs to that one view; a diagnostic targeting the bare asset id refused the whole request before any view was opened.
   */
  diagnostics: IAutoMovieDiagnostic[];
}

/**
 * Input paired with the retained, currently unproduced complete-turntable result.
 *
 * This namespace preserves the authored asset, optional namespace and raster request. It creates no capture, currentness check or all-view receipt.
 *
 * @author Samchon
 */
export namespace IAutoMovieCaptureTurntable {
  /**
   * One complete asset turntable request.
   *
   * @evidence contracts/common.md#principled-implementation Asset and optional namespace identify the intended target, with optional raster dimensions; no current turntable-result producer resolves these fields or applies the former host's gates.
   * @evidence contracts/common.md#clear-and-simple-design The request names asset, namespace and raster only, leaving mandatory camera angles and poses with the review contract rather than another caller-owned list.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The request exposes no caller-selected angle list, but the retained shape alone supplies neither a namespace default nor verified coverage. No replacement host is added for the removed producer.
   * @evidence contracts/common.md#meaningful-documentation Defines intended asset ownership, namespace omission and positive production-bounded raster obligations, including the current absence of execution.
   * @author Samchon
   */
  export interface IProps {
    /** Intended production namespace; omission needs a consumer-owned default, which this type does not provide. */
    productionId?: string;

    /** Registry-owned asset id. */
    asset: string;

    /** Optional positive integer width no larger than production width. */
    width?: number;

    /** Optional positive integer height no larger than production height. */
    height?: number;
  }
}
