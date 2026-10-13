import { IAutoMovieDiagnostic } from "../IAutoMovieDiagnostic";
import { IAutoMovieReviewTarget } from "../IAutoMovieReviewTarget";
import { IAutoMovieAssetTurntableView } from "./IAutoMovieAssetTurntableView";

/**
 * Result of capturing the complete review-required turntable of one asset.
 *
 * Every view carries the same proof one captured frame carries: current
 * compilation, decoded pixels, runtime identity, and a receipt the frame
 * reopens through. What this adds is completeness. The asset review requires an
 * exact view set, and reproducing it by hand is where a reviewer silently
 * skipped the angle that would have shown the defect.
 *
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
   * A diagnostic whose `target` reads `<asset>#<view id>` belongs to that one
   * view; a diagnostic targeting the bare asset id refused the whole request
   * before any view was opened.
   */
  diagnostics: IAutoMovieDiagnostic[];
}

/**
 * Result of capturing the complete review-required turntable of one asset.
 *
 * Every view carries the same proof one captured frame carries: current
 * compilation, decoded pixels, runtime identity, and a receipt the frame
 * reopens through. What this adds is completeness. The asset review requires an
 * exact view set, and reproducing it by hand is where a reviewer silently
 * skipped the angle that would have shown the defect.
 *
 * @author Samchon
 */
export namespace IAutoMovieCaptureTurntable {
  /**
   * One complete asset turntable request.
   *
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
