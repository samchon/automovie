import type { ICreateHumanViewerRevisionsProps } from "./ICreateHumanViewerRevisionsProps";

/**
 * What the server's revision owner needs: the digest inputs and the worker
 * module that computes later batches.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the added member.
 * @author Samchon
 */
export interface ICreateHumanViewerRevisionsWorkerProps extends ICreateHumanViewerRevisionsProps {
  /** Absolute path of `revisions-worker.mts`. */
  worker: string;
}
