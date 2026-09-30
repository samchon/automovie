import { Vector3 } from "@automovie/engine";

import { IPortraitNasalRimJet } from "./structures/IPortraitNasalRimJet";

/**
 * Derive the final rim jet once for exterior and vestibular consumers. Tangent
 * follows the cyclic boundary. Its cross product with the existing common
 * normal gives the co-normal; the supplied adjacent exterior point chooses the
 * physical outward sign. No body-volume parameter participates in this frame.
 *
 * @evidence contracts/common.md#principled-implementation At each vertex the tangent is the normalised central chord of the cyclic neighbours, the co-normal is the normalised cross product of tangent and the supplied surface normal, and its sign is chosen by agreement with the vector to the supplied exterior point, so the transverse direction points from the rim onto exterior skin; a zero tangent, a zero co-normal or a zero agreement refuses because the side is then not defined.
 * @evidence contracts/common.md#clear-and-simple-design One derivation of the jet that both the exterior band and the vestibule consume, so no second frame can disagree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject special-casing; the jets depend on the rim, the normals and the exterior samples only.
 * @evidence contracts/common.md#meaningful-documentation The comment states the tangent rule, the co-normal, the sign rule and that no body-volume parameter enters.
 * @evidence contracts/modeling.md#spatial-conventions Points, normals and exterior samples share one head frame in millimetres; tangent and transverse are unit vectors in that frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group; it is a numerical helper of the nasal rim owner.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no mesh primitives; it returns values for its caller to place.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and meets no neighbouring part; the callers that share its result own the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part or joint; the nose component that consumes it is the declaration that observes the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value, range or proportion of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity; callers admit theirs.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is arithmetic on values its owner already named, not an input through which a caller shapes a human form.
 */
export function portraitNasalRimJets(
  points: readonly (readonly number[])[],
  normals: readonly (readonly number[])[],
  exterior: readonly (readonly number[])[],
): IPortraitNasalRimJet[] {
  if (
    points.length < 3 ||
    normals.length !== points.length ||
    exterior.length !== points.length ||
    [...points, ...normals, ...exterior].some(
      (p) => p.length !== 3 || !p.every(Number.isFinite),
    )
  )
    throw new Error(
      "Shared nasal rim jets need aligned finite point, normal and exterior samples.",
    );
  return points.map((point, i) => {
    const before = points[(i + points.length - 1) % points.length],
      after = points[(i + 1) % points.length];
    const tangent = Vector3.normalize(
      Vector3.create(
        after[0] - before[0],
        after[1] - before[1],
        after[2] - before[2],
      ),
    );
    const normal = Vector3.normalize(
      Vector3.create(...(normals[i] as [number, number, number])),
    );
    let transverse = Vector3.normalize(Vector3.cross(tangent, normal));
    const toward = Vector3.create(
      ...(exterior[i].map((v, axis) => v - point[axis]) as [
        number,
        number,
        number,
      ]),
    );
    const agreement = Vector3.dot(transverse, toward);
    if (
      ![
        tangent.x,
        tangent.y,
        tangent.z,
        transverse.x,
        transverse.y,
        transverse.z,
        agreement,
      ].every(Number.isFinite) ||
      Vector3.length(tangent) === 0 ||
      Vector3.length(transverse) === 0 ||
      agreement === 0
    )
      throw new Error(
        "A nasal rim jet needs a regular tangent and an unambiguous exterior side.",
      );
    if (agreement < 0) transverse = Vector3.scale(transverse, -1);
    return {
      point: [...point],
      tangent: [tangent.x, tangent.y, tangent.z],
      transverse: [transverse.x, transverse.y, transverse.z],
    };
  });
}
