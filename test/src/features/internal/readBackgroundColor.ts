import { AutoMovieThreeKind } from "@automovie/render";
import type * as THREE from "three";

/** A scene's background colour, refusing a scene with none or a texture. */
export function readBackgroundColor(scene: THREE.Scene): THREE.Color {
  const background: THREE.Color | THREE.Texture | null = scene.background;
  if (background === null || !AutoMovieThreeKind.isColor(background))
    throw new Error("Expected a background colour");
  return background;
}
