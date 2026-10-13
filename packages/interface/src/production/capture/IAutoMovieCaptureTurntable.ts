import { IAutoMovieDiagnostic } from "../IAutoMovieDiagnostic";
import { IAutoMovieReviewTarget } from "../IAutoMovieReviewTarget";
import { IAutoMovieAssetTurntableView } from "./IAutoMovieAssetTurntableView";

/**
 * Result of capturing the complete review-required turntable of one asset.
 *
 * Every required view uses the verified frame-capture path; the aggregate adds complete canonical view coverage rather than a weaker pixel proof.
 *
 * @evidence contracts/common.md#principled-implementation The host reads actual compiled rig presence, derives the review-required view set and captures views sequentially through current registry and receipt reopening; aggregate captured is true only when every view has committed pixels.
 * @evidence contracts/common.md#clear-and-simple-design A complete view summary and diagnostics expose partial refusal while retaining the same asset review target, avoiding an independent turntable renderer or weaker receipt format.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unreadable assets refuse before view planning and failed required angles remain null; callers cannot replace them with easier views or satisfy whole-model review through a framed part.
 * @evidence contracts/common.md#meaningful-documentation Defines all-view success, canonical population, review ownership and whole-request versus view-attributed diagnostics.
 * @author Samchon
 */
export interface IAutoMovieCaptureTurntable {
  /** True only when every required view committed verified current pixels. */
  captured: boolean;

  /** Production namespace used for the attempt. */
  productionId: string;

  /** Review surface whose current evidence changed, or null when none did. */
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
 * Result of capturing the complete review-required turntable of one asset.
 *
 * Every view carries the same proof one captured frame carries: current compilation, decoded pixels, runtime identity, and a receipt the frame reopens through. What this adds is completeness. The asset review requires an exact view set, and reproducing it by hand is where a reviewer silently skipped the angle that would have shown the defect.
 *
 * @author Samchon
 */
export namespace IAutoMovieCaptureTurntable {
  /**
   * One complete asset turntable request.
   *
   * @evidence contracts/common.md#principled-implementation Registry-owned asset identity selects the compiled model whose rig determines required views; the host supplies that complete set and validates optional production-bound raster dimensions.
   * @evidence contracts/common.md#clear-and-simple-design The request names asset, namespace and raster only, leaving mandatory camera angles and poses with the review contract rather than another caller-owned list.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No optional angle list can under-cover the asset, and absent namespace resolves only through an existing host default rather than inventing a production.
   * @evidence contracts/common.md#meaningful-documentation Defines registry asset, optional namespace/default requirement and positive bounded raster dimensions.
   * @author Samchon
   */
  export interface IProps {
    /** Optional production namespace; required when the host has no default. */
    productionId?: string;

    /** Registry-owned asset id. */
    asset: string;

    /** Optional positive integer width no larger than production width. */
    width?: number;

    /** Optional positive integer height no larger than production height. */
    height?: number;
  }
}
