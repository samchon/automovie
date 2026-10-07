/**
 * Explicit static encoding of a constructed draft through the existing guards.
 * Its document remains numerical; source and admission qualification belong
 * to the export result and its separate report.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-export Requests a static asset without treating the construction as an accepted edit.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-export Retains explicit file requests and the normal structural/resource guards.
 * @author Samchon
 */
export interface IConnectedBodyConstructionExportRequest {
  /** Selects guarded encoding of the source owner's constructed model. */
  operation: "exportConstruction";

  /** Original numerical document; no geometry or quality flags are added. */
  document: string;
}
