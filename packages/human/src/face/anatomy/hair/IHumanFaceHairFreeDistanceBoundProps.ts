import type { IAutoMovieVector3 } from "@automovie/interface";

/** Existing same-frame signed-distance lower-bound inputs, in metres.
 *
 * @evidence contracts/common.md#principled-implementation Separates the measured sample, candidate and caller-owned contact threshold so the bound preserves their distinct roles.
 * @evidence contracts/common.md#clear-and-simple-design One input record is shared by the existing integrator, projector and ribbon-width bound.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries the caller sample and allowance without inferred defaults or subject identity.
 * @evidence contracts/common.md#meaningful-documentation Same-frame geometric contact inputs preserve metre units; the function owns the bound rather than anatomical admission.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no anatomical part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels Transports computational inputs and defines no form-varying channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Defines no primitive population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Constructs no joined surface or volume.
 * @evidenceExclude contracts/modeling.md#rendered-observation Owns no displayed part or joint; the assembled consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Establishes no anatomical quantity or physiological source.
 * @evidenceExclude contracts/anatomy.md#permitted-range Owns no physiological range; anatomical admission remains with its input owner.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no public measurement or physiological control for shaping a person.
 * @evidence contracts/modeling.md#spatial-conventions Points and distances retain the caller common metre frame without conversion.
 * @author Samchon
 */
export interface IHumanFaceHairFreeDistanceBoundProps {
  /** Point at which the same surface's signed distance was measured, in metres. */
  sampled: IAutoMovieVector3;

  /** Signed sample distance in metres, positive on the oriented exterior. */
  distance: number;

  /** Unqueried point in the sample's metre frame. */
  candidate: IAutoMovieVector3;

  /** Required free distance in metres from the caller's contact rule. */
  required: number;

  /** Nonnegative numerical allowance in metres already used by that rule. */
  allowance: number;
}
