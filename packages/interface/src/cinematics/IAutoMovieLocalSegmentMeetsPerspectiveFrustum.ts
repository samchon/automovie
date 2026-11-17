import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieDeliveryCropNdc } from "./IAutoMovieDeliveryCropNdc";

/**
 * Camera-local inputs to six-plane perspective segment clipping.
 *
 * @evidence contracts/development/design.md#principled-representation IProps names local endpoints, metre-valued depths and dimensionless lens/crop scalars; numerical validity remains a caller premise.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shared local predicate serves world-segment and box-frustum readers without repeated corner transformation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Canonical vector and crop contracts are reused, and geometric intersection is not presented as rendered visibility.
 * @evidence contracts/development/common.md#meaningful-documentation IProps records axis convention, inclusive planes and representability assumptions.
 */
export namespace IAutoMovieLocalSegmentMeetsPerspectiveFrustum {
  /**
   * Whether a camera-local segment meets a perspective frustum, its faces included.
   *
   * Both ends are already in the camera's frame, looking down −Z with +Y up, so a caller testing many segments of one body transforms each corner once rather than once per segment. The frustum is bounded by the `near` and `far` depths and by the side planes through the lens and the crop's NDC edges at `halfX` and `halfY` tangents. A segment touching a face counts as meeting it.
   *
   * Inputs are borrowed and no validation runs here. Callers must supply finite endpoints, positive ordered clip distances, positive finite tangents, a valid crop and representable intermediate arithmetic. The boolean includes face contact under floating-point clipping; it measures no rendered pixels or occlusion.
   *
   * @evidence contracts/development/design.md#principled-representation Endpoints use camera-local metres and -Z viewing depth; tangents and crop coordinates are dimensionless. Numeric validity and crop conversion belong to callers, not this record or the clipping predicate.
   * @evidence contracts/development/design.md#minimal-and-owned-surface World-segment and box frustum consumers share the same local six-plane inputs, allowing the box reader to transform each corner once.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The canonical crop record is reused, and finite-value/boundary-rounding premises remain explicit rather than being presented as a visibility certificate.
   * @evidence contracts/development/common.md#meaningful-documentation Defines axes, units, lens tangents, positive-depth interval, caller validation and inclusive contact.
   */
  export type IProps = {
    /** Segment start in camera-local metres: +X right, +Y up, -Z forward. */
    from: IAutoMovieVector3;

    /** Segment end in the same frame; equality with from is permitted as a point test. */
    to: IAutoMovieVector3;

    /** Positive finite near depth in metres in front of the lens; the near face is included. */
    near: number;

    /** Finite far depth in metres greater than near; the far face is included. */
    far: number;

    /** Positive finite horizontal half-field tangent, tan(fovY/2) times delivered width/height. */
    halfX: number;

    /** Positive finite vertical half-field tangent, tan(fovY/2), with the angle converted to radians before tan. */
    halfY: number;

    /** Validated full-gate NDC crop edges from deliveryCropNdc; the four edges directly define the side planes. */
    crop: IAutoMovieDeliveryCropNdc;
  };
}
