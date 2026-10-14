import type { IAutoMovieRenderTextureTarget } from "@automovie/engine";
import * as THREE from "three";

import { readAutoMovieTextureUploadFormat } from "./readAutoMovieTextureUploadFormat.js";

/**
 * Read a host-owned 2D target's complete attachment profile before drawing. Cube targets retain six color/depth faces; array and volume targets stay unknown. Depth without a custom texture uses the r186 D24/D24S8 four-byte bound; custom float-depth plus stencil uses the eight-byte D32FS8 profile. Native GL dimensions truncate positive fractional target declarations; the reported extents follow that physical pixel population rather than preserving a fractional JavaScript width as an unmeasurable texture. The target owns allocation identity independently of its texture's Source. No target state, pixels or caller lifetime is changed.
 *
 * @evidence contracts/common.md#principled-implementation Projects actual target attachments, integer physical extents, sample/mip requests, cube faces and supported depth/component profiles into Engine target metadata without drawing.
 * @evidence contracts/common.md#clear-and-simple-design Texture representation decoding remains shared with readAutoMovieTextureUploadFormat while target allocation identity is separately supplied by its owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Array/volume representations remain unknown, unsupported custom depth stays null and declared fields do not certify native allocation history; depth byte profiles are conservative installed-r186 bounds.
 * @evidence contracts/common.md#meaningful-documentation Documents target-owned allocation identity, fractional extent truncation, cube faces, custom/default depth and no pixel/lifetime mutation.
 * @evidence contracts/performance.md#efficient-algorithms A bounded set of scalar checks plus three attachment scans is O(A) for A color attachments, producing one format list without allocating attachment texels.
 * @evidence contracts/performance.md#reuse-equivalent-work Current target representation is read afresh and no earlier profile is reused after resize/attachment change; sharing must follow target identity rather than its Texture Source.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The target and textures stay borrowed and the returned row holds only scalar metadata; caller owns native allocation, observed retirement and retained phase facts.
 */
export function readAutoMovieRenderTextureTarget(
  owner: string,
  target: THREE.RenderTarget,
  transmissionScope?: string,
): IAutoMovieRenderTextureTarget {
  const cube: boolean = "isWebGLCubeRenderTarget" in target;
  const unsupported: boolean = target.depth !== 1 ||
    target.textures.some((texture: THREE.Texture) : boolean => "isDataArrayTexture" in texture || "isData3DTexture" in texture);
  const depth: THREE.DepthTexture | null = target.depthTexture;
  const depthBytesPerTexel: number | null = !target.depthBuffer ? 0 : depth === null ? 4 :
    depth.format !== THREE.DepthFormat && depth.format !== THREE.DepthStencilFormat ? null :
    depth.type === THREE.FloatType ? target.stencilBuffer || depth.format === THREE.DepthStencilFormat ? 8 : 4 :
    depth.type === THREE.UnsignedIntType || depth.type === THREE.UnsignedInt248Type ? 4 :
    depth.type === THREE.UnsignedShortType ? target.stencilBuffer || depth.format === THREE.DepthStencilFormat ? 4 : 2 : null;
  return { owner, transmissionScope, width: Math.floor(target.width), height: Math.floor(target.height),
    formats: target.textures.map((texture: THREE.Texture) : ReturnType<typeof readAutoMovieTextureUploadFormat> => unsupported ? undefined : readAutoMovieTextureUploadFormat(texture)),
    mipmapped: target.textures.some((texture: THREE.Texture) : boolean => texture.generateMipmaps || texture.mipmaps.length > 1),
    samples: target.samples, depthBytesPerTexel, depthTexture: target.depthBuffer && depth !== null,
    ...(cube ? { faces: 6 as const } : {}),
  };
}
