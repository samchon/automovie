import { measureAutoMovieRenderTextureClosure } from "@automovie/engine";
import { readAutoMovieTextureSource } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type {
  CompressedTexture,
  CompressedTextureImageData,
  DepthTexture,
  DepthTextureImageData,
  Texture,
  TextureEventMap,
  WebGLRenderTarget,
} from "three";

import { material } from "../internal/renderFixtures";

/**
 * Exercises ordinary source facts when manual mips or intrinsic/factory extents cannot certify native history.
 *
 * Scenarios:
 * 1. Empty/manual mip configurations distinguish supported authority from retained authored first-level extents and uncertain native history.
 * 2. Generation/filter combinations, malformed levels and both independently required environment products retain unknown bytes/cardinality.
 * 3. Intrinsic/display and raw factory dimensions contrast matching fallback; framebuffer, depth, compressed and target families preserve their separate ownership boundary.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls real texture observation and Engine closure over authored manual layouts and unsupported families, preserving diagnostics while refusing bytes/cardinality.
 * @evidence contracts/testing.md#independent-expectations Authored first-level sizes, independently required closure populations and unknown-value expectations judge metadata; current flags do not establish prior native upload layout.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts empty/manual/generated/filter policies, canonical/malformed levels, intrinsic/display dimensions and framebuffer/depth/compressed/target families without inventing safe storage.
 * @evidence contracts/testing.md#execution-ownership The named entry owns existing CPU Three inputs, releases wrappers and uses no native renderer, GPU query or new layout driver.
 */
