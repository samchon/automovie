import type { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * What `humanFaceHairContact` builds one curve's contact from.
 *
 * The layer supplies the sampling step and requested clearance; the root and
 * length scale the rounding allowance; the query is the closed collider the
 * contact reads. Positions and lengths are head-frame metres.
 *
 * @evidence contracts/common.md#principled-implementation Supplies exactly the quantities the clearance, allowance and projection are derived from.
 * @evidence contracts/common.md#clear-and-simple-design Named members replace an anonymous parameter object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no tolerance or subject-specific value.
 * @evidence contracts/common.md#meaningful-documentation States what each member contributes and its units.
 * @evidence contracts/modeling.md#spatial-conventions The root and length are head-frame metres.
 * @evidenceExclude contracts/modeling.md#parameter-channels The layer is the admitted hairstyle document; no channel is defined.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#shared-boundaries The query is the one closed host collider every hair proof reads.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical inputs only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission belongs to assertHumanFaceHair.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived inputs and the admitted layer, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairContactSource {
  /** Sampling step and requested clearance of the admitted layer. */
  layer: Pick<IAutoMovieHumanFaceHair.Layer, "samplingStep" | "clearance">;

  /** The curve's root, scaling the rounding allowance. */
  root: IAutoMovieVector3;

  /** The curve's metric length, scaling the rounding allowance. */
  length: number;

  /** Signed query of the closed host collider. */
  query: ReturnType<typeof createAutoMovieSignedMeshQuery>;
}
