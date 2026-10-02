import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Target or observed measures of one gluteus maximus, separate from outer fat.
 *
 * Its broad origins span posterior ilium and sacral structures; superficial
 * and deep fibres insert through the iliotibial tract and gluteal tuberosity.
 * Those attachments are anatomical relations of the generated component,
 * never XYZ coordinates a document author must sculpt. The volume below is
 * one side's muscle belly, not buttock girth, skin projection or tissue
 * stiffness. MRI fat fraction may accompany or replace volume as an observed
 * scalar; it is not the subcutaneous fat volume. QUADRA_HC's adult CT labels
 * separate left and right muscles but
 * do not measure their standing skin displacement (Gutschmayer et al. 2025,
 * doi:10.1038/s41597-025-05997-4).
 *
 * @evidence contracts/common.md#principled-implementation The alias reuses `IAutoMovieHumanBodyMuscleMeasurements`, whose two optional scalars (segmented belly volume and MRI proton-density fat fraction) are the independently measurable properties of any one muscle, so a per-muscle record would differ only by name. The name keeps this muscle's slot distinct from its neighbours under `IAutoMovieHumanBodyHipMeasurements.gluteusMaximus`.
 * @evidence contracts/common.md#clear-and-simple-design An alias with no member of its own: `IAutoMovieHumanBodyHipMeasurements.gluteusMaximus` names the muscle and the shared record carries the quantities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the volume is one side's muscle belly and not buttock girth, skin projection or stiffness, that MRI fat fraction is not subcutaneous fat, and that its attachments are anatomical relations and never coordinates.
 * @evidence contracts/modeling.md#part-identity-and-grouping One declaration stands for one muscle, the gluteus maximus of one side, composed by `IAutoMovieHumanBodyHipMeasurements` under `gluteusMaximus`; the alias copies no member's shape or values.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names measurement slots, not shape channels: each value is an absolute anatomical quantity with no neutral zero, and the body basis owns the channels that vary a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The declaration holds no value of its own and converts nothing: the unit of each quantity belongs to the referenced measurement value type.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume, so it has no boundary to share.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is an internal anatomical measurement that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits or bounds nothing: `admitHumanBodyAnatomicalMeasurements` rejects non-finite, non-positive and out-of-interval values, and population ranges belong to the component resolver.
 * @evidence contracts/anatomy.md#parametric-authority Every input is a named quantity of one named part, a target or an imaging observation with its own unit; `admitHumanBodyAnatomicalMeasurements` asserts a closed schema, so no vertex, curve, strand or surface patch can be supplied through it.
 * @author Samchon
 */
export type IAutoMovieHumanBodyGluteusMaximusMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
