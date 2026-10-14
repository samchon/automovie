import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalAngle } from "../measurements/IAutoMovieHumanBodyAnatomicalAngle";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyTomographicAngle } from "../measurements/IAutoMovieHumanBodyTomographicAngle";
import type { IAutoMovieHumanBodyTomographicLength } from "../measurements/IAutoMovieHumanBodyTomographicLength";

/**
 * Target or observed dimensions of one femur rather than its overlying skin.
 *
 * The head articulates at the acetabulum, while the greater trochanter and gluteal tuberosity receive different gluteal tendons. A hip-joint centre and knee-joint centre alone do not determine the neck, shaft or those attachment surfaces. The generator may later infer missing dimensions inside a stated population domain; absence here is never interpreted as a zero angle or zero-length bone. These values cannot be used as user-defined mesh points.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty named set separates head radius, osseous length, neck-shaft angle and tomographic anteversion with each quantity's own protocol.
 * @evidence contracts/common.md#clear-and-simple-design One femur owns its dimensions while joint centres and overlying skin remain separate representations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted dimensions are unknown rather than zero angles/lengths or editable mesh points.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish fitted head, maximum bone length and both clinical axis-angle definitions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Femur dimension typing runs no neck/shaft inference or bone generator.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Named femoral quantities contain no cached shape inversion or articular solve.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The femur input set acquires no CT surface or skeletal workspace.
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
