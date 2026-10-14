import type { IAutoMovieLight } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Project one actual punctual light into the Engine's shadow-caster identity. The caller supplies the authored or runtime identity. Native class markers own the kind and castShadow owns participation, independent of visibility. Other scene objects and non-punctual lights return null rather than a fabricated shadow source. Admission and allocation formulas stay in Engine.
 *
 * @evidence contracts/common.md#principled-implementation Projects actual point/directional/spot native markers and castShadow into one Engine shadow source under the caller-supplied identity.
 * @evidence contracts/common.md#clear-and-simple-design Small host identity projection stays separate from Engine compatibility admission and viewer target planning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonpunctual objects return null and visibility does not silently erase a retained caster; marker/identity facts do not themselves prove shadow allocation or rendered appearance.
 * @evidence contracts/common.md#meaningful-documentation Documents native kind, castShadow participation, unsupported object null result and caller identity responsibility.
 * @evidence contracts/performance.md#efficient-algorithms Three marker checks and one castShadow read are fixed work with at most one small result record.
 * @evidence contracts/performance.md#reuse-equivalent-work Every supplied object current participation is observed; equal id text alone does not cache another light allocation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only copied id/kind/flag values escape, and no scene object, shadow target or native handle is acquired or retained.
 */
export const readAutoMovieShadowLightSource: (
  id: string,
  object: THREE.Object3D,
) => Pick<IAutoMovieLight, "id" | "type" | "castShadow"> | null = (
  id: string,
  object: THREE.Object3D,
): Pick<IAutoMovieLight, "id" | "type" | "castShadow"> | null => {
  const light: THREE.Light & {
    isPointLight?: boolean;
    isDirectionalLight?: boolean;
    isSpotLight?: boolean;
  } = object as THREE.Light & {
    isPointLight?: boolean;
    isDirectionalLight?: boolean;
    isSpotLight?: boolean;
  };
  const type: "point" | "directional" | "spot" | null =
    light.isPointLight === true
      ? "point"
      : light.isDirectionalLight === true
        ? "directional"
        : light.isSpotLight === true
          ? "spot"
          : null;
  return type === null ? null : { id, type, castShadow: light.castShadow };
};
