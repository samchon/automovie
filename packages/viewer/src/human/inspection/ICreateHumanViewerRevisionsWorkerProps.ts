import type { ICreateHumanViewerRevisionsProps } from "./ICreateHumanViewerRevisionsProps.js";

/**
 * What the server's revision owner needs: the digest inputs and the worker
 * module that computes later batches.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the added member.
 *
 * @evidence contracts/common.md#principled-implementation The asynchronous revision owner adds the actual worker entry to the same source-input contract used by direct revision calculation.
 * @evidence contracts/common.md#clear-and-simple-design Inheritance keeps graph inputs with ICreateHumanViewerRevisionsProps and adds only the worker's launch path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The supplied absolute worker path selects the maintained revision module rather than a fixture-specific calculator.
 *
 * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure The asynchronous revision owner adds the actual worker entry to the same source-input contract used by direct revision calculation.
 * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest The supplied absolute worker path selects the maintained revision module rather than a fixture-specific calculator.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerRevisionsWorkerProps extends ICreateHumanViewerRevisionsProps {
  /**
   * Absolute path of `revisions-worker.mts`.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Locates the maintained asynchronous revision worker that evaluates the same supplied dependency graph.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Locates the maintained asynchronous revision worker that evaluates the same supplied dependency graph.
   */
  worker: string;
}
