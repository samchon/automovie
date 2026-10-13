import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";

/** An actual PNG frame bound to a compile and render bundle. */
export interface IAutoMoviePreviewFrameOutput {
  /**
   * True only after current decodable, dimension-matching PNG bytes with
   * visible pixel variance are verified and committed to a render bundle.
   */
  captured: boolean;

  /** Current compile fingerprint. */
  compileFingerprint: AutoMovieContentDigest;

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
    digest: AutoMovieContentDigest;

    /** Pixel width. */
    width: number;

    /** Pixel height. */
    height: number;
  } | null;

  /** Exact capture refusal diagnostics and correction, empty on success. */
  diagnostics: IAutoMovieDiagnostic[];
}
