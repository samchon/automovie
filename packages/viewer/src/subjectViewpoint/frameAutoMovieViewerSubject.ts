import * as THREE from "three";
import type { IAutoMovieViewerSubjectBounds } from "./IAutoMovieViewerSubjectBounds.js";
import type { IAutoMovieViewerViewpoint } from "./IAutoMovieViewerViewpoint.js";
import type { IAutoMovieViewerSubjectLens } from "./IAutoMovieViewerSubjectLens.js";
import type { IAutoMovieViewerSubjectPose } from "./IAutoMovieViewerSubjectPose.js";

/**
 * Frame a finite ordered world-space box using its half-diagonal sphere, floored at 0.5 metres, and the narrower perspective field. Factor at least one is needed for the angular full-sphere fit; the near-clip floor can still crop its near edge with very wide lenses. Valid finite angles/lens/bounds and arithmetic range remain caller premises.
 *
 * @evidence contracts/common.md#principled-implementation Sphere-fit distance r/sin(min half-fov) handles portrait/wide lenses, conventional radius flooring handles vertex-free boxes and radius-scaled clips avoid a fixed world depth range; scalar comparisons reject ordinary lens range violations only.
 * @evidence contracts/common.md#clear-and-simple-design One pure framing owner converts bounds/direction/lens to a pose; it does not inspect geometry or promise fitted pixels for arbitrary camera state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 0.5-metre floor and clip margins are explicit inspection conventions, not hidden measured geometry; incomplete nonfinite/order/multiplier validation and overflow limits remain visible.
 * @evidence contracts/common.md#meaningful-documentation Documents sphere-fit rule, metre floor, finite input premises and scale invariance only above the floor.
 * @evidence contracts/performance.md#efficient-algorithms Fixed box arithmetic and trigonometry allocate one center/span/position/pose; deriving current bounds and rendering remain upstream/downstream costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call uses its current bounds, direction and lens without caching; returned lens reference is borrowed and later mutation changes metadata.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns only small returned value records and retains no scene or native handle; the caller owns subsequent camera and image resources.
 */
export function frameAutoMovieViewerSubject(bounds: IAutoMovieViewerSubjectBounds, viewpoint: IAutoMovieViewerViewpoint, lens: IAutoMovieViewerSubjectLens): IAutoMovieViewerSubjectPose {
  if (lens.fovDeg <= 0 || lens.fovDeg >= 180)
    throw new RangeError(
      `inspection lens field of view must be within (0, 180) degrees, not ${lens.fovDeg}`,
    );
  if (lens.aspect <= 0)
    throw new RangeError(
      `inspection lens aspect must be positive, not ${lens.aspect}`,
    );
  const center: { x: number; y: number; z: number } = {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
    z: (bounds.min.z + bounds.max.z) / 2,
  };
  const span: { x: number; y: number; z: number } = {
    x: bounds.max.x - bounds.min.x,
    y: bounds.max.y - bounds.min.y,
    z: bounds.max.z - bounds.min.z,
  };
  const radius: number = Math.max(
    Math.hypot(span.x, span.y, span.z) / 2,
    DEGENERATE_RADIUS,
  );
  const verticalHalf: number = THREE.MathUtils.degToRad(lens.fovDeg) / 2;
  // The horizontal field follows the aspect; fit the narrower field so the other field cannot crop the bounding sphere.
  const horizontalHalf: number = Math.atan(Math.tan(verticalHalf) * lens.aspect);
  const distance: number =
    (radius / Math.sin(Math.min(verticalHalf, horizontalHalf))) *
    viewpoint.distanceFactor;
  const azimuth: number = THREE.MathUtils.degToRad(viewpoint.azimuthDeg);
  const elevation: number = THREE.MathUtils.degToRad(viewpoint.elevationDeg);
  const horizontal: number = Math.cos(elevation);
  return {
    position: {
      x: center.x + Math.sin(azimuth) * horizontal * distance,
      y: center.y + Math.sin(elevation) * distance,
      z: center.z + Math.cos(azimuth) * horizontal * distance,
    },
    target: center,
    lens,
    // Half the gap to the subject's near side, floored off zero so a distance factor of exactly one still has a positive near plane.
    near: Math.max((distance - radius) / 2, radius / 1000),
    // Four radii past the subject's far side retain the requested neighborhood beyond the bounding sphere.
    far: distance + radius * 5,
  };
}

/**
 * Minimum framing radius for every subject box, in metres.
 *
 * A box of zero size is an ordinary answer, not a fault: an element citing a runtime model reference reports its own origin, and a transform-only node has no vertices. There is still a place to aim at; the 0.5 metre radius, lens and distance factor determine the eye's distance and the neighbourhood shown.
 */
const DEGENERATE_RADIUS: number = 0.5;
