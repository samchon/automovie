import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Input and reporting context for a standalone mesh topology check.
 *
 * The check reads caller-owned buffers without changing them. Structural buffer
 * admission belongs to model validation; malformed physical correspondence
 * still refuses rather than yielding a topology verdict. Open surfaces remain
 * supported unless the caller explicitly requires a closed boundary.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Identifies the resident geometry and the caller's closed-surface requirement for standalone topology validation.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Carries the diagnostic root and closure condition used to report actual welded-edge topology.
 * @author Samchon
 */
export interface IAutoMovieMeshTopologyValidationProps {
  /**
   * Resident mesh in its local metre frame; the check borrows its buffers.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Selects the actual triangle geometry whose topology is inspected.
   * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Supplies the buffers and declared physical correspondence to the standalone topology check.
   */
  mesh: IAutoMovieMesh;

  /**
   * Diagnostic JSON path of the mesh; omission uses `$input`.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Locates geometry failures in the caller's validation report.
   * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Preserves a caller-selected root beside each reported topology constraint.
   */
  path?: string;

  /**
   * Require no open edges when true; omission permits an open surface.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Expresses whether this authored mesh must bound a closed surface.
   * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Selects the boundary-edge error condition without weakening manifold or winding checks.
   */
  expectClosed?: boolean;
}
