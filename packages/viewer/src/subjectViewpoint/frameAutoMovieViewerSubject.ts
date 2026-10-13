import * as THREE from "three";
import type { IAutoMovieViewerSubjectBounds } from "./IAutoMovieViewerSubjectBounds.js";
import type { IAutoMovieViewerViewpoint } from "./IAutoMovieViewerViewpoint.js";
import type { IAutoMovieViewerSubjectLens } from "./IAutoMovieViewerSubjectLens.js";
import type { IAutoMovieViewerSubjectPose } from "./IAutoMovieViewerSubjectPose.js";

/**
 * Place an eye that frames one subject from one viewpoint.
 *
 * The framing radius is the subject's half-diagonal, floored at 0.5 metres.
 * Distance uses the narrower field of view and the requested distance factor;
 * small or vertex-free subjects therefore share a neighbourhood view rather
 * than receiving a camera arbitrarily close to their origin. Clip distances
 * scale with that framing radius, keeping their ratio stable for a fixed lens
 * and distance factor without claiming scale invariance below the floor.
 *
 * @author Samchon
 */
export const frameAutoMovieViewerSubject = (
  bounds: IAutoMovieViewerSubjectBounds,
  viewpoint: IAutoMovieViewerViewpoint,
  lens: IAutoMovieViewerSubjectLens,
): IAutoMovieViewerSubjectPose => {
  if (lens.fovDeg <= 0 || lens.fovDeg >= 180)
    throw new RangeError(
      `inspection lens field of view must be within (0, 180) degrees, not ${lens.fovDeg}`,
    );
  if (lens.aspect <= 0)
    throw new RangeError(
      `inspection lens aspect must be positive, not ${lens.aspect}`,
    );
  const center = {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
    z: (bounds.min.z + bounds.max.z) / 2,
  };
  const span = {
    x: bounds.max.x - bounds.min.x,
    y: bounds.max.y - bounds.min.y,
    z: bounds.max.z - bounds.min.z,
  };
  const radius = Math.max(
    Math.hypot(span.x, span.y, span.z) / 2,
    DEGENERATE_RADIUS,
  );
  const verticalHalf = THREE.MathUtils.degToRad(lens.fovDeg) / 2;
  // The horizontal field follows the aspect, and the subject has to fit the
  // narrower of the two: fitting the wider one crops a tall subject out of a
  // wide viewport, which is the one framing failure nobody notices from a
  // thumbnail.
  const horizontalHalf = Math.atan(Math.tan(verticalHalf) * lens.aspect);
  const distance =
    (radius / Math.sin(Math.min(verticalHalf, horizontalHalf))) *
    viewpoint.distanceFactor;
  const azimuth = THREE.MathUtils.degToRad(viewpoint.azimuthDeg);
  const elevation = THREE.MathUtils.degToRad(viewpoint.elevationDeg);
  const horizontal = Math.cos(elevation);
  return {
    position: {
      x: center.x + Math.sin(azimuth) * horizontal * distance,
      y: center.y + Math.sin(elevation) * distance,
      z: center.z + Math.cos(azimuth) * horizontal * distance,
    },
    target: center,
    lens,
    // Half the gap to the subject's near side, floored off zero so a
    // distance factor of exactly one still has a positive near plane.
    near: Math.max((distance - radius) / 2, radius / 1000),
    // Four radii past the subject's far side, so the eye keeps enough of the
    // surroundings to tell where the subject stands.
    far: distance + radius * 5,
  };
};

/**
 * Minimum framing radius for every subject box, in metres.
 *
 * A box of zero size is an ordinary answer, not a fault: an element citing a
 * runtime model reference reports its own origin, and a transform-only node has
 * no vertices. There is still a place to aim at; the 0.5 metre radius, lens and
 * distance factor determine the eye's distance and the neighbourhood shown.
 */
const DEGENERATE_RADIUS = 0.5;
