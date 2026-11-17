import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePerspectiveFrustumLens } from "./IAutoMoviePerspectiveFrustumLens";
import type { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";

/**
 * Borrowed lens and world-sphere inputs for conservative frustum culling.
 * The synchronous operation retains and mutates none of these records.
 *
 * @evidence contracts/development/design.md#principled-representation Compare the world sphere against normalized camera-frustum planes; retained edge/corner false positives bound culling rather than prove intersection.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A centre, radius and plain camera/lens facts describe the test without native camera or geometry objects.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Invalid radius returns false, while other finite/unit lens premises are caller-owned; boundary rounding and pixel visibility are not certified.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish world metres, dimensionless lens values and the early-return-dependent crop failure path.
 */
export namespace IAutoMovieIntersectsPerspectiveFrustumSphere {
  /**
   * Whether a world-space sphere may intersect a perspective-camera frustum.
   *
   * The sphere's centre is brought into the camera frame and its signed distance to each of the six planes compared with the radius. Each side plane passes through the lens, and its distance is normalized by the plane's own `hypot(1, tangent)`, so callers must not approximate the radius by padding projected NDC coordinates. Like every plane-by-plane sphere test this is conservative near the frustum's edges and corners: a sphere just outside a corner yet within `radius` of both adjacent planes answers true. Under exact-real arithmetic the geometric approximation errs toward visible: the viewer's formation culling keeps such a member drawn, and `measureAutoMovieGeometry` counts it as visible. A non-finite or negative radius answers false. A malformed crop throws the RangeError of deliveryCropNdc only if radius and depth checks reach the side planes; an earlier false result skips that conversion. Finite centres, valid lens scalars, nearly unit camera rotation and representable intermediate products are premises; boundary rounding is not certified.
   */
  export type IProps = IAutoMoviePerspectiveFrustumLens & {
    /** World placement in metres and nearly unit rotation; camera looks along local -Z. */
    camera: IAutoMovieResolvedCamera;

    /** Finite sphere centre in world metres. */
    center: IAutoMovieVector3;

    /** Radius in metres; nonfinite or negative values return false, zero is a point. */
    radius: number;
  };
}
