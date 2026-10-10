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
