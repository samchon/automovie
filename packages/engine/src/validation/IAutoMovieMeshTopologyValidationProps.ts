import { IAutoMovieMesh } from "@automovie/interface";

/**
 * Borrowed mesh and reporting options for validateMeshTopology.
 *
 * @evidence contracts/development/design.md#principled-representation The shared topology owner resolves explicit physical correspondence or welds legacy positions before checking edge incidence and winding; structural admission remains validateModel's responsibility.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Path and expectClosed separate reporting context and optional watertightness from the mesh's local buffers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Malformed explicit correspondence remains a named refusal even beside malformed buffers; an open surface is permitted when expectClosed is absent or false.
 * @evidence contracts/development/common.md#meaningful-documentation States borrowed local-metre data, default $input path and optional closed-boundary requirement, without promising self-intersection or positive-area proof.
 */
export interface IAutoMovieMeshTopologyValidationProps {
  /** Resident mesh in its local metre frame; the check borrows its buffers. */
  mesh: IAutoMovieMesh;

  /** Diagnostic JSON path of the mesh; omission uses `$input`. */
  path?: string;

  /** Require no open edges when true; omission permits an open surface. */
  expectClosed?: boolean;
}
