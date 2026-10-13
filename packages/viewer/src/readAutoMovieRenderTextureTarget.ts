import type { IAutoMovieRenderTextureTarget } from "@automovie/engine";
import * as THREE from "three";

import { readAutoMovieTextureUploadFormat } from "./readAutoMovieTextureUploadFormat.js";

/**
 * Read a host-owned 2D target's complete attachment profile before drawing.
 * Cube targets retain six color/depth faces; array and volume targets stay unknown.
 * Depth without a custom texture uses the r186 D24/D24S8 four-byte bound;
 * custom float-depth plus stencil uses the eight-byte D32FS8 profile.
 * Native GL dimensions truncate positive fractional target declarations; the
 * reported extents follow that physical pixel population rather than preserving
 * a fractional JavaScript width as an unmeasurable texture.
 * The target owns allocation identity independently of its texture's Source.
 * No target state, pixels or caller lifetime is changed.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies actual framebuffer formats, mips, samples and depth attachment facts to memory preflight.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Prevents target color textures from substituting for the complete attachment cost.
 */
export function readAutoMovieRenderTextureTarget(
  owner: string,
  target: THREE.RenderTarget,
  transmissionScope?: string,
): IAutoMovieRenderTextureTarget {
  const cube = "isWebGLCubeRenderTarget" in target;
  const unsupported = target.depth !== 1 ||
    target.textures.some((texture) => "isDataArrayTexture" in texture || "isData3DTexture" in texture);
  const depth = target.depthTexture;
  const depthBytesPerTexel = !target.depthBuffer ? 0 : depth === null ? 4 :
    depth.format !== THREE.DepthFormat && depth.format !== THREE.DepthStencilFormat ? null :
    depth.type === THREE.FloatType ? target.stencilBuffer || depth.format === THREE.DepthStencilFormat ? 8 : 4 :
    depth.type === THREE.UnsignedIntType || depth.type === THREE.UnsignedInt248Type ? 4 :
    depth.type === THREE.UnsignedShortType ? target.stencilBuffer || depth.format === THREE.DepthStencilFormat ? 4 : 2 : null;
  return { owner, transmissionScope, width: Math.floor(target.width), height: Math.floor(target.height),
    formats: target.textures.map((texture) => unsupported ? undefined : readAutoMovieTextureUploadFormat(texture)),
    mipmapped: target.textures.some((texture) => texture.generateMipmaps || texture.mipmaps.length > 1),
    samples: target.samples, depthBytesPerTexel, depthTexture: target.depthBuffer && depth !== null,
    ...(cube ? { faces: 6 as const } : {}),
  };
}
