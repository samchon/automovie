import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFacePoseResult } from "./IHumanFacePoseResult";

/**
 * What the face assembly census reads: the compiled basis, the evaluated pose
 * that produced the model, and the complete model itself.
 *
 * The model is held by reference and read when admission runs, after hair has
 * been composed, so the census covers every part the consumer receives.
 *
 * @evidence contracts/common.md#principled-implementation Compiled basis registrations, exact evaluated pose and the fully composed model identify the same build for readHumanFaceAssemblyClearances.
 * @evidence contracts/common.md#clear-and-simple-design One census input joins source/pose correspondence with final consumer parts after hair composition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Model-by-reference reading occurs at admission, avoiding an earlier incomplete part list; report-only relations still certify no anatomical bounds.
 * @evidence contracts/common.md#meaningful-documentation Prose states timing, reference ownership and complete model versus source/pose responsibilities.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input implements no census; its clearance readers own query/crossing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; census owners reuse actual immutable references where supported.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; build-owned closures retain the referenced model until admission completes.
 *
 * @author Samchon
 */
export interface IHumanFaceAssemblyCensusInput {
  /** Compiled source basis whose surfaces and registrations name the references. */
  basis: IAutoMovieHumanFaceBasis;

  /** Evaluated pose: final positions, generated optics and the oral assembly. */
  pose: IHumanFacePoseResult;

  /** Complete constructed model, read when admission runs. */
  model: IAutoMovieModel;
}