export async function test_viewer_texture_manual_layout_uncertainty(): Promise<void> {
  const THREE: typeof import("three") = await import("three");
  const texture: import("three").DataTexture = new THREE.DataTexture(
    new Uint8Array(64),
    4,
    4,
  );
  const first: {
    width: number;
    height: number;
    data: Uint8Array<ArrayBuffer>;
  } = { width: 8, height: 8, data: new Uint8Array(256) };
  const read: () => import("@automovie/engine").IAutoMovieRenderTextureSource =
    (): import("@automovie/engine").IAutoMovieRenderTextureSource =>
      readAutoMovieTextureSource("manual", texture);
  TestValidator.equals(
    "empty manual list retains authority",
    read().allocationStateKnown,
    true,
  );
  const configurations: {
    width: number;
    height: number;
    data: Uint8Array<ArrayBuffer>;
  }[][] = [
    [first],
    [first, { width: 4, height: 4, data: new Uint8Array(64) }],
    [first, { width: 7, height: 7, data: new Uint8Array(196) }],
    Array.from(
      { length: 6 },
      (): { width: number; height: number; data: Uint8Array<ArrayBuffer> } =>
        first,
    ),
  ];
  for (const mipmaps of configurations) {
    texture.mipmaps = mipmaps;
    for (const generate of [false, true])
      for (const filter of [
        THREE.NearestFilter,
        THREE.LinearFilter,
        THREE.NearestMipmapLinearFilter,
        THREE.LinearMipmapLinearFilter,
      ]) {
        texture.generateMipmaps = generate;
        texture.minFilter = filter;
        const fact: import("@automovie/engine").IAutoMovieRenderTextureSource =
          read();
        TestValidator.equals(
          "manual first level owns observed extent",
          [fact.width, fact.height],
          [8, 8],
        );
        TestValidator.equals(
          "current manual flags never certify native allocation",
          fact.allocationStateKnown,
          false,
        );
        const cost: ReturnType<typeof measureAutoMovieRenderTextureClosure> =
          measureAutoMovieRenderTextureClosure({
            materials: [material("surface", "manual")],
            sources: [fact],
            environment: null,
          });
        TestValidator.equals(
          "manual metadata refuses byte and count claims",
          cost
            .filter(
              (
                row: import("@automovie/interface").IAutoMovieRenderTextureCost,
              ): boolean => row.asset !== null,
            )
            .map(
              (
                row: import("@automovie/interface").IAutoMovieRenderTextureCost,
              ): (number | null | undefined)[] => [row.bytes, row.allocations],
            ),
          [[null, null]],
        );
      }
  }
  texture.mipmaps = [first];
  const environment: ReturnType<typeof measureAutoMovieRenderTextureClosure> =
    measureAutoMovieRenderTextureClosure({
      materials: [material("pbr")],
      sources: [read()],
      environment: "manual",
    });
  const environmentProducts: ReturnType<
    typeof measureAutoMovieRenderTextureClosure
  > = environment.filter(
    (
      row: import("@automovie/interface").IAutoMovieRenderTextureCost,
    ): boolean =>
      row.variant === "environment-background-cube" ||
      row.variant === "environment-cubeuv",
  );
  TestValidator.equals(
    "both required environment products remain reported",
    environmentProducts
      .map(
        (
          row: import("@automovie/interface").IAutoMovieRenderTextureCost,
        ): string | undefined => row.variant,
      )
      .sort((a: string | undefined, b: string | undefined): number =>
        a === b
          ? 0
          : a === undefined
            ? 1
            : b === undefined
              ? -1
              : a < b
                ? -1
                : 1,
      ),
    ["environment-background-cube", "environment-cubeuv"],
  );
  TestValidator.predicate(
    "uncertified raw input does not produce guessed environment bytes",
    environmentProducts.every(
      (
        row: import("@automovie/interface").IAutoMovieRenderTextureCost,
      ): boolean => row.bytes === null,
    ),
  );
  for (const mipmaps of [
    null,
    {},
    [null],
    [{}],
    [{ width: 0, height: 8 }],
    [{ width: 1.5, height: 8 }],
    [{ width: Number.MAX_SAFE_INTEGER + 1, height: 8 }],
  ]) {
    Object.assign(texture, { mipmaps });
    TestValidator.equals(
      "malformed manual layout remains uncertified",
      read().allocationStateKnown,
      false,
    );
  }
  const ordinary: Texture<unknown, TextureEventMap> = new THREE.Texture();
  ordinary.image = { width: 2, height: 2, naturalWidth: 8, naturalHeight: 8 };
  TestValidator.equals(
    "intrinsic extent is distinct from image factory fields",
    [
      readAutoMovieTextureSource("image", ordinary).width,
      readAutoMovieTextureSource("image", ordinary).height,
      readAutoMovieTextureSource("image", ordinary).allocationStateKnown,
    ],
    [8, 8, false],
  );
  ordinary.image = { width: 8, height: 2, naturalWidth: 8, naturalHeight: 8 };
  TestValidator.equals(
    "matching width does not certify a different factory height",
    [
      readAutoMovieTextureSource("image", ordinary).height,
      readAutoMovieTextureSource("image", ordinary).allocationStateKnown,
    ],
    [8, false],
  );
  ordinary.image = { width: 4, height: 4, naturalWidth: 0, naturalHeight: 0 };
  TestValidator.equals(
    "native intrinsic fallback preserves matching fields",
    readAutoMovieTextureSource("image", ordinary).allocationStateKnown,
    true,
  );
  ordinary.image = { displayWidth: 8, displayHeight: 4 };
  TestValidator.equals(
    "display-only extent retains unknown factory authority",
    [
      readAutoMovieTextureSource("frame", ordinary).width,
      readAutoMovieTextureSource("frame", ordinary).height,
      readAutoMovieTextureSource("frame", ordinary).allocationStateKnown,
    ],
    [8, 4, false],
  );
  ordinary.image = { width: 8, displayWidth: 8, displayHeight: 4 };
  TestValidator.equals(
    "present raw width cannot replace an absent factory height",
    readAutoMovieTextureSource("frame", ordinary).allocationStateKnown,
    false,
  );
  const framebuffer: import("three").FramebufferTexture =
    new THREE.FramebufferTexture(4, 4);
  framebuffer.mipmaps = [first];
  TestValidator.equals(
    "framebuffer family keeps its own base",
    [
      readAutoMovieTextureSource("framebuffer", framebuffer).width,
      readAutoMovieTextureSource("framebuffer", framebuffer)
        .allocationStateKnown,
    ],
    [4, false],
  );
  framebuffer.mipmaps = [];
  for (const filter of [
    THREE.NearestFilter,
    THREE.LinearFilter,
    THREE.NearestMipmapNearestFilter,
    THREE.LinearMipmapLinearFilter,
  ]) {
    framebuffer.minFilter = filter;
    const fact: import("@automovie/engine").IAutoMovieRenderTextureSource =
      readAutoMovieTextureSource("framebuffer", framebuffer);
    TestValidator.equals(
      "framebuffer copying requires its owning profile",
      fact.allocationStateKnown,
      false,
    );
    TestValidator.equals(
      "framebuffer mip-request metadata follows filter even without generation",
      fact.mipmapped,
      filter !== THREE.NearestFilter && filter !== THREE.LinearFilter,
    );
    const cost: ReturnType<typeof measureAutoMovieRenderTextureClosure> =
      measureAutoMovieRenderTextureClosure({
        materials: [material("copy", "framebuffer")],
        sources: [fact],
        environment: null,
      });
    TestValidator.equals(
      "copied display cannot claim decoded-source bytes or cardinality",
      cost
        .filter(
          (
            row: import("@automovie/interface").IAutoMovieRenderTextureCost,
          ): boolean => row.asset !== null,
        )
        .map(
          (
            row: import("@automovie/interface").IAutoMovieRenderTextureCost,
          ): (number | null | undefined)[] => [row.bytes, row.allocations],
        ),
      [[null, null]],
    );
  }
  const depth: DepthTexture<DepthTextureImageData> = new THREE.DepthTexture(
    4,
    4,
  );
  depth.mipmaps = [first];
  TestValidator.equals(
    "depth family keeps its own base",
    readAutoMovieTextureSource("depth", depth).width,
    4,
  );
  depth.mipmaps = [];
  TestValidator.equals(
    "depth requires its attachment owner rather than raw source authority",
    readAutoMovieTextureSource("depth", depth).allocationStateKnown,
    false,
  );
  const compressed: CompressedTexture<CompressedTextureImageData> =
    new THREE.CompressedTexture([first], 4, 4, THREE.RGBA_S3TC_DXT5_Format);
  TestValidator.equals(
    "compressed manual container has no allocation authority",
    readAutoMovieTextureSource("compressed", compressed).allocationStateKnown,
    false,
  );
  compressed.mipmaps = [];
  TestValidator.equals(
    "compressed authority is independent of manual population",
    readAutoMovieTextureSource("compressed", compressed).allocationStateKnown,
    false,
  );
  const target: WebGLRenderTarget<Texture<unknown, TextureEventMap>> =
    new THREE.WebGLRenderTarget(4, 4);
  target.texture.mipmaps = [first];
  TestValidator.equals(
    "target attachment keeps owner extent",
    readAutoMovieTextureSource("target", target.texture).width,
    4,
  );
  texture.dispose();
  ordinary.dispose();
  framebuffer.dispose();
  depth.dispose();
  compressed.dispose();
  target.dispose();
}
