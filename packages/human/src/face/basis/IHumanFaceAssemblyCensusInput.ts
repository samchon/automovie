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
 * @evidence contracts/common.md#principled-implementation The census reads the same model object the builder returns, so its population cannot differ from the delivered parts.
 * @evidence contracts/common.md#clear-and-simple-design Three references name the whole input of the census.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no part filter, threshold or side selector.
 * @evidence contracts/common.md#meaningful-documentation States why the model is read late.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Transports an existing model.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The referenced owners keep head-frame metres; nothing converts here.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Transports geometry to a reader.
 * @evidenceExclude contracts/modeling.md#rendered-observation Transport to a numerical reader.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no authoring input.
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
