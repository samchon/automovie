import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed midline sacrum volume shared by both pelvic sides.
 *
 * It is one bone, not a left/right duplicate. The posterior sacral surface
 * participates in gluteus maximus origin; a segmented volume does not locate
 * that attachment or reconstruct the sacral surface. Geometry and attachment
 * landmarks are generated state rather than authored coordinates.
 *
 * @evidence contracts/common.md#principled-implementation The single required `boneVolume` is the one quantity that describes the sacrum here, typed as a target or an imaging segmentation. A mandatory member is enough because nothing else is specified, and the absence of the whole bone is expressed by omitting it at `IAutoMovieHumanBodyPelvisMeasurements.sacrum`.
 * @evidence contracts/common.md#clear-and-simple-design One interface with one member: the volume of one bone.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the sacrum is one bone and not a left and right duplicate, that a segmented volume does not locate the gluteus maximus attachment or the sacral surface, and that geometry and attachment landmarks are generated state.
 * @evidence contracts/modeling.md#part-identity-and-grouping One declaration stands for one bone, the sacrum, composed by `IAutoMovieHumanBodyPelvisMeasurements.sacrum`; the property comment names the neighbouring structures whose volume it excludes, so no volume is counted twice.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names measurement slots, not shape channels: each value is an absolute anatomical quantity with no neutral zero, and the body basis owns the channels that vary a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions `boneVolume` is in millilitres, carried by `IAutoMovieHumanBodyAnatomicalVolume`; the declaration has no frame and converts nothing.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume, so it has no boundary to share.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is an internal anatomical measurement that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits or bounds nothing: `admitHumanBodyAnatomicalMeasurements` rejects non-finite, non-positive and out-of-interval values, and population ranges belong to the component resolver.
 * @evidence contracts/anatomy.md#parametric-authority Every input is a named quantity of one named part, a target or an imaging observation with its own unit; `admitHumanBodyAnatomicalMeasurements` asserts a closed schema, so no vertex, curve, strand or surface patch can be supplied through it.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySacrumMeasurements {
  /** One midline sacral bone; its volume is separate from both coxal bones. */
  readonly boneVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
