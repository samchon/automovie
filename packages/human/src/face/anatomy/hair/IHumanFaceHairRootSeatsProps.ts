import type { IHumanFaceHairRootReference } from "./IHumanFaceHairRootReference";

/**
 * Current source surface on which sampled roots are seated.
 *
 * @evidence contracts/common.md#principled-implementation Readonly original incidence and current coordinates accompany the unchanged generic sampler references.
 * @evidence contracts/common.md#clear-and-simple-design One seating input keeps the two addressing populations aligned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The evaluator reads the actual surface rather than a proxy seat or expected result.
 * @evidence contracts/common.md#meaningful-documentation States source addressing, generic identity and current coordinate units.
 * @evidence contracts/modeling.md#spatial-conventions Current positions are head-frame metres and incidence is dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source owns parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels This internal input defines no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record supplies existing incidence.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The seat evaluator owns attachment.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair consumer observes output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Geometry owners retain biological qualification.
 * @evidenceExclude contracts/anatomy.md#permitted-range This record admits no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived surface addressing is not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootSeatsProps<T extends IHumanFaceHairRootReference> {
  /** Original root references and any additional sampler identity fields. */
  roots: readonly T[];

  /** Original triangle incidence over the shared current coordinates. */
  indices: readonly number[];

  /** Current flat XYZ coordinates, head-frame metres. */
  current: readonly number[];
}
