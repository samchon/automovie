import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * One calcaneus supporting the heel beneath the talus.
 *
 * Heel projection and plantar contact cannot be reconstructed from this bone
 * volume alone; the subtalar facet, plantar fat pad and skin remain separate.
 *
 * @evidence contracts/common.md#principled-implementation The single required `boneVolume` is the one quantity that describes the calcaneus here, typed as a target or an imaging segmentation. A mandatory member is enough because nothing else is specified, and the absence of the whole bone is expressed by omitting it at `IAutoMovieHumanBodyFootMeasurements.calcaneus`.
 * @evidence contracts/common.md#clear-and-simple-design One interface with one member: the volume of one bone.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states that heel projection and plantar contact cannot be reconstructed from the bone volume and that the subtalar facet, plantar fat pad and skin remain separate; the property comment excludes talus and heel fat pad from the volume.
 * @evidence contracts/modeling.md#part-identity-and-grouping One declaration stands for one bone, the calcaneus, composed by `IAutoMovieHumanBodyFootMeasurements.calcaneus`; the property comment names the neighbouring structures whose volume it excludes, so no volume is counted twice.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names measurement slots, not shape channels: each value is an absolute anatomical quantity with no neutral zero, and the body basis owns the channels that vary a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions `boneVolume` is in millilitres, carried by `IAutoMovieHumanBodyAnatomicalVolume`; the declaration has no frame and converts nothing.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume, so it has no boundary to share.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is an internal anatomical measurement that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits or bounds nothing: `admitHumanBodyAnatomicalMeasurements` rejects non-finite, non-positive and out-of-interval values, and population ranges belong to the component resolver.
 * @evidence contracts/anatomy.md#parametric-authority Every input is a named quantity of one named part, a target or an imaging observation with its own unit; `admitHumanBodyAnatomicalMeasurements` asserts a closed schema, so no vertex, curve, strand or surface patch can be supplied through it.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyCalcaneusMeasurements {
  /** Calcaneal bone volume alone, excluding talus and heel fat pad. */
  readonly boneVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
