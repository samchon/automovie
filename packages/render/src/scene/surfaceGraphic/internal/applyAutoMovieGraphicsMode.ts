import * as THREE from "three";

import { AutoMovieRenderThreeKind } from "../../AutoMovieRenderThreeKind.js";
import type { IAutoMovieRenderModeHandle } from "../../IAutoMovieRenderModeHandle.js";
import { overrideAutoMovieRenderModeMaterials } from "../../internal/overrideAutoMovieRenderModeMaterials.js";
import { restoreAutoMovieRenderModeOnce } from "../../internal/restoreAutoMovieRenderModeOnce.js";
import { AutoMovieRenderSurfaceGraphicKey } from "../../AutoMovieRenderSurfaceGraphicKey.js";

/*
 * The `graphics` pass: surface graphics alone, drawn exactly as the beauty pass
 * draws them, over a transparent background.
 *
 * Every mesh outside a surface graphic root takes a material of its own that
 * writes depth but no colour, through the shared material override, so a body,
 * a prop's case or a flame in front of a screen still hides it, and a marching
 * formation or a dual-quaternion skin holds out where the beauty pass draws it.
 * A blended material whose opacity is below one, such as a lantern's glass
 * globe, holds out only that opacity, as beauty shows a screen through it: its
 * holdout writes no depth and scales the stored colour and alpha beneath it by
 * one minus its opacity, so the straight colour is kept and the coverage drops.
 * The graphics keep their own materials, exposure, tone curve and fog. The
 * scene's background is removed, so with a clear alpha of 0 a pixel's alpha is
 * the graphics' coverage. Because graphic materials blend colour by alpha onto
 * a transparent clear, the stored colour is associated with alpha, which the
 * capture divides back into straight colour. The restore puts back every
 * material and the background, once.
 */
export function applyAutoMovieGraphicsMode(
  scene: THREE.Scene,
): IAutoMovieRenderModeHandle {
  const graphics: Set<THREE.Object3D> = new Set();
  scene.traverse((object: THREE.Object3D): void => {
    if (object.userData[AutoMovieRenderSurfaceGraphicKey] === true)
      object.traverse((descendant: THREE.Object3D): void => {
        graphics.add(descendant);
      });
  });

  // Swap first: a refused swap restores itself and leaves the backdrop alone.
  const holdout: IAutoMovieRenderModeHandle =
    overrideAutoMovieRenderModeMaterials(
      scene,
      "graphics",
      (
        original: THREE.Material | THREE.Material[],
      ): THREE.Material | THREE.Material[] =>
        AutoMovieRenderThreeKind.isMaterial(original)
          ? holdOut(original)
          : original.map(holdOut),
      (mesh: THREE.Mesh): boolean => graphics.has(mesh),
    );
  const background: THREE.Scene["background"] = scene.background;
  scene.background = null;
  return {
    mode: "graphics",
    semantic: null,
    restore: restoreAutoMovieRenderModeOnce((): void => {
      scene.background = background;
      holdout.restore();
    }),
  };
}

/*
 * The holdout of one material: for a blended material below full opacity, a
 * depth-free material that multiplies the colour and alpha beneath it by one
 * minus that opacity; for any other, a depth-only material.
 */
const holdOut: (original: THREE.Material) => THREE.MeshBasicMaterial = (
  original: THREE.Material,
): THREE.MeshBasicMaterial =>
  original.transparent &&
  original.blending === THREE.NormalBlending &&
  original.opacity < 1
    ? new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: original.opacity,
        depthWrite: false,
        side: original.side,
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.ZeroFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
        blendSrcAlpha: THREE.ZeroFactor,
        blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      })
    : new THREE.MeshBasicMaterial({ colorWrite: false });
