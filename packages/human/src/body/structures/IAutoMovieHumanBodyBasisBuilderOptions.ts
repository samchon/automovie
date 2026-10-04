/**
 * Constructor options of `createHumanBodyBasisBuilder`.
 *
 * Omitting the object or its field preserves the existing model and its
 * metadata absence. Physical-source registration changes no coordinates and
 * supplies no clinical tissue certification.
 *
 * @evidence contracts/common.md#principled-implementation Opts into topology registration without altering geometry evaluation.
 * @evidence contracts/common.md#clear-and-simple-design One optional field replaces an anonymous options object; the builder admits it exactly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registration never infers incidence from coordinate contact.
 * @evidence contracts/common.md#meaningful-documentation States the omission default and what registration does not change.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Carries no spatial quantity.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no shape channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Source regions keep their identities.
 * @evidence contracts/modeling.md#emitted-geometry Selects which physical correspondence the emitted static model carries, without moving any vertex.
 * @evidence contracts/modeling.md#shared-boundaries Registered incidence lets split regions declare the same physical point across seams.
 * @evidenceExclude contracts/modeling.md#rendered-observation The builder's consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Topology registration carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority A construction option, not a personal control.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisBuilderOptions {
  /**
   * Physical incidence authority registered before UV gathering: the basis's
   * native indexed incidence, or its declared canonical source partition.
   */
  physicalSource?: "native-indexed" | "source-partition";
}
