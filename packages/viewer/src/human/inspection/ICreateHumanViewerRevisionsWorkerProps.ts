import type { ICreateHumanViewerRevisionsProps } from "./ICreateHumanViewerRevisionsProps.js";

/**
 * What the server's revision owner needs: the digest inputs and the worker module that computes later batches.
 *
 * @evidence contracts/common.md#principled-implementation Extends the canonical digest inputs with the maintained revision-worker entry; initial computation runs on the server and later FIFO batches on that worker.
 * @evidence contracts/common.md#clear-and-simple-design Reuses the base revision input contract rather than copying graph/IO rules into thread scheduling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Worker errors/exits refuse pending and future batches; unref controls server liveness rather than proving worker termination.
 * @evidence contracts/common.md#meaningful-documentation Names the absolute maintained worker module path and inherited source/basis/checked-input authority; actual worker close must be awaited.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The input record performs no work; the consumer computes initial graphs and later replaces reached-path state from worker replies.
 * @evidence contracts/performance.md#reuse-equivalent-work Immediate reads share the latest completed revision reply, while each edit batch carries current bases to the worker-owned recomputation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One worker and uncapped pending batch resolvers belong to the consumer; close drains requests, awaits termination and removes listeners with sticky failure history.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerRevisionsWorkerProps extends ICreateHumanViewerRevisionsProps {
  /** Absolute path of `revisions-worker.ts`. */
  worker: string;
}
