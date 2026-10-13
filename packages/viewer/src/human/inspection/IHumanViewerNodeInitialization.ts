import type { IHumanViewerNodeWorkerData } from "./IHumanViewerNodeWorkerData.js";

/**
 * Host initialization is distinct from every original product request.
 *
 * @evidence contracts/common.md#principled-implementation An initialize discriminator separates host source startup from personal numerical requests.
 * @evidence contracts/common.md#clear-and-simple-design Initialization adds one envelope around the existing Node startup-input record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The initialization message carries source witnesses rather than a fabricated document or result.
 * @evidence contracts/common.md#meaningful-documentation The input names the original host authority checked before numerical readiness.
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
