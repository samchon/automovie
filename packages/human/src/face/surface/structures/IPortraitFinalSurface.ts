import type { IPortraitFinalSurfaceHost } from "./IPortraitFinalSurfaceHost";

/**
 * One component's requested final positions; shared attachments use the same IDs. Read the deeply frozen post-layer host and return finite millimetre targets for resident vertices. The coordinator copies proposals immediately and refuses different exact targets for the same vertex before applying them.
 *
 * @evidence contracts/common.md#principled-implementation Resident vertex/XYZ proposals defer component shaping until the common post-layer snapshot exists; exact per-vertex composition preserves shared attachment identity.
 * @evidence contracts/common.md#clear-and-simple-design This callback proposes positions only; the coordinator owns conflicts and application, while downstream assembly owns normal recomputation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A proposal cannot add topology, and competing targets do not choose an order-based winner; provider anatomy and external side effects remain its own responsibility.
 * @evidence contracts/common.md#meaningful-documentation Prose states frozen input, millimetres, resident identity and finite exact-target admission; returned rows are copied by the owner.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This proposal signature executes no shaping or composition pass; concrete providers and the final-surface coordinator own those algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The erased callback type implements no proposal cache or shared snapshot coordinator; the owning assembly supplies one unchanged host.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature allocates no snapshot or proposal rows; producers and their composition owner control actual buffers and retention.
 * @author Samchon
 */
export type IPortraitFinalSurface = (
  host: IPortraitFinalSurfaceHost,
) => readonly {
  /** Existing shared vertex identity; final shaping never adds topology here. */
  vertex: number;

  /** Requested XYZ in the host's millimetre frame. */
  target: readonly number[];
}[];
