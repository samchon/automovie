import type { IAutoMovieHumanFaceBasisCorrectiveInput } from "./IAutoMovieHumanFaceBasisCorrectiveInput";

/**
 * One combination corrective of a face basis: the driving sides whose product
 * activates it, its authored gain and the endpoint it applies
 * (`IAutoMovieHumanFaceBasis.correctives` explains the activation).
 *
 * @evidence contracts/common.md#principled-implementation Distinct driving channel sides, an authored positive gain and target endpoint define product activation, with zero contribution when any driver factor is absent. Basis admission verifies every referenced side and endpoint before evaluation.
 * @evidence contracts/common.md#clear-and-simple-design Corrective identity and gain remain here while each optional in-between tent belongs to its Input owner and sparse geometry belongs to surface targets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A sum does not replace the all-driver product, source gains are not muscle mechanics, and a corrective does not automatically prove arbitrary combined poses anatomically valid.
 * @evidence contracts/common.md#meaningful-documentation Fields state identity separation, signed driving sides, gain interval and endpoint ownership, linking the full activation account.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface evaluates no driver product or sparse target.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The authored corrective defines no repeated-pose cache or reused activation result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis owns its driver array; the type retains no posed buffers or runtime task.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisCorrective {
  /** Name unique within this basis, distinct from every channel id. */
  id: string;

  /**
   * The driving sides. Each names a channel and which of its two endpoints
   * this corrective answers for, because a signed channel reaches two
   * different faces and a combination of one is not a combination of the
   * other.
   */
  inputs: IAutoMovieHumanFaceBasisCorrectiveInput[];

  /** Authored gain in (0,1]; the product of a rig row's authored weights. */
  weight: number;

  /** Endpoint name, resolved in each surface's targets like any other. */
  target: string;
}
