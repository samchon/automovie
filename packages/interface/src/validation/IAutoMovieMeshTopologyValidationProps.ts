import type { IAutoMovieMesh } from "../model/IAutoMovieMesh";

/** Borrowed mesh and reporting options for validateMeshTopology. */
export interface IAutoMovieMeshTopologyValidationProps {
  /** Resident mesh in its local metre frame; the check borrows its buffers. */
  mesh: IAutoMovieMesh;

  /** Diagnostic JSON path of the mesh; omission uses `$input`. */
  path?: string;

  /** Require no open edges when true; omission permits an open surface. */
  expectClosed?: boolean;
}
