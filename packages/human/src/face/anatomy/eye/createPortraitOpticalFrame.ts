import {
  type IAutoMovieMeshTransform,
  Vector3,
  rotationBetween,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IPortraitEyeSphere } from "../../surface/structures/IPortraitEyeSphere";

/**
 * A rigid radial frame for an iris and cornea authored around local +Z. The
 * axial witness selects a direction from the globe centre, not an in-plane
 * translation of a disc over a head-aligned height field. Shortest-arc rotation
 * carries both optical layers without changing their radii or thickness.
 * All coordinates retain construction millimetres until model conversion.
 *
 * The returned sphere has the same radius and sits at the local origin, and
 * `transform` carries local +Z onto the unit direction from the globe centre
 * to `axialWitness` and then translates to the globe centre, so a layer built
 * on the local sphere lands on the real globe. The two frames are the local
 * one (authored around +Z, centre at the origin) and the head one; this is the
 * only place the change is made. A non-finite input, a non-positive radius or
 * a witness at the centre throws. An antipodal witness (straight back along
 * -Z) is a valid direction and rotates by half a turn about a perpendicular
 * axis.
 */
export function createPortraitOpticalFrame(
  sphere: IPortraitEyeSphere,
  axialWitness: IAutoMovieVector3,
): { sphere: IPortraitEyeSphere; transform: IAutoMovieMeshTransform } {
  const direction = Vector3.subtract(axialWitness, sphere.center);
  if (
    ![
      sphere.radius,
      sphere.center.x,
      sphere.center.y,
      sphere.center.z,
      direction.x,
      direction.y,
      direction.z,
    ].every(Number.isFinite) ||
    sphere.radius <= 0 ||
    Vector3.length(direction) === 0
  )
    throw new Error(
      "Radial optics need a finite positive globe and noncentral axial witness.",
    );
  return {
    sphere: { center: Vector3.create(), radius: sphere.radius },
    transform: {
      translation: { ...sphere.center },
      rotation: rotationBetween(
        Vector3.create(0, 0, 1),
        Vector3.normalize(direction),
      ),
    },
  };
}
