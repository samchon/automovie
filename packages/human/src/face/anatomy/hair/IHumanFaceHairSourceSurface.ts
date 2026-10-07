import type { IAutoMovieHumanFaceHairDomain } from "../../structures/IAutoMovieHumanFaceHairDomain";

/**
 * Private source snapshot consumed by the numerical hair compiler.
 *
 * Endpoint rows, material regions, skin binding and attachment data belong to
 * the face evaluator. Hair retains only its neutral reference coordinates,
 * incidence, registered growth domains and contact closure. The compiler
 * clones these fields before admission, so later caller edits cannot change
 * its reference, sampler or closure while unrelated source arrays are not
 * duplicated.
 *
 * @evidence contracts/common.md#principled-implementation The snapshot contains exactly the fields read by root sampling, current-shape transport and contact closure; owned copies preserve source meaning without retaining unused deformation or material state.
 * @evidence contracts/common.md#clear-and-simple-design One private record states the numerical hair source responsibility separately from the complete face evaluator input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source coordinates and incidence are copied unchanged; no source-admission check or numerical range is removed.
 * @evidence contracts/common.md#meaningful-documentation Names copied fields, ownership and responsibilities that remain at the face evaluator.
 * @evidence contracts/modeling.md#spatial-conventions Neutral head-frame metre coordinates and source triangle indices retain their original layout.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source surface and growth domains retain their producer's identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record carries reference geometry and defines no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The numerical hair compiler owns emission.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The root and closure compilers consume the retained source incidence.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled hair consumer observes results.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Source producers retain biological qualification.
 * @evidenceExclude contracts/anatomy.md#permitted-range The snapshot changes no admitted range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This private snapshot is not a personal authoring input.
 *
 * @author Samchon
 */
export interface IHumanFaceHairSourceSurface {
  /** Original surface identity used by each layer's declared host. */
  readonly id: string;

  /** Neutral flat XYZ reference coordinates, head-frame metres. */
  readonly positions: readonly number[];

  /** Original oriented triangle incidence over those coordinates. */
  readonly indices: readonly number[];

  /** Shared growth charts retain original origins and face membership. */
  readonly hairDomains?: readonly IAutoMovieHumanFaceHairDomain[];

  /** Source cap incidence from which current-shape closure loops are compiled. */
  readonly hairContactClosure?: readonly number[];
}
