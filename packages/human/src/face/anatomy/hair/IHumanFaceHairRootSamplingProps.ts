import type { IAutoMovieHumanFaceHairDomain } from "../../structures/IAutoMovieHumanFaceHairDomain";

/**
 * Neutral source geometry and the registered growth chart consumed by area sampling.
 *
 * @evidence contracts/common.md#principled-implementation Neutral coordinates and incidence retain the growth domain owner's original face ordinals and chart origin.
 * @evidence contracts/common.md#clear-and-simple-design Domain field types are reused and only the source coordinate/incidence pair is added.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The sampler receives the actual registered surface rather than a personal patch or proxy.
 * @evidence contracts/common.md#meaningful-documentation States neutral stage, source addressing and origin ownership.
 * @evidence contracts/modeling.md#spatial-conventions Coordinates and chart origin are neutral head-frame metres; incidence and ordinals are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Source producers own surface identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels This input defines no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The sampler owns population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Boundary and seating owners consume sampled references.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair consumer observes output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Registered growth geometry supplies no measured follicle density.
 * @evidenceExclude contracts/anatomy.md#permitted-range The sampler owns geometric admission, not a clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This compiled source input is not a personal patch control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootSamplingProps {
  /** Original neutral flat XYZ positions, head-frame metres. */
  positions: readonly number[];

  /** Original oriented faces, addressing the same coordinate population. */
  indices: readonly number[];

  /** Registered domain face ordinals retain the shared domain owner's identity and ordering. */
  triangles: Readonly<IAutoMovieHumanFaceHairDomain["triangles"]>;

  /** Registered neutral XYZ chart origin, in the shared domain owner's metre frame. */
  origin: Readonly<IAutoMovieHumanFaceHairDomain["origin"]>;
}
