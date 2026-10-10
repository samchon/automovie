import type { IHumanViewerNodeWorkerData } from "./IHumanViewerNodeWorkerData";

/** Host initialization is distinct from every original product request. @author Samchon */
export interface IHumanViewerNodeInitialization {
  type: "initialize";

  /** Original host source witness, checked before numerical readiness. */
  input: IHumanViewerNodeWorkerData;
}
