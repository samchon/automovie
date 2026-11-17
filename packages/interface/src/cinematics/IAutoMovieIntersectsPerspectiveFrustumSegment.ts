import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePerspectiveFrustumLens } from "./IAutoMoviePerspectiveFrustumLens";
import type { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";

/**
 * Borrowed lens and world-segment inputs for inclusive half-space clipping.
 * The synchronous operation retains and mutates none of these records.
 *
 * @evidence contracts/development/design.md#principled-representation Two world endpoints define the entire segment; algebraic plane crossings can find an interior intersection even when both endpoints lie outside.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Plain points, camera pose, lens and crop facts require no renderer camera handle.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Finite coordinates, valid lens and representable arithmetic remain caller premises; chosen point samples and certified boundary-rounding claims are excluded.
 * @evidence contracts/development/common.md#meaningful-documentation Members specify world metres, camera depth, dimensionless lens values and crop defaults/refusal.
 */
export namespace IAutoMovieIntersectsPerspectiveFrustumSegment {
  /**
   * Whether a world-space segment intersects a perspective-camera frustum.
   *
   * The frustum is the intersection of six half-spaces, so it is convex and the segment is clipped against them one plane at a time in its own parameter. Each plane is linear in camera-local coordinates, which gives algebraic crossings rather than chosen samples. This is why the helper exists: a close shot frames the band between roughly 0.71 and 0.99 of a subject's height, so neither end of the subject is on screen while its middle fills the frame. Testing chosen points, the base, the top or the midpoint, reports such a subject absent; clipping finds it. Touching a face counts as meeting it, and a malformed crop throws the `RangeError` of {@link deliveryCropNdc}.
   */
  export type IProps = IAutoMoviePerspectiveFrustumLens & {
    /** World placement in metres and nearly unit rotation; camera looks along local -Z. */
    camera: IAutoMovieResolvedCamera;

    /** Finite first endpoint in world metres; may equal to for a point test. */
    from: IAutoMovieVector3;

    /** Finite second endpoint in world metres; endpoint order does not orient the test. */
    to: IAutoMovieVector3;
  };
}
