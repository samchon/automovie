import { AutoMovieRenderThreeKind } from "@automovie/render";
import type * as THREE from "three";

/** The one material an object draws with, refusing a material list. */
export function singleMaterial(
  material: THREE.Material | THREE.Material[],
): THREE.Material {
  if (!AutoMovieRenderThreeKind.isMaterial(material))
    throw new Error("Expected one material, not a material list");
  return material;
}
