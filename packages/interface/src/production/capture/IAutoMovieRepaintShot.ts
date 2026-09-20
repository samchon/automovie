import { IAutoMovieRepaintParameters } from "./IAutoMovieRepaintParameters";
import { IAutoMovieRepaintReferenceInput } from "./IAutoMovieRepaintReferenceInput";
import { IAutoMovieDiagnostic } from "../IAutoMovieDiagnostic";
import { IAutoMovieRepaintReceipt } from "./IAutoMovieRepaintReceipt";

/**
 * Result of one optional diffusion rendition request.
 *
 * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `IAutoMovieRepaintShot` as the portable data boundary for the repaint reference roles requirement.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `IAutoMovieRepaintShot` for the asset spec repaint controls references system contract.
 */
export interface IAutoMovieRepaintShot {
  /**
   * True only after media parsing and atomic receipt commit.
   *
   * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `repainted` as the portable data boundary for the repaint reference roles requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `repainted` for the asset spec repaint controls references system contract.
   */
  repainted: boolean;

  /** True only when a separate guarded selection transaction made it active. */
  selected: boolean;

  /**
   * Immutable request identity that a transport retry resumes, or null when
   * validation refused before a request existed.
   *
   * @evidence requirements/repaint/retries-seeds-and-variation.md#repaint-retry-request-boundary Makes a failed attempt addressable by the explicit retry operation without changing its request controls.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-attempt-selection Returns the stable request side of the stored request/attempt lineage.
   */
  requestId: string | null;

  /**
   * Current production namespace.
   *
   * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `productionId` as the portable data boundary for the repaint reference roles requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `productionId` for the asset spec repaint controls references system contract.
   */
  productionId: string;

  /**
   * Compiled shot id.
   *
   * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `shot` as the portable data boundary for the repaint reference roles requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `shot` for the asset spec repaint controls references system contract.
   */
  shot: string;

  /**
   * Accepted receipt, or null on refusal.
   *
   * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `receipt` as the portable data boundary for the repaint reference roles requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `receipt` for the asset spec repaint controls references system contract.
   */
  receipt: IAutoMovieRepaintReceipt | null;

  /**
   * Provisioning or evidence diagnostics, empty on success.
   *
   * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `diagnostics` as the portable data boundary for the repaint reference roles requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `diagnostics` for the asset spec repaint controls references system contract.
   */
  diagnostics: IAutoMovieDiagnostic[];
}

/**
 * Result of one optional diffusion rendition request.
 *
 * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `IAutoMovieRepaintShot` as the portable data boundary for the repaint reference roles requirement.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `IAutoMovieRepaintShot` for the asset spec repaint controls references system contract.
 */
export namespace IAutoMovieRepaintShot {
  /**
   * One structure-preserving shot rendition request.
   *
   * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `IProps` as the portable data boundary for the repaint reference roles requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `IProps` for the asset spec repaint controls references system contract.
   */
  export interface IProps {
    /**
     * Exact production namespace owning the shot.
     *
     * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `productionId` as the portable data boundary for the repaint reference roles requirement.
     * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `productionId` for the asset spec repaint controls references system contract.
     */
    productionId: string;

    /**
     * Exact current builder-registry shot id.
     *
     * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `shot` as the portable data boundary for the repaint reference roles requirement.
     * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `shot` for the asset spec repaint controls references system contract.
     */
    shot: string;

    /**
     * Fixed non-collapsible role-specific references from the asset manifest.
     *
     * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `references` as the portable data boundary for the repaint reference roles requirement.
     * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `references` for the asset spec repaint controls references system contract.
     */
    references: IAutoMovieRepaintReferenceInput[];

    /**
     * Exact adapter controls stored in the rendition receipt.
     *
     * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `parameters` as the portable data boundary for the repaint reference roles requirement.
     * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `parameters` for the asset spec repaint controls references system contract.
     */
    parameters: IAutoMovieRepaintParameters;
  }
}
