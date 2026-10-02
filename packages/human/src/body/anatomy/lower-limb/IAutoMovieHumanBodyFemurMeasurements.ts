import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalAngle } from "../measurements/IAutoMovieHumanBodyAnatomicalAngle";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyTomographicAngle } from "../measurements/IAutoMovieHumanBodyTomographicAngle";
import type { IAutoMovieHumanBodyTomographicLength } from "../measurements/IAutoMovieHumanBodyTomographicLength";

/**
 * Target or observed dimensions of one femur rather than its overlying skin.
 *
 * The head articulates at the acetabulum, while the greater trochanter and
 * gluteal tuberosity receive different gluteal tendons. A hip-joint centre and
 * knee-joint centre alone do not determine the neck, shaft or those attachment
 * surfaces. The generator may later infer missing dimensions inside a stated
 * population domain; absence here is never interpreted as a zero angle or
 * zero-length bone. These values cannot be used as user-defined mesh points.
 *
 * @evidence contracts/common.md#principled-implementation `AutoMovieHumanBodyNonemptyMeasurements` over a closed set of named optional quantities makes at least one of them mandatory, so `{}` cannot claim the part was specified and an absent quantity is never read as zero. Its quantities are the osseous ones of the femur, kept apart from soft tissue and from the neighbouring bones the comment names.
 * @evidence contracts/common.md#clear-and-simple-design One nonempty record of the bone's optional quantities, each a shared value type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the head articulates at the acetabulum while the trochanter and gluteal tuberosity receive different tendons, that a hip and a knee centre alone do not fix the neck or shaft, that absence is never read as zero, and that the values are not user-defined mesh points; each property names its definition.
 * @evidence contracts/modeling.md#part-identity-and-grouping One declaration stands for one bone, the femur, composed by `IAutoMovieHumanBodyThighMeasurements.femur`; the comment names the neighbouring bones and articular surfaces it does not own.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names measurement slots, not shape channels: each value is an absolute anatomical quantity with no neutral zero, and the body basis owns the channels that vary a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions The head radius and maximum bone length are millimetres, while neck-shaft angle and anteversion are degrees under their named bone-axis definitions; their value types carry acquisition or target context. The declaration converts neither lengths nor angles and adds no coordinate frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume, so it has no boundary to share.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is an internal anatomical measurement that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits or bounds nothing: `admitHumanBodyAnatomicalMeasurements` rejects non-finite, non-positive and out-of-interval values, and population ranges belong to the component resolver.
 * @evidence contracts/anatomy.md#parametric-authority Every input is a named quantity of one named part, a target or an imaging observation with its own unit; `admitHumanBodyAnatomicalMeasurements` asserts a closed schema, so no vertex, curve, strand or surface patch can be supplied through it.
 * @author Samchon
 */
export type IAutoMovieHumanBodyFemurMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Sphere-fitted articular head radius, not shaft or trochanter radius. */
    sphereFittedHeadRadius?: IAutoMovieHumanBodyTomographicLength;

    /** Maximum osseous femur length, not external leg length. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;

    /** Neck axis relative to shaft axis, using the same clinical bone axes. */
    neckShaftAngle?: IAutoMovieHumanBodyAnatomicalAngle;

    /** Neck rotation around the shaft relative to the condylar reference. */
    anteversion?: IAutoMovieHumanBodyTomographicAngle;
  }>;
