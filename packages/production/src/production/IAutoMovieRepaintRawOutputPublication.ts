import { IAutoMovieRepaintRawOutputReceipt } from "./IAutoMovieRepaintRawOutputReceipt";

/**
 * Raw output plus the copied bytes that an atomic project transaction writes.
 *
 * The planner owns a detached byte copy and a receipt covering that exact view. The caller must preserve their agreement until publication; TypeScript readonly/freeze guarantees are not added by this interface.
 *
 * @evidence contracts/common.md#principled-implementation Receipt metadata and exact byte view travel together to the project's atomic raw publication and later resumption validator.
 * @evidence contracts/common.md#clear-and-simple-design One pair supplies storage without embedding provider execution, media admission or candidate selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pair construction alone publishes nothing and mutable bytes can invalidate their digest; the transaction revalidates actual receipt/bytes.
 * @evidence contracts/common.md#meaningful-documentation Prose gives detached-planner ownership and the caller's obligation to preserve receipt/byte agreement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no byte copy, hash or atomic write.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pair type implements no shared raw-output cache or transaction reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased schema acquires no buffers or descriptors; the planner transfers actual bytes to the caller/project.
 * @author Samchon
 */
export interface IAutoMovieRepaintRawOutputPublication {
  /** Receipt describing the bytes published beside it. */
  receipt: IAutoMovieRepaintRawOutputReceipt;

  /** Exact raw bytes the receipt's digest covers. */
  bytes: Uint8Array;
}
