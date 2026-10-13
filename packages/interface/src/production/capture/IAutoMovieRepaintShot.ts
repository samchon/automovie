import { IAutoMovieDiagnostic } from "../IAutoMovieDiagnostic";
import { IAutoMovieRepaintParameters } from "./IAutoMovieRepaintParameters";
import { IAutoMovieRepaintReceipt } from "./IAutoMovieRepaintReceipt";
import { IAutoMovieRepaintReferenceInput } from "./IAutoMovieRepaintReferenceInput";

/** Result of one optional diffusion rendition request. */
export interface IAutoMovieRepaintShot {
  /** True only after media parsing and atomic receipt commit. */
  repainted: boolean;

  /** True only when a separate guarded selection transaction made it active. */
  selected: boolean;

  /**
   * Immutable request identity that a transport retry resumes, or null when
   * validation refused before a request existed.
   */
  requestId: string | null;

  /** Current production namespace. */
  productionId: string;

  /** Compiled shot id. */
  shot: string;

  /** Accepted receipt, or null on refusal. */
  receipt: IAutoMovieRepaintReceipt | null;

  /** Provisioning or evidence diagnostics, empty on success. */
  diagnostics: IAutoMovieDiagnostic[];
}

/**
 * Result of one optional diffusion rendition request.
 *
 */
export namespace IAutoMovieRepaintShot {
  /** One structure-preserving shot rendition request. */
  export interface IProps {
    /** Exact production namespace owning the shot. */
    productionId: string;

    /** Exact current builder-registry shot id. */
    shot: string;

    /**
     * Fixed non-collapsible role-specific references from the asset manifest.
     */
    references: IAutoMovieRepaintReferenceInput[];

    /** Exact adapter controls stored in the rendition receipt. */
    parameters: IAutoMovieRepaintParameters;
  }
}
