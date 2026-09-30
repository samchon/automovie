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
 *
 * @evidence contracts/common.md#principled-implementation The shortest-arc rotation between two unit vectors is a rigid map that sends local +Z onto the witness direction, and a rigid map preserves the radii and thickness authored in the local frame, which is why the layers can be authored once around +Z. The engine's rotation handles the parallel and antiparallel cases, and the only true degeneracy, a witness at the centre, has no direction and is refused.
 * @evidence contracts/common.md#clear-and-simple-design One function derives one rigid frame from a sphere and a witness, and its two consumers (the corneal shell and the iris and pupil lattices) use the same result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The frame is a function of the sphere and the witness only, with no case named after a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation The comment states the two frames, the mapping, that this is the only conversion site, and the refusal and antipodal behaviour.
 * @evidence contracts/modeling.md#spatial-conventions Local +Z-centred and head frames are stated, the mapping between them is one named rotation plus translation in the same millimetre unit, and the function owns that conversion.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function derives a transform and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface; the corneal shell and the iris lattice that share this frame get their common rim from their own builders.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part and displays nothing; the parts placed by its frame are observed under the eye component.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines and converts no input a caller shapes a face through.
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
