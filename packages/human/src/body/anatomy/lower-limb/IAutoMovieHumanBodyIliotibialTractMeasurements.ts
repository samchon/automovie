import type { IAutoMovieHumanBodyFibrousTissueMeasurements } from "../measurements/IAutoMovieHumanBodyFibrousTissueMeasurements";

/**
 * Lateral thickening of fascia lata from pelvis toward lateral proximal tibia.
 *
 * Gluteus maximus inserts through this tract, so the tract crosses the hip
 * region and thigh rather than being an invented skin groove.
 *
 * @evidence contracts/common.md#principled-implementation The alias reuses `IAutoMovieHumanBodyFibrousTissueMeasurements`, whose single volume is the one material quantity of a named ligament or fascial tract, so a per-tissue record would differ only by name. The name keeps this tissue distinct from the muscle and bone it attaches to in `IAutoMovieHumanBodyThighMeasurements.iliotibialTract`.
 * @evidence contracts/common.md#clear-and-simple-design An alias with no member of its own: `IAutoMovieHumanBodyThighMeasurements.iliotibialTract` names the tissue and the shared record carries its volume.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the tract runs from the pelvis toward the lateral proximal tibia, that gluteus maximus inserts through it, and that it is therefore not an invented skin groove.
 * @evidence contracts/modeling.md#part-identity-and-grouping One declaration stands for one named fibrous structure, the iliotibial tract, composed by `IAutoMovieHumanBodyThighMeasurements` under `iliotibialTract`; the alias copies no member's shape or values.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names measurement slots, not shape channels: each value is an absolute anatomical quantity with no neutral zero, and the body basis owns the channels that vary a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The declaration holds no value of its own and converts nothing: the unit of each quantity belongs to the referenced measurement value type.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume, so it has no boundary to share.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is an internal anatomical measurement that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits or bounds nothing: `admitHumanBodyAnatomicalMeasurements` rejects non-finite, non-positive and out-of-interval values, and population ranges belong to the component resolver.
 * @evidence contracts/anatomy.md#parametric-authority Every input is a named quantity of one named part, a target or an imaging observation with its own unit; `admitHumanBodyAnatomicalMeasurements` asserts a closed schema, so no vertex, curve, strand or surface patch can be supplied through it.
 * @author Samchon
 */
export type IAutoMovieHumanBodyIliotibialTractMeasurements =
  IAutoMovieHumanBodyFibrousTissueMeasurements;
