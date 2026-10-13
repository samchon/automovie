import { AutoMovieGuidePass } from "../../cinematics/AutoMovieGuidePass";
import { AutoMovieContentDigest } from "../AutoMovieContentDigest";
import { IAutoMovieDiagnostic } from "../IAutoMovieDiagnostic";
import { IAutoMovieReviewTarget } from "../IAutoMovieReviewTarget";
import { AutoMovieCaptureTarget } from "./AutoMovieCaptureTarget";
import { IAutoMovieCaptureReceipt } from "./IAutoMovieCaptureReceipt";

/** Result of producing one actual current evidence frame. */
export interface IAutoMovieCaptureFrame {
  /**
   * True only after decoded pixels and their receipt are atomically committed.
   */
  captured: boolean;

  /** Production namespace used for the attempt. */
  productionId: string;

  /** Review surface whose current evidence changed, when captured. */
  reviewTarget: IAutoMovieReviewTarget | null;

  /** Verified receipt, or null on refusal. */
  receipt: IAutoMovieCaptureReceipt | null;

  /** Verified current PNG, or null on refusal. */
  frame: {
    /** Snapped frame index. */
    index: number;

    /** Snapped time in seconds. */
    time: number;

    /** Captured pass. */
    pass: AutoMovieGuidePass;

    /** Project-relative PNG path. */
    path: string;

    /** Exact PNG digest. */
    digest: AutoMovieContentDigest;

    /** Decoded pixel width. */
    width: number;

    /** Decoded pixel height. */
    height: number;
  } | null;

  /** Exact refusal diagnostics, empty on success. */
  diagnostics: IAutoMovieDiagnostic[];
}

/**
 * Result of producing one actual current evidence frame.
 *
 */
export namespace IAutoMovieCaptureFrame {
  /** One actual evidence-frame request. */
  export interface IProps {
    /** Compiler-registry target and its frame identity. */
    target: AutoMovieCaptureTarget;

    /** Optional positive integer width no larger than production width. */
    width?: number;

    /** Optional positive integer height no larger than production height. */
    height?: number;
  }
}
