import type { IAutoMovieHumanFaceHairDomain } from "../../structures/IAutoMovieHumanFaceHairDomain";

/**
 * Private source snapshot consumed by the numerical hair compiler.
 *
 * Endpoint rows, material regions, skin binding and attachment data belong to the face evaluator. Hair retains only its neutral reference coordinates, incidence, registered growth domains and contact closure. The compiler clones these fields before admission, so later caller edits cannot change its reference, sampler or closure while unrelated source arrays are not duplicated.
 *
 * @evidence contracts/common.md#principled-implementation A private neutral snapshot supplies surface identity, triangle incidence, growth domains and contact closure to numerical hair compilation.
 * @evidence contracts/common.md#clear-and-simple-design Only compiler-required fields are retained rather than unrelated material or attachment data.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readonly typing is not runtime freezing; createHumanFaceHairBuilder owns cloning and provenance admission.
 * @evidence contracts/common.md#meaningful-documentation Coordinates are head metres and closure incidence remains tied to the original registered surface.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Cloning and query compilation occur in the builder; this schema executes no geometry operation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A builder snapshot is reused across compatible evaluations and its source correspondence controls validity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The builder owns copied source arrays; caller-provided source data retains its separate lifetime.
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
