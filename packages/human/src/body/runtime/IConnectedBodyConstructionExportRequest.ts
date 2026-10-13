/**
 * Explicit static encoding of a constructed draft through the existing guards.
 * Its document remains numerical; source and admission qualification belong
 * to the export result and its separate report.
 *
 * @author Samchon
 */
export interface IConnectedBodyConstructionExportRequest {
  /** Selects guarded encoding of the source owner's constructed model. */
  operation: "exportConstruction";

  /** Original numerical document; no geometry or quality flags are added. */
  document: string;
}
