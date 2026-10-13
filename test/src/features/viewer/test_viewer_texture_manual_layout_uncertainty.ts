import { measureAutoMovieRenderTextureClosure } from "@automovie/engine";
import { readAutoMovieTextureSource } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

import { material } from "../internal/renderFixtures";

/**
 * Native manual uploads can mutate generation flags while retaining different
 * cached allocations. Metadata observes their base but cannot certify storage
 * sharing; the normal closure keeps both bytes and cardinality unknown.
 *
 * Scenarios:
 *
 * 1. Empty manual lists preserve supported no-manual sharing; one and many
 *    manual levels report their actual first base and uncertified allocation.
 * 2. Generation and filter combinations, incomplete/noncanonical levels,
 *    malformed lists and unsafe first levels cannot manufacture a safe bound.
 * 3. Ordinary intrinsic/display extent metadata remains distinct from original
 *    image fields; unsupported native layouts retain diagnostic extent only.
 */
export const test_viewer_texture_manual_layout_uncertainty = async (): Promise<void> => {
  const THREE = await import("three");
  const texture = new THREE.DataTexture(new Uint8Array(64), 4, 4);
  const first = { width: 8, height: 8, data: new Uint8Array(256) };
  const read = () => readAutoMovieTextureSource("manual", texture);
  TestValidator.equals("empty manual list retains authority", read().allocationStateKnown, true);
  const configurations = [[first], [first, { width: 4, height: 4, data: new Uint8Array(64) }],
    [first, { width: 7, height: 7, data: new Uint8Array(196) }],
    Array.from({ length: 6 }, () => first)];
  for (const mipmaps of configurations) {
    texture.mipmaps = mipmaps;
    for (const generate of [false, true])
      for (const filter of [THREE.NearestFilter, THREE.LinearFilter, THREE.NearestMipmapLinearFilter, THREE.LinearMipmapLinearFilter]) {
        texture.generateMipmaps = generate;
        texture.minFilter = filter;
        const fact = read();
        TestValidator.equals("manual first level owns observed extent", [fact.width, fact.height], [8, 8]);
        TestValidator.equals("current manual flags never certify native allocation", fact.allocationStateKnown, false);
        const cost = measureAutoMovieRenderTextureClosure({ materials: [material("surface", "manual")], sources: [fact], environment: null });
        TestValidator.equals("manual metadata refuses byte and count claims", cost.filter((row) => row.asset !== null).map((row) => [row.bytes, row.allocations]), [[null, null]]);
      }
  }
  texture.mipmaps = [first];
  const environment = measureAutoMovieRenderTextureClosure({ materials: [material("pbr")], sources: [read()], environment: "manual" });
  TestValidator.predicate("uncertified raw input does not produce guessed environment bytes", environment.filter((row) =>
    row.variant === "environment-background-cube" || row.variant === "environment-cubeuv").every((row) => row.bytes === null));
  for (const mipmaps of [null, {}, [null], [{}], [{ width: 0, height: 8 }],
    [{ width: 1.5, height: 8 }], [{ width: Number.MAX_SAFE_INTEGER + 1, height: 8 }]]) {
    Object.assign(texture, { mipmaps });
    TestValidator.equals("malformed manual layout remains uncertified", read().allocationStateKnown, false);
  }
  const ordinary = new THREE.Texture();
  ordinary.image = { width: 2, height: 2, naturalWidth: 8, naturalHeight: 8 };
  TestValidator.equals("intrinsic extent is distinct from image factory fields", [readAutoMovieTextureSource("image", ordinary).width,
    readAutoMovieTextureSource("image", ordinary).height, readAutoMovieTextureSource("image", ordinary).allocationStateKnown], [8, 8, false]);
  ordinary.image = { width: 8, height: 2, naturalWidth: 8, naturalHeight: 8 };
  TestValidator.equals("matching width does not certify a different factory height", [readAutoMovieTextureSource("image", ordinary).height,
    readAutoMovieTextureSource("image", ordinary).allocationStateKnown], [8, false]);
  ordinary.image = { width: 4, height: 4, naturalWidth: 0, naturalHeight: 0 };
  TestValidator.equals("native intrinsic fallback preserves matching fields", readAutoMovieTextureSource("image", ordinary).allocationStateKnown, true);
  ordinary.image = { displayWidth: 8, displayHeight: 4 };
  TestValidator.equals("display-only extent retains unknown factory authority", [readAutoMovieTextureSource("frame", ordinary).width,
    readAutoMovieTextureSource("frame", ordinary).height, readAutoMovieTextureSource("frame", ordinary).allocationStateKnown], [8, 4, false]);
  ordinary.image = { width: 8, displayWidth: 8, displayHeight: 4 };
  TestValidator.equals("present raw width cannot replace an absent factory height", readAutoMovieTextureSource("frame", ordinary).allocationStateKnown, false);
  const framebuffer = new THREE.FramebufferTexture(4, 4);
  framebuffer.mipmaps = [first];
  TestValidator.equals("framebuffer family keeps its own base", [readAutoMovieTextureSource("framebuffer", framebuffer).width,
    readAutoMovieTextureSource("framebuffer", framebuffer).allocationStateKnown], [4, false]);
  framebuffer.mipmaps = [];
  for (const filter of [THREE.NearestFilter, THREE.LinearFilter,
    THREE.NearestMipmapNearestFilter, THREE.LinearMipmapLinearFilter]) {
    framebuffer.minFilter = filter;
    const fact = readAutoMovieTextureSource("framebuffer", framebuffer);
    TestValidator.equals("framebuffer copying requires its owning profile", fact.allocationStateKnown, false);
    TestValidator.equals("native framebuffer filter allocates levels without generation", fact.mipmapped,
      filter !== THREE.NearestFilter && filter !== THREE.LinearFilter);
    const cost = measureAutoMovieRenderTextureClosure({ materials: [material("copy", "framebuffer")], sources: [fact], environment: null });
    TestValidator.equals("copied display cannot claim decoded-source bytes or cardinality", cost.filter((row) => row.asset !== null).map((row) => [row.bytes, row.allocations]), [[null, null]]);
  }
  const depth = new THREE.DepthTexture(4, 4);
  depth.mipmaps = [first];
  TestValidator.equals("depth family keeps its own base", readAutoMovieTextureSource("depth", depth).width, 4);
  depth.mipmaps = [];
  TestValidator.equals("depth requires its attachment owner rather than raw source authority", readAutoMovieTextureSource("depth", depth).allocationStateKnown, false);
  const compressed = new THREE.CompressedTexture([first], 4, 4, THREE.RGBA_S3TC_DXT5_Format);
  TestValidator.equals("compressed manual container has no allocation authority", readAutoMovieTextureSource("compressed", compressed).allocationStateKnown, false);
  compressed.mipmaps = [];
  TestValidator.equals("compressed authority is independent of manual population", readAutoMovieTextureSource("compressed", compressed).allocationStateKnown, false);
  const target = new THREE.WebGLRenderTarget(4, 4);
  target.texture.mipmaps = [first];
  TestValidator.equals("target attachment keeps owner extent", readAutoMovieTextureSource("target", target.texture).width, 4);
  texture.dispose(); ordinary.dispose(); framebuffer.dispose(); depth.dispose(); compressed.dispose(); target.dispose();
};
