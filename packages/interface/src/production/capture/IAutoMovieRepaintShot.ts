import { IAutoMovieRepaintParameters } from "./IAutoMovieRepaintParameters";
import { IAutoMovieRepaintReferenceInput } from "./IAutoMovieRepaintReferenceInput";

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
