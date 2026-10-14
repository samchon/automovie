import { AutoMovieGuidePass } from "../../cinematics/AutoMovieGuidePass";
import { IAutoMovieDiagnostic } from "../IAutoMovieDiagnostic";
import { IAutoMovieReviewTarget } from "../IAutoMovieReviewTarget";
import { AutoMovieCaptureTarget } from "./AutoMovieCaptureTarget";
import { IAutoMovieCaptureReceipt } from "./IAutoMovieCaptureReceipt";

/**
 * Retained frame-capture result contract; no current repository producer returns this shape after removal of the legacy capture orchestrator.
 *
 * @evidence contracts/common.md#principled-implementation The erased record groups intended capture outcome, production/review identity, receipt, PNG metadata and diagnostics. Its retained contract describes committed-frame success and refusal, but no current producer establishes those effects for this type.
 * @evidence contracts/common.md#clear-and-simple-design Receipt and frame are nullable within one result rather than copying host state into the authoring AST; active Oracle preview and capture bundles use their separate current contracts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplying this shape alone does not verify PNG bytes, current registry membership or committed receipt identity. Removal of its legacy producer is not compensated by a new host or fabricated success.
 * @evidence contracts/common.md#meaningful-documentation Defines the retained field meanings, refusal nulls, frame units and intended receipt relation, with current producer absence explicit.
 * @author Samchon
 */
export interface IAutoMovieCaptureFrame {
  /**
   * Intended committed-frame success flag; this type has no current producer enforcing it.
   */
  captured: boolean;

  /** Production namespace used for the attempt. */
  productionId: string;

  /** Review surface attributed to the intended capture, or null. */
  reviewTarget: IAutoMovieReviewTarget | null;

  /** Intended capture receipt, or null on refusal; presence alone is not verification. */
  receipt: IAutoMovieCaptureReceipt | null;

  /** Intended PNG metadata, or null on refusal; bytes are not reopened by this type. */
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
 * Input paired with the retained, currently unproduced frame-result contract.
 *
 */
export namespace IAutoMovieCaptureFrame {
  /**
   * One registry-target frame request with optional bounded raster dimensions.
   *
   * @evidence contracts/common.md#principled-implementation A closed target and optional dimensions describe the retained request shape; shot/frame or asset state remains explicit, but no current frame-result producer consumes this request.
   * @evidence contracts/common.md#clear-and-simple-design Request fields remain grouped under the capture result's namespace so one public file identity exposes the paired input and output contract.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Intended positive production-bounded dimensions remain documented author obligations; the erased request supplies no active range gate, arbitrary scene graph, output effect or verified receipt.
   * @evidence contracts/common.md#meaningful-documentation Defines target ownership, intended positive integer raster bounds and current request-consumer absence.
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
