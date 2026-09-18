import { Vector3 } from "@automovie/engine";
import { normalizedRim } from "./normalizedRim";

/**
 * Shared by resizePortraitNostrilRim, fitPortraitNostrilRim, which were one file until each public identity took its own.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Changes nostril width and height independently of whole-nose dimensions and opening rotation.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Scales the aperture in its own normalized plane while retaining normal residuals and copying unit-scale inputs exactly.
 * @author Samchon
 */
// The oriented area normal comes from the complete closed boundary. Individual
// edges can be short or collinear without changing the meaning of its plane.
export const rimNormal = (local: ReturnType<typeof normalizedRim>["local"]) => {
  let normal = Vector3.create();
  for (let i = 0; i < local.length; i++)
    normal = Vector3.add(
      normal,
      Vector3.cross(local[i], local[(i + 1) % local.length]),
    );
  normal = Vector3.normalize(normal);
  if (Vector3.length(normal) === 0)
    throw new Error("A nasal rim needs a nonzero oriented area.");
  return normal;
};
