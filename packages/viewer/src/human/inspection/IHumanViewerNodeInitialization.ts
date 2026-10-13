import type { IHumanViewerNodeWorkerData } from "./IHumanViewerNodeWorkerData.js";

/**
 * Host initialization is distinct from every original product request.
 *
 * @author Samchon
 */
export interface IHumanViewerNodeInitialization {
  /**
   * Host-startup message discriminant, separate from numerical document requests.
   */
  type: "initialize";

  /** Original host source witness, checked before numerical readiness. */
  input: IHumanViewerNodeWorkerData;
}
