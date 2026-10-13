import { readAutoMovieRenderTextureTarget } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * Framebuffer facts come from the actual target object, including every color
 * attachment and its depth/stencil type. Source-image facts cannot replace them.
 *
 * Scenarios:
 *
 * 1. Real byte/half/float targets report their actual formats, mip and samples;
 *    custom short/float depth and stencil keep their conservative storage widths.
 * 2. Unsupported depth and color formats stay unknown, while an absent depth
 *    attachment reports zero; cube/array/volume targets stay outside 2D support.
 */
export const test_viewer_texture_target_facts = async (): Promise<void> => {
  const THREE = await import("three");
  const target = new THREE.WebGLRenderTarget(4, 4, { count: 2, samples: 4, generateMipmaps: true });
  TestValidator.equals("actual attachment population", readAutoMovieRenderTextureTarget("view", target, "shot"), {
    owner: "view", transmissionScope: "shot", width: 4, height: 4,
    formats: ["rgba8", "rgba8"], mipmapped: true, samples: 4, depthBytesPerTexel: 4, depthTexture: false,
  });
  target.textures[0].type = THREE.HalfFloatType;
  target.textures[1].type = THREE.FloatType;
  TestValidator.equals("actual component formats", readAutoMovieRenderTextureTarget("view", target).formats, ["rgba16f", "rgba32f"]);
  target.setSize(4.5, 3.75);
  TestValidator.equals("physical fractional target extents", [readAutoMovieRenderTextureTarget("view", target).width,
    readAutoMovieRenderTextureTarget("view", target).height], [4, 3]);
  target.setSize(4, 4);
  target.depthTexture = new THREE.DepthTexture(4, 4, THREE.UnsignedShortType);
  TestValidator.equals("short depth", readAutoMovieRenderTextureTarget("view", target).depthBytesPerTexel, 2);
  TestValidator.equals("custom depth is a texture", readAutoMovieRenderTextureTarget("view", target).depthTexture, true);
  target.depthTexture.format = THREE.DepthStencilFormat;
  TestValidator.equals("resolved short stencil depth remains four bytes", readAutoMovieRenderTextureTarget("view", target).depthBytesPerTexel, 4);
  target.depthTexture.type = THREE.FloatType;
  TestValidator.equals("resolved float stencil depth remains eight bytes", readAutoMovieRenderTextureTarget("view", target).depthBytesPerTexel, 8);
  target.depthTexture.format = THREE.DepthFormat;
  target.depthTexture.type = THREE.UnsignedShortType;
  target.stencilBuffer = true;
  TestValidator.equals("stencil upgrades short depth", readAutoMovieRenderTextureTarget("view", target).depthBytesPerTexel, 4);
  target.depthTexture.type = THREE.FloatType;
  TestValidator.equals("float depth with stencil", readAutoMovieRenderTextureTarget("view", target).depthBytesPerTexel, 8);
  target.stencilBuffer = false;
  TestValidator.equals("float depth", readAutoMovieRenderTextureTarget("view", target).depthBytesPerTexel, 4);
  for (const type of [THREE.UnsignedIntType, THREE.UnsignedInt248Type]) {
    target.depthTexture.type = type;
    TestValidator.equals("integer depth", readAutoMovieRenderTextureTarget("view", target).depthBytesPerTexel, 4);
  }
  target.depthTexture.type = THREE.IntType;
  TestValidator.equals("unsupported depth type", readAutoMovieRenderTextureTarget("view", target).depthBytesPerTexel, null);
  target.depthTexture.type = THREE.UnsignedIntType;
  target.depthTexture.setValues({ format: THREE.RGBAFormat });
  TestValidator.equals("unsupported depth channel format", readAutoMovieRenderTextureTarget("view", target).depthBytesPerTexel, null);
  target.depthTexture.setValues({ format: THREE.DepthFormat });
  TestValidator.equals("supported adjacent depth format", readAutoMovieRenderTextureTarget("view", target).depthBytesPerTexel, 4);
  for (const texture of target.textures) texture.generateMipmaps = false;
  TestValidator.equals("no generated target chain", readAutoMovieRenderTextureTarget("view", target).mipmapped, false);
  target.texture.mipmaps = [{ width: 4, height: 4, data: new Uint8Array(64) }, { width: 2, height: 2, data: new Uint8Array(16) }];
  TestValidator.equals("explicit target mip chain", readAutoMovieRenderTextureTarget("view", target).mipmapped, true);
  target.depthBuffer = false;
  TestValidator.equals("absent depth", readAutoMovieRenderTextureTarget("view", target).depthBytesPerTexel, 0);
  TestValidator.equals("disabled depth texture does not allocate", readAutoMovieRenderTextureTarget("view", target).depthTexture, false);
  target.depth = 2;
  TestValidator.equals("volume target is not 2D", readAutoMovieRenderTextureTarget("view", target).formats, [undefined, undefined]);
  const cube = new THREE.WebGLCubeRenderTarget(4);
  TestValidator.equals("cube target retains its actual face population", [readAutoMovieRenderTextureTarget("cube", cube).formats,
    readAutoMovieRenderTextureTarget("cube", cube).faces], [["rgba8"], 6]);
  const rg = new THREE.WebGLRenderTarget(4, 4, { format: THREE.RGFormat, type: THREE.HalfFloatType });
  TestValidator.equals("native RG half attachment", readAutoMovieRenderTextureTarget("rg", rg).formats, ["rg16f"]);
  rg.texture.internalFormat = "RG16F";
  TestValidator.equals("explicit RG half attachment", readAutoMovieRenderTextureTarget("rg", rg).formats, ["rg16f"]);
  target.depth = 1;
  target.texture = new THREE.DataArrayTexture(new Uint8Array(64), 4, 4, 1);
  TestValidator.equals("array target is not 2D", readAutoMovieRenderTextureTarget("view", target).formats, [undefined, undefined]);
  target.texture = new THREE.Data3DTexture(new Uint8Array(64), 4, 4, 1);
  TestValidator.equals("3D target is not 2D", readAutoMovieRenderTextureTarget("view", target).formats, [undefined, undefined]);
  cube.dispose();
  rg.dispose();
  target.dispose();
};
