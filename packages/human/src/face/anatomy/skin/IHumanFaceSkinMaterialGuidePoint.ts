/**
 * One source-native relief station and an optional source-reference offset.
 * The vertex comes from the shared anatomical registration, not a person's
 * sculpt input. A displacement uses head-frame metres and is converted by the
 * registered material chart's reference differential before any performance.
 *
 * @evidence contracts/common.md#principled-implementation A native station and a separately represented reference displacement retain source identity while leaving metric conversion with the registered chart owner.
 * @evidence contracts/common.md#clear-and-simple-design One internal record describes an endpoint or dimensioned station without an alternate free curve representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller receives no personal vertex editing input; native stations come from shared source registration.
 * @evidence contracts/common.md#meaningful-documentation Separates station identity, reference-metre displacement and current performance.
 * @evidence contracts/modeling.md#spatial-conventions Displacement is canonical source-reference head-frame metres and the vertex is a native ordinal.
 * @evidence contracts/modeling.md#shared-boundaries Stations address the exact source vertices the current host retains.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries one internal station, not a rendered part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Calling anatomical relief owners retain all trait meanings.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The course and relief consumers own their geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The relief owner observes the skin.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Registered landmarks and dimensioned guides retain their calling owners' qualifications.
 * @evidenceExclude contracts/anatomy.md#permitted-range The chart and relief owners admit their respective geometric domains.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This source-native station is internal and introduces no personal shaping input.
 * @author Samchon
 */
export interface IHumanFaceSkinMaterialGuidePoint {
  /** Native vertex of the shared source skin. */
  vertex: number;

  /** Optional authored guide displacement in source-reference head-frame metres. */
  displacement?: readonly number[];
}
