import { IAutoMovieDiagnostic } from "../IAutoMovieDiagnostic";
import { IAutoMovieRepaintParameters } from "./IAutoMovieRepaintParameters";
import { IAutoMovieRepaintReceipt } from "./IAutoMovieRepaintReceipt";
import { IAutoMovieRepaintReferenceInput } from "./IAutoMovieRepaintReferenceInput";

/**
 * Result of one repaint candidate generation, kept separate from guarded active selection.
 *
 * @evidence contracts/common.md#principled-implementation Repaint execution binds current source, references, parameters and adopted runtime to an immutable request and bounded attempts; media-validated atomic candidate publication sets repainted while a separate selection transaction sets selected.
 * @evidence contracts/common.md#clear-and-simple-design Separate generated and selected booleans distinguish candidate existence from active delivery, and nullable request and receipt identify admission failure before a request exists versus later attempt refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A successful candidate does not automatically become active or completed visual review; rejected or stale attempt bytes stay outside accepted receipt lineage and exact diagnostics remain visible.
 * @evidence contracts/common.md#meaningful-documentation Defines generation versus selection effects, immutable retry request identity, production and shot, accepted receipt nulls and attributed refusal diagnostics.
 * @author Samchon
 */
export interface IAutoMovieRepaintShot {
  /** True only after media parsing and atomic receipt commit. */
  repainted: boolean;

  /** True only when a separate guarded selection transaction made it active. */
  selected: boolean;

  /**
   * Immutable request identity that a transport retry resumes, or null when validation refused before a request existed.
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
  /**
   * One shot repaint request with fixed role-specific references and exact generation controls.
   *
   * @evidence contracts/common.md#principled-implementation The host joins the exact production and current registry shot with its service-supplied adapter, generator adoption and execution options, then verifies the request's controls and fixed reference bytes before creating immutable request identity.
   * @evidence contracts/common.md#clear-and-simple-design Input selects shot and appearance guidance while the service configuration owns adapter adoption and execution policy; deterministic source acquisition remains host-owned.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A request cannot substitute arbitrary source geometry or select a provider through its fields. Current compile, frame contract and fixed reference bytes gate it; ProductionDesign.repaint currently supplies no execution reader or automatic adoption check.
   * @evidence contracts/common.md#meaningful-documentation Defines production and shot addressing, non-collapsible manifest references and exact controls retained by the candidate receipt.
   * @author Samchon
   */
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
