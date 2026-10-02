import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Medial quadriceps belly guiding the patella from femur toward the common tendon. Its distal shape changes at the knee without becoming the patella.
 *
 * This named belly accepts physical volume or MRI fat fraction, never skin vertices.
 *
 * @evidence contracts/common.md#principled-implementation The alias reuses `IAutoMovieHumanBodyMuscleMeasurements`, whose two optional scalars (segmented belly volume and MRI proton-density fat fraction) are the independently measurable properties of any one muscle, so a per-muscle record would differ only by name. The name keeps this muscle's slot distinct from its neighbours under `IAutoMovieHumanBodyQuadricepsMeasurements.vastusMedialis`.
 * @evidence contracts/common.md#clear-and-simple-design An alias with no member of its own: `IAutoMovieHumanBodyQuadricepsMeasurements.vastusMedialis` names the muscle and the shared record carries the quantities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment names the medial femoral head. The comment also states that the slot takes physical volume or MRI fat fraction and that a skin vertex is never an input.
 * @evidence contracts/modeling.md#part-identity-and-grouping One declaration stands for one muscle, the vastus medialis, composed by `IAutoMovieHumanBodyQuadricepsMeasurements` under `vastusMedialis`; the alias copies no member's shape or values.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names measurement slots, not shape channels: each value is an absolute anatomical quantity with no neutral zero, and the body basis owns the channels that vary a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The declaration holds no value of its own and converts nothing: the unit of each quantity belongs to the referenced measurement value type.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume, so it has no boundary to share.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is an internal anatomical measurement that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits or bounds nothing: `admitHumanBodyAnatomicalMeasurements` rejects non-finite, non-positive and out-of-interval values, and population ranges belong to the component resolver.
 * @evidence contracts/anatomy.md#parametric-authority Every input is a named quantity of one named part, a target or an imaging observation with its own unit; `admitHumanBodyAnatomicalMeasurements` asserts a closed schema, so no vertex, curve, strand or surface patch can be supplied through it.
 * @author Samchon
 */
export type IAutoMovieHumanBodyVastusMedialisMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
