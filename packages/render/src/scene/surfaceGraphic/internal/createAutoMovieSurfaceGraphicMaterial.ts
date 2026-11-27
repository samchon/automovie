import type {
  IAutoMovieColor,
  IAutoMovieSurfaceGraphic,
} from "@automovie/interface";
import * as THREE from "three";

/*
 * The material one surface graphic layer, or its background, draws with.
 *
 * An `emissive` graphic is unlit: a `MeshBasicMaterial` whose colour is the
 * linear colour times the white luminance in cd/m², so a pixel's radiance is
 * its colour (times its decoded sRGB texel) times `luminance`, in the units the
 * renderer's photometric lights produce. A `printed` graphic is a
 * `MeshLambertMaterial` whose albedo is the linear colour (times the texel),
 * lit by the scene like any matte surface.
 *
 * Every graphic material blends by the colour's alpha (`null` is opaque) and
 * the texel's alpha, tests depth so whatever stands in front hides it, and
 * writes no depth, so the layers of one face stack by render order and never by
 * depth. The texture stays the caller's.
 */
export function createAutoMovieSurfaceGraphicMaterial(
  emission: IAutoMovieSurfaceGraphic["emission"],
  color: Pick<IAutoMovieColor, "r" | "g" | "b" | "a">,
  map: THREE.Texture | null = null,
): THREE.MeshBasicMaterial | THREE.MeshLambertMaterial {
  const scale: number = emission.kind === "emissive" ? emission.luminance : 1;
  const parameters: {
    color: THREE.Color;
    map: THREE.Texture | null;
    opacity: number;
    transparent: true;
    depthWrite: false;
  } = {
    color: new THREE.Color(color.r * scale, color.g * scale, color.b * scale),
    map,
    opacity: color.a ?? 1,
    transparent: true,
    depthWrite: false,
  };
  return emission.kind === "emissive"
    ? new THREE.MeshBasicMaterial(parameters)
    : new THREE.MeshLambertMaterial(parameters);
}
