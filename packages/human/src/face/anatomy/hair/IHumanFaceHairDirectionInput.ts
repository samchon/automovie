import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * Current neutral-frame inputs to the shared static hair direction field.
 * The admitted layer owns styling values; contact remains with the integrator.
 *
 * @evidence contracts/common.md#principled-implementation The existing direction field receives the same admitted layer and current root, normal, arc distance and phase.
 * @evidence contracts/common.md#clear-and-simple-design One named input owns the field evaluation's context, without moving its formulas.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no direction, neutral coordinate or contact fallback.
 * @evidence contracts/common.md#meaningful-documentation States the layer admission, metre frame, unit normal and radian phase.
 * @evidence contracts/modeling.md#spatial-conventions Root and arc distance remain head-frame metres; the normal is unit length and phase radians.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Transports a field query and creates no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The admitted layer owns styling channels; this helper input introduces none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The integrator and current host own contact.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair assembly owns rendered observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries existing numerical context without inferring a physiological quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Layer admission remains with the existing validator.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Transports the existing integrator context without adding a personal input.
 * @author Samchon
 */
export interface IHumanFaceHairDirectionInput {
  /** Admitted styling layer, with metre lengths and radian angles. */
  layer: IAutoMovieHumanFaceHair.Layer;
  /** Neutral head-frame root position, metres. */
  root: IAutoMovieVector3;
  /** Current unit outward host normal. */
  normal: IAutoMovieVector3;
  /** Accumulated centreline arc length, metres. */
  distance: number;
  /** Seeded curl phase, radians. */
  phase: number;
}
