import { IAutoMovieDiagnostic } from "../IAutoMovieDiagnostic";
import { IAutoMovieRepaintParameters } from "./IAutoMovieRepaintParameters";
import { IAutoMovieRepaintReceipt } from "./IAutoMovieRepaintReceipt";
import { IAutoMovieRepaintReferenceInput } from "./IAutoMovieRepaintReferenceInput";

/**
 * Retained repaint candidate result shape; its former generation and selection host has been removed.
 *
 * @evidence contracts/common.md#principled-implementation Separate result flags describe intended candidate publication and active selection, alongside request identity, receipt and diagnostics; no current product producer establishes these effects.
 * @evidence contracts/common.md#clear-and-simple-design Separate generated and selected booleans distinguish candidate existence from active delivery, and nullable request and receipt identify admission failure before a request exists versus later attempt refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplied success flags and receipts prove no publication, byte admission, selection or visual review; the retained type supplies no replacement execution path.
 * @evidence contracts/common.md#meaningful-documentation Defines generation versus selection effects, immutable retry request identity, production and shot, accepted receipt nulls and attributed refusal diagnostics.
 * @author Samchon
 */
export interface IAutoMovieRepaintShot {
  /** Intended media-parsed and atomically committed candidate status; no current producer enforces it. */
  repainted: boolean;

  /** Intended active selection status from a separate transaction; this type performs none. */
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
   * @evidence contracts/common.md#principled-implementation Production and shot strings address the intended source, while references and parameters describe appearance guidance; this erased request performs no registry, byte or adoption validation.
   * @evidence contracts/common.md#clear-and-simple-design Input contains shot identity and appearance guidance without embedding provider configuration, execution policy or deterministic source acquisition.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The shape provides no arbitrary geometry or provider field, but it also supplies no compile, frame, reference or adoption gate; the former execution host has been removed.
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
