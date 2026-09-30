import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed dimensions of one lateral fibula.
 *
 * Its head articulates near the knee and the lateral malleolus bounds the
 * ankle. It is not the tibia's lateral skin contour or an offset copy of the
 * tibial shaft; each side has its own observed bone dimensions.
 *
 * @evidence contracts/common.md#principled-implementation `AutoMovieHumanBodyNonemptyMeasurements` over a closed set of named optional quantities makes at least one of them mandatory, so `{}` cannot claim the part was specified and an absent quantity is never read as zero. Its quantities are the osseous ones of the fibula, kept apart from soft tissue and from the neighbouring bones the comment names.
 * @evidence contracts/common.md#clear-and-simple-design One nonempty record of the bone's optional quantities, each a shared value type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the head articulates near the knee, that the lateral malleolus bounds the ankle, and that the fibula is not the tibia's lateral contour or an offset copy of the tibial shaft; each property names its definition.
 * @evidence contracts/modeling.md#part-identity-and-grouping One declaration stands for one bone, the fibula, composed by `IAutoMovieHumanBodyLegMeasurements.fibula`; the comment names the neighbouring bones and articular surfaces it does not own.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names measurement slots, not shape channels: each value is an absolute anatomical quantity with no neutral zero, and the body basis owns the channels that vary a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Each quantity carries its unit in its value type: millimetres for lengths and millilitres for volumes; the declaration has no frame of its own and converts nothing.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume, so it has no boundary to share.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is an internal anatomical measurement that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits or bounds nothing: `admitHumanBodyAnatomicalMeasurements` rejects non-finite, non-positive and out-of-interval values, and population ranges belong to the component resolver.
 * @evidence contracts/anatomy.md#parametric-authority Every input is a named quantity of one named part, a target or an imaging observation with its own unit; `admitHumanBodyAnatomicalMeasurements` asserts a closed schema, so no vertex, curve, strand or surface patch can be supplied through it.
 * @author Samchon
 */
export type IAutoMovieHumanBodyFibulaMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Osseous head-to-lateral-malleolus length. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;

    /** Segmented fibula alone, separate from tibia and ankle cartilage. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
