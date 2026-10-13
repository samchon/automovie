import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";
import { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";

/**
 * A verified PNG capture bound to its current compile and render bundle, or an explicit refusal.
 *
 * @evidence contracts/common.md#principled-implementation The oracle decodes capture bytes, checks requested and reported dimensions and visible pixel variance, and commits content-addressed render evidence only after current compile and capture identities agree.
 * @evidence contracts/common.md#clear-and-simple-design Success metadata groups one frame and bundle beside compile identity, while captured false uses null frame and bundle with attributed correction diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adapter success alone is insufficient: undecodable, wrong-size, flat or stale output refuses instead of fabricating a capture receipt.
 * @evidence contracts/common.md#meaningful-documentation Defines verified-success conditions, refusal nulls, project-relative bundle and PNG paths, raw byte digest and frame and raster units.
 * @author Samchon
 */
export interface IAutoMoviePreviewFrameOutput {
  /**
   * True only after current decodable, dimension-matching PNG bytes with visible pixel variance are verified and committed to a render bundle.
   */
  captured: boolean;

  /** Current compile fingerprint. */
  compileFingerprint: string;

  /**
   * Project-relative content-addressed render bundle, or null on any refusal.
   */
  renderBundle: string | null;

  /** Verified frame metadata or null on refusal. */
  frame: {
    /** Zero-based frame index. */
    index: number;

    /** Frame time in seconds. */
    time: number;

    /** Render pass. */
    pass: AutoMovieGuidePass;

    /** Project-relative PNG path. */
    path: string;

    /** Raster media type. */
    mime: "image/png";

    /** Raw PNG digest. */
    digest: string;

    /** Pixel width. */
    width: number;

    /** Pixel height. */
    height: number;
  } | null;

  /** Exact capture refusal diagnostics and correction, empty on success. */
  diagnostics: IAutoMovieDiagnostic[];
}
