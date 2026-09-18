import { Vector3 } from "@automovie/engine";
import { IPortraitNasalRimJet } from "./structures/IPortraitNasalRimJet";

/**
 * Derive the final rim jet once for exterior and vestibular consumers. Tangent
 * follows the cyclic boundary. Its cross product with the existing common
 * normal gives the co-normal; the supplied adjacent exterior point chooses the
 * physical outward sign. No body-volume parameter participates in this frame.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Derives one consistent exterior/vestibular frame from the actual final nasal rim.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Uses the cyclic tangent, common skin normal and adjacent exterior witness to choose an unambiguous outward co-normal.
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
