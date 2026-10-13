import type { ICreateHumanViewerRevisionsProps } from "./ICreateHumanViewerRevisionsProps.js";

/**
 * What the server's revision owner needs: the digest inputs and the worker
 * module that computes later batches.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerRevisionsWorkerProps extends ICreateHumanViewerRevisionsProps {
  /** Absolute path of `revisions-worker.mts`. */
  worker: string;
}
