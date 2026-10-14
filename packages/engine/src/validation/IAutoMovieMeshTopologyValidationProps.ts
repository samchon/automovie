import { IAutoMovieMesh } from "@automovie/interface";
/**
 * Borrowed mesh and reporting options for validateMeshTopology.
 *
 * @evidence contracts/common.md#principled-implementation The shared topology owner resolves explicit physical correspondence or welds legacy positions before checking edge incidence and winding; structural admission remains validateModel's responsibility.
 * @evidence contracts/common.md#clear-and-simple-design Path and expectClosed separate reporting context and optional watertightness from the mesh's local buffers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed explicit correspondence remains a named refusal even beside malformed buffers; an open surface is permitted when expectClosed is absent or false.
 * @evidence contracts/common.md#meaningful-documentation States borrowed local-metre data, default $input path and optional closed-boundary requirement, without promising self-intersection or positive-area proof.
 * @evidence contracts/performance.md#efficient-algorithms This input record performs no weld or edge scan; appendMeshTopology owns the population-dependent work.
 * @evidence contracts/performance.md#reuse-equivalent-work Both model and standalone validation delegate to one topology calculation, while this record carries no reusable verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-owned arrays remain borrowed for the synchronous pass, and the options retain no renderer, geometry allocation or native handle.
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
