import * as THREE from "three";
import { AutoMovieThreeKind } from "./AutoMovieThreeKind.js";

/**
 * The unlit base-colour material the `albedo` guide pass draws in place of one
 * beauty material.
 *
 * It draws the original's base colour alone: its `color` factor times its `map`
 * texel, and its vertex colours where the original uses them, with no light,
 * environment, shadow, fog, tone mapping or exposure (`toneMapped` is off, and
 * an unlit material receives no light). The factor is copied in three.js's
 * linear working space, so the renderer's output conversion encodes it to sRGB
 * once: a linear `(1, 0, 0)` is written as `#ff0000`. The `map` keeps its own
 * sRGB colour space and is decoded to linear when sampled, as in the beauty
 * pass.
 *
 * Coverage follows the beauty pass. A surface the beauty pass skips, a material
 * with `visible` false such as a fully transparent blended surface with no
 * transmission (`buildMaterial`), stays hidden. An alpha-test cutout keeps its
 * `alphaTest`, `alphaMap` and opacity, so the same texels are discarded. Every
 * other surface is drawn opaque, because the pass reports colour, not coverage
 * by translucency. Face culling follows the original's `side`.
 *
 * A material with no `color` factor, such as a shader material, has no base
 * colour to report and is drawn black, the colour of the pass's background,
 * while it still hides what is behind it. Overlays, emission and every other
 * lobe are not part of the base colour and are not drawn.
 *
 * The caller owns the returned material; the original is only read.
 */
export function createAutoMovieAlbedoMaterial(
  original: THREE.Material,
): THREE.MeshBasicMaterial {
  const source: IBaseColorSource = original as IBaseColorSource;
  const color: THREE.Color =
    AutoMovieThreeKind.isColor(source.color)
      ? source.color.clone()
      : new THREE.Color(0, 0, 0);
  const cutout: boolean = original.alphaTest > 0;
  return new THREE.MeshBasicMaterial({
    name: `albedo:${original.name}`,
    color,
    map: AutoMovieThreeKind.isTexture(source.map) ? source.map : null,
    alphaMap: AutoMovieThreeKind.isTexture(source.alphaMap) ? source.alphaMap : null,
    vertexColors: original.vertexColors,
    alphaTest: original.alphaTest,

    // A cutout compares opacity times texel alpha with its threshold, so it
    // keeps the opacity the beauty pass tests; anything else draws opaque.
    opacity: cutout ? original.opacity : 1,
    transparent: false,
    depthWrite: true,
    side: original.side,
    visible: original.visible,
    fog: false,
    toneMapped: false,
  });
}

/**
 * The base-colour fields a three.js surface material may carry; each is checked
 * at runtime before use.
 */
interface IBaseColorSource extends THREE.Material {
  /**
   * The linear base-colour factor of a standard, physical, basic, Lambert or
   * Phong material.
   */
  color?: unknown;

  /** The sRGB base-colour texture multiplied by the factor. */
  map?: unknown;

  /** The texture whose green channel scales opacity. */
  alphaMap?: unknown;
}
