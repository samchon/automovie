import { AutoMovieGuidePass } from "../../cinematics/AutoMovieGuidePass";
import { IAutoMovieDiagnostic } from "../IAutoMovieDiagnostic";
import { IAutoMovieReviewTarget } from "../IAutoMovieReviewTarget";
import { AutoMovieCaptureTarget } from "./AutoMovieCaptureTarget";
import { IAutoMovieCaptureReceipt } from "./IAutoMovieCaptureReceipt";

/**
 * One current registry-owned evidence-frame capture or explicit refusal.
 *
 * @evidence contracts/common.md#principled-implementation Capture resolves current production registry membership, delegates decoded PNG generation to the oracle and reopens the committed bundle through its exact target and frame receipt before returning success.
 * @evidence contracts/common.md#clear-and-simple-design Success groups frame metadata and receipt beside the affected review target, while refusal nulls both and supplies attributed diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Provider-reported pixels alone are insufficient; stale target or receipt identity and non-reopenable output refuse instead of manufacturing evidence metadata.
 * @evidence contracts/common.md#meaningful-documentation Defines verified capture effect, production and review ownership, receipt and frame refusal nulls, snapped time and exact PNG identity.
 * @author Samchon
 */
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
    digest: string;

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
  /**
   * One registry-target frame request with optional bounded raster dimensions.
   *
   * @evidence contracts/common.md#principled-implementation A closed target selects current shot time or asset turntable state; optional positive dimensions configure the existing production-bound PNG capture path.
   * @evidence contracts/common.md#clear-and-simple-design Request fields remain grouped under the capture result's namespace so one public file identity exposes the paired input and output contract.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Dimensions cannot exceed admitted production raster limits, and no arbitrary scene graph or file output enters through this request.
   * @evidence contracts/common.md#meaningful-documentation Defines exact target ownership and optional positive integer raster bounds.
   * @author Samchon
   */
  export interface IProps {
    /** Compiler-registry target and its frame identity. */
    target: AutoMovieCaptureTarget;

    /** Optional positive integer width no larger than production width. */
    width?: number;

    /** Optional positive integer height no larger than production height. */
    height?: number;
  }
}
