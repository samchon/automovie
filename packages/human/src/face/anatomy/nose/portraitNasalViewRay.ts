
import { Vector3 } from "@automovie/engine";
/**
 * The recorded camera's first two rows define its image plane. Their normalized
 * cross product is the direction on which a displacement preserves both image
 * coordinates. Keeping the measured rows avoids calling a rounded third row
 * exactly orthogonal when it is only approximately so. All vectors are unitless.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Retains the recorded image coordinates while nasal form moves along image depth.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Derives a normalized view direction from the two admitted independent image-plane rows rather than trusting a rounded third row.
 */
export function portraitNasalViewRay(
  horizontal: readonly number[],
  vertical: readonly number[],
): number[] {
  if (
    [horizontal, vertical].some(
      (v) => v.length !== 3 || !v.every(Number.isFinite),
    )
  )
    throw new Error(
      "A nasal projection frame needs finite three-component rows.",
    );
  const ray = Vector3.normalize(
    Vector3.cross(
      Vector3.normalize(
        Vector3.create(...(horizontal as [number, number, number])),
      ),
      Vector3.normalize(
        Vector3.create(...(vertical as [number, number, number])),
      ),
    ),
  );
  if (Vector3.length(ray) === 0)
    throw new Error("A nasal projection frame needs independent image axes.");
  return [ray.x, ray.y, ray.z];
}