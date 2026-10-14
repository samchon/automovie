import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The transported gather candidate returned by `transportHumanFaceHairGatherStep`.
 *
 * The integrator still admits or rejects the proposed point. `normalIntent` records the requested direction's dot product with the supplied normal; contact retraction and the clearance floor can change the actual chord, so that scalar does not certify the final chord's normal component.
 *
 * @evidence contracts/common.md#principled-implementation The candidate records requested normal intent and a carried offset derived from actual output travel, while contact correction can alter the final chord and integrator admission remains required.
 * @evidence contracts/common.md#clear-and-simple-design Point, offset and normal-intent scalar expose the transport result without embedding the integrator's acceptance state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A proposed point is not labeled certified merely because transport returned it; the caller still accepts or refuses the station.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes metre position/offset, requested direction-normal dot product and the corrected actual chord, and states that this remains a proposal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This candidate-result type performs no offset solve; transportHumanFaceHairGatherStep owns the finite scalar and contact calculations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Transport candidates are state-specific outputs, not a cross-step cache of accepted stations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A candidate vector and two scalars retain no collider index or active integration task.
 *
 * @author Samchon
 */
export interface IHumanFaceHairGatherTransport {
  /** Proposed station, in current head-frame metres. */
  point: IAutoMovieVector3;

  /** Free offset from the skin carried to the next step, in metres. */
  offset: number;

  /** Dot product of the requested direction and the outward normal. */
  normalIntent: number;
}
