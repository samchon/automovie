import type { IAutoMovieHumanConstructionAdmission } from "../../common/structures/IAutoMovieHumanConstructionAdmission";

/**
 * Guarded static draft bytes paired with their explicit model admission report.
 * Successful encoding does not change the owner's rejected admission outcome.
 *
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
