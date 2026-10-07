import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";

/**
 * Guarded static draft bytes paired with their explicit model admission report.
 * Successful encoding does not change the owner's rejected admission outcome.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-export Returns the constructed static asset with qualification separate from accepted document history.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-export Preserves actual export refusal and model admission as distinct results.
 * @author Samchon
 */
export interface IConnectedBodyConstructionExportResult {
  /** Matches the explicit draft encoding request. */
  operation: "exportConstruction";

  /** Owned static GLB bytes after normal export guards passed. */
  glb: Uint8Array<ArrayBuffer>;

  /** Admission of the exact constructed model encoded in these bytes. */
  admission: IAutoMovieHumanConstructionAdmission;
}
