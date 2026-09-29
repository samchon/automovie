import type { IAutoMovieHumanBodyAnatomicalAngle } from "../measurements/IAutoMovieHumanBodyAnatomicalAngle";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyTomographicAngle } from "../measurements/IAutoMovieHumanBodyTomographicAngle";
import type { IAutoMovieHumanBodyTomographicLength } from "../measurements/IAutoMovieHumanBodyTomographicLength";
import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";

/**
 * Target or observed dimensions of one femur rather than its overlying skin.
 *
 * The head articulates at the acetabulum, while the greater trochanter and
 * gluteal tuberosity receive different gluteal tendons. A hip-joint centre and
 * knee-joint centre alone do not determine the neck, shaft or those attachment
 * surfaces. The generator may later infer missing dimensions inside a stated
 * population domain; absence here is never interpreted as a zero angle or
 * zero-length bone. These values cannot be used as user-defined mesh points.
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
