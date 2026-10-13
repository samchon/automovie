import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Input and reporting context for a standalone mesh topology check.
 *
 * The check reads caller-owned buffers without changing them. Structural buffer
 * admission belongs to model validation; malformed physical correspondence
 * still refuses rather than yielding a topology verdict. Open surfaces remain
 * supported unless the caller explicitly requires a closed boundary.
 *
 * @author Samchon
 */
export interface IAutoMovieMeshTopologyValidationProps {
  /** Resident mesh in its local metre frame; the check borrows its buffers. */
  mesh: IAutoMovieMesh;

  /** Diagnostic JSON path of the mesh; omission uses `$input`. */
  path?: string;

  /** Require no open edges when true; omission permits an open surface. */
  expectClosed?: boolean;
}
