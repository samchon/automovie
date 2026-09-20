import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";
import { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * An actual PNG frame bound to a compile and render bundle.
 *
 * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `IAutoMoviePreviewFrameOutput` as the portable data boundary for the agent contract guidance requirement.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `IAutoMoviePreviewFrameOutput` for the spec authoring knowledge request output system contract.
 */
export interface IAutoMoviePreviewFrameOutput {
  /**
   * True only after current decodable, dimension-matching PNG bytes with
   * visible pixel variance are verified and committed to a render bundle.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `captured` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `captured` for the spec authoring knowledge request output system contract.
   */
  captured: boolean;

  /**
   * Current compile fingerprint.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `compileFingerprint` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `compileFingerprint` for the spec authoring knowledge request output system contract.
   */
  compileFingerprint: AutoMovieContentDigest;

  /**
   * Project-relative content-addressed render bundle, or null on any refusal.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `renderBundle` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `renderBundle` for the spec authoring knowledge request output system contract.
   */
  renderBundle: string | null;

  /**
   * Verified frame metadata or null on refusal.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `frame` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `frame` for the spec authoring knowledge request output system contract.
   */
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

  /**
   * Exact capture refusal diagnostics and correction, empty on success.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `diagnostics` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `diagnostics` for the spec authoring knowledge request output system contract.
   */
  diagnostics: IAutoMovieDiagnostic[];
}
