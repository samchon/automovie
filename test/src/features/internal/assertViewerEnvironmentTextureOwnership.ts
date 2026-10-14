import type { IAutoMovieRenderTextureSource } from "@automovie/engine";
import type { IAutoMovieSceneEnvironment } from "@automovie/interface";
import {
  assessAutoMovieRenderBudget,
  autoMovieRenderBudgetEvidence,
  autoMovieRenderBudgetRefusal,
} from "@automovie/render";
import {
  AutoMovieTextureCache,
  applyMaterialOverlays,
  applySceneEnvironment,
  applySubsurfaceShading,
  buildLight,
  buildMaterial,
  readAutoMovieTextureSource,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type * as ThreeTypes from "three";

import { throwsError } from "./predicates";
import { compiledShotFixture } from "./renderBudgetFixtures";
import { material, sceneFixture } from "./renderFixtures";

/**
 * Texture handoffs preserve stable caches and refuse shared or uncertified allocation state before scene/material writes. Public native disposal events exercise the existing retry/recovery policy without an SDK method replacement or GL host.
 *
 * Scenarios:
 * 1. Stable and legally refreshed decoded images preserve or retire the owned tuple.
 * 2. Actual cache clones share pixels while scene, material and shader roles stay exclusive.
 * 3. Capacity changes, incomplete layouts and throwing disposal refuse; valid replacements recover.
 * 4. Normal assessment propagates unknown bytes/counts and admits recovered metadata before any draw.
 *
 * The PBR scenario exercises actual scene/material/cache handoffs, public texture disposal listeners and render-budget assessment; catches shared wrappers admitted to exclusive conversion, stale allocation authority and unknown storage reported as bounded.
 * Original Texture/Source identity, literal 4-by-4 capacities, component-byte arithmetic and ordered public disposal attempts define expectations. Recovery follows the current producer policy and does not independently prove PMREM uploads, native kernel retirement or a first hardware frame.
 * Preserves stable/legal refresh, source/capacity mismatch, incomplete dimensions, material/scene/cache sharing, actual native lookup conflicts, malformed mip state and throwing/refreshed handoffs; upload-key equivalence and frame rendering have separate tests.
 */
export const assertViewerEnvironmentTextureOwnership: () => Promise<void> =
  async (): Promise<void> => {
    const THREE: typeof ThreeTypes = await import("three");
    const environment: IAutoMovieSceneEnvironment = {
      image: "sky",
      background: null,
      intensity: 1,
      rotationDeg: 0,
      exposure: 1,
      toneMapping: "none",
      shadows: { enabled: false, type: "pcf" },
    };
    const make: () => ThreeTypes.DataTexture = (): ThreeTypes.DataTexture =>
      new THREE.DataTexture(new Uint8Array(64), 4, 4);
    const read: (texture: ThreeTypes.Texture) => boolean | undefined = (
      texture: ThreeTypes.Texture,
    ): boolean | undefined =>
      readAutoMovieTextureSource("sky", texture).allocationStateKnown;
    const scene: ThreeTypes.Scene<ThreeTypes.Object3DEventMap> =
      new THREE.Scene();
    for (const image of [{ width: 4 }, { height: 4 }, {}]) {
      const incomplete: ThreeTypes.Texture<
        unknown,
        ThreeTypes.TextureEventMap
      > = new THREE.Texture();
      incomplete.image = image;
      applySceneEnvironment(new THREE.Scene(), environment, incomplete);
      TestValidator.predicate(
        "ownership does not invent missing decoded dimensions",
        throwsError(
          (): IAutoMovieRenderTextureSource =>
            readAutoMovieTextureSource("sky", incomplete),
          "extent",
        ),
      );
      incomplete.dispose();
    }
    const texture: ThreeTypes.DataTexture = make();
    let disposals: number = 0;
    texture.addEventListener("dispose", (): void => {
      ++disposals;
    });
    texture.mapping = THREE.EquirectangularReflectionMapping;
    TestValidator.equals(
      "unmanaged converted source has no resident authority",
      read(texture),
      false,
    );
    texture.mapping = THREE.EquirectangularRefractionMapping;
    TestValidator.equals(
      "unmanaged refraction conversion also stays unknown",
      read(texture),
      false,
    );
    applySceneEnvironment(scene, environment, texture);
    TestValidator.equals(
      "owned initial handoff retires earlier conversions",
      [disposals, read(texture)],
      [1, true],
    );
    const version: number = texture.version;
    applySceneEnvironment(scene, environment, texture);
    TestValidator.equals(
      "stable application preserves cache and version",
      [disposals, texture.version, read(texture)],
      [1, version, true],
    );
    for (const change of [
      (): void => {
        texture.generateMipmaps = !texture.generateMipmaps;
      },
      (): void => {
        texture.minFilter = THREE.LinearFilter;
      },
      (): void => {
        texture.magFilter = THREE.LinearFilter;
      },
      (): void => {
        texture.wrapS = THREE.RepeatWrapping;
      },
      (): void => {
        texture.wrapT = THREE.MirroredRepeatWrapping;
      },
      (): void => {
        texture.flipY = !texture.flipY;
      },
      (): void => {
        texture.premultiplyAlpha = !texture.premultiplyAlpha;
      },
      (): void => {
        texture.unpackAlignment = 8;
      },
      (): void => {
        texture.anisotropy = 2;
      },
      (): void => {
        texture.colorSpace = THREE.NoColorSpace;
      },
      (): void => {
        texture.mapping = THREE.EquirectangularRefractionMapping;
      },
      (): void => {
        texture.image.data = new Uint8Array(64);
      },
      (): void => {
        texture.image = { width: 4, height: 4, data: new Uint8Array(64) };
      },
      (): void => {
        texture.needsUpdate = true;
      },
      (): void => {
        texture.mipmaps = [];
      },
    ]) {
      change();
      TestValidator.equals(
        "changed conversion is unbounded before transition",
        read(texture),
        false,
      );
      const before: number = disposals;
      applySceneEnvironment(scene, environment, texture);
      TestValidator.equals(
        "legal refresh retires once and recovers",
        [disposals, read(texture)],
        [before + 1, true],
      );
    }
    texture.dispose();
    texture.dispose();
    TestValidator.equals(
      "external retirement cannot keep a known snapshot",
      read(texture),
      false,
    );
    applySceneEnvironment(scene, environment, texture);
    TestValidator.equals(
      "same-capacity public retirement recovers",
      read(texture),
      true,
    );
    const foreign: ThreeTypes.Scene<ThreeTypes.Object3DEventMap> =
      new THREE.Scene();
    const oldBackground: ThreeTypes.Color = new THREE.Color(0.25, 0.5, 0.75);
    foreign.background = oldBackground;
    const beforeForeign: number[] = [disposals, texture.version];
    TestValidator.predicate(
      "another scene cannot take the wrapper",
      throwsError(
        (): void => applySceneEnvironment(foreign, environment, texture),
        "another scene",
      ),
    );
    TestValidator.equals(
      "foreign claim changes neither allocation nor old scene",
      [disposals, texture.version],
      beforeForeign,
    );
    TestValidator.predicate(
      "both owning scene and rejected scene survive",
      scene.environment === texture && foreign.background === oldBackground,
    );
    TestValidator.predicate(
      "material cannot write a scene-owned wrapper",
      throwsError(
        (): ThreeTypes.MeshPhysicalMaterial =>
          buildMaterial(
            material("bad", "sky"),
            (): ThreeTypes.DataTexture => texture,
          ),
        "exclusively",
      ),
    );

    const base: ThreeTypes.DataTexture = make();
    const cache: AutoMovieTextureCache = new AutoMovieTextureCache(
      async (): Promise<ThreeTypes.DataTexture> => base,
    );
    await cache.prime(["sky"]);
    const first: ThreeTypes.Texture<unknown, ThreeTypes.TextureEventMap> =
      cache.resolve("sky");
    applySceneEnvironment(new THREE.Scene(), environment, first);
    const second: ThreeTypes.Texture<unknown, ThreeTypes.TextureEventMap> =
      cache.resolve("sky");
    applySceneEnvironment(new THREE.Scene(), environment, second);
    const bound: ThreeTypes.MeshPhysicalMaterial = buildMaterial(
      material("surface", "sky"),
      cache.resolve,
    );
    TestValidator.predicate(
      "separate scene and material clones share pixels safely",
      first.source === second.source && first !== second && bound.map !== first,
    );
    TestValidator.equals(
      "normal shared Source touches do not invalidate wrappers",
      [read(first), read(second)],
      [true, true],
    );
    const materialTexture: ThreeTypes.DataTexture = make();
    const ordinary: ThreeTypes.MeshPhysicalMaterial = buildMaterial(
      material("ordinary", "sky"),
      (): ThreeTypes.DataTexture => materialTexture,
    );
    const materialVersion: number = materialTexture.version;
    TestValidator.predicate(
      "material-owned wrapper cannot become environment",
      throwsError(
        (): void =>
          applySceneEnvironment(
            new THREE.Scene(),
            environment,
            materialTexture,
          ),
        "material",
      ),
    );
    TestValidator.equals(
      "material conflict does not touch native version",
      materialTexture.version,
      materialVersion,
    );
    const geometry: ThreeTypes.BoxGeometry = new THREE.BoxGeometry();
    const foreignMaterial: ThreeTypes.MeshBasicMaterial =
      new THREE.MeshBasicMaterial();
    const inspectedScene: ThreeTypes.Scene<ThreeTypes.Object3DEventMap> =
      new THREE.Scene();
    const inspected: ThreeTypes.DataTexture = make();
    const cyclic: Record<string, unknown> = {
      other: make(),
      leaf: null,
      scalar: 4,
    };
    cyclic.self = cyclic;
    foreignMaterial.userData = {
      cycle: cyclic,
      uniform: { value: [inspected] },
    };
    inspectedScene.add(new THREE.Mesh(geometry, [foreignMaterial]));
    TestValidator.predicate(
      "native material arrays and cyclic uniform data expose sharing",
      throwsError(
        (): void =>
          applySceneEnvironment(inspectedScene, environment, inspected),
        "material",
      ),
    );
    const otherScene: ThreeTypes.Scene<ThreeTypes.Object3DEventMap> =
      new THREE.Scene();
    otherScene.add(
      new THREE.Mesh(geometry, foreignMaterial),
      new THREE.Object3D(),
    );
    const emptySlots: ThreeTypes.Object3D<ThreeTypes.Object3DEventMap> =
      new THREE.Object3D();
    Object.assign(emptySlots, { material: [null, undefined, 4] });
    otherScene.add(emptySlots);
    foreignMaterial.userData = {
      cycle: cyclic,
      vector: new THREE.Vector3(),
      absent: undefined,
    };
    applySceneEnvironment(otherScene, environment, inspected);
    TestValidator.equals(
      "non-texture native objects are not shared image bindings",
      read(inspected),
      true,
    );
    foreignMaterial.map = inspected;
    TestValidator.equals(
      "new native material sharing revokes ownership authority",
      read(inspected),
      false,
    );
    TestValidator.predicate(
      "changed scene sharing refuses before retirement",
      throwsError(
        (): void => applySceneEnvironment(otherScene, environment, inspected),
        "material",
      ),
    );
    foreignMaterial.map = null;
    TestValidator.equals(
      "removing the unowned binding recovers stable allocation",
      read(inspected),
      true,
    );
    const nullDictionary: Record<string, unknown> = Object.create(
      null,
    ) as Record<string, unknown>;
    const nullMaterialTexture: ThreeTypes.DataTexture = make();
    nullDictionary.image = nullMaterialTexture;
    foreignMaterial.userData = nullDictionary;
    TestValidator.predicate(
      "null-prototype material data preserves actual texture refs",
      throwsError(
        (): void =>
          applySceneEnvironment(
            inspectedScene,
            environment,
            nullMaterialTexture,
          ),
        "material",
      ),
    );
    buildLight({
      id: "area",
      type: "area",
      width: 1,
      height: 1,
      intensity: 1,
      castShadow: false,
      color: { r: 1, g: 1, b: 1, a: 1, hex: null },
      transform: {
        translation: { x: 0, y: 0, z: 1 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
    });
    for (const key of [
      "LTC_FLOAT_1",
      "LTC_FLOAT_2",
      "LTC_HALF_1",
      "LTC_HALF_2",
    ]) {
      const ltc: unknown = Reflect.get(THREE.UniformsLib, key);
      TestValidator.predicate(
        "actual rectangular lookup is initialized",
        ltc instanceof THREE.Texture,
      );
      const lookup: ThreeTypes.Texture<unknown, ThreeTypes.TextureEventMap> =
        ltc as ThreeTypes.Texture;
      const lookupVersion: number = lookup.version;
      TestValidator.predicate(
        "shared native lookup cannot be retired as a scene image",
        throwsError(
          (): void =>
            applySceneEnvironment(new THREE.Scene(), environment, lookup),
          "material",
        ),
      );
      TestValidator.equals(
        "native lookup refusal preserves its upload version",
        lookup.version,
        lookupVersion,
      );
    }
    const implicitMaterial: ThreeTypes.MeshPhysicalMaterial =
      new THREE.MeshPhysicalMaterial();
    applySubsurfaceShading(implicitMaterial, { r: 1, g: 0.5, b: 0.25 });
    const overlayTexture: ThreeTypes.DataTexture = make();
    applyMaterialOverlays(implicitMaterial, [
      {
        color: overlayTexture,
        normal: overlayTexture,
        roughness: null,
        normalScale: 1,
        strength: 1,
        blend: "multiply",
        colorFactor: { r: 1, g: 1, b: 1 },
      },
    ]);
    for (const resource of [
      implicitMaterial.userData.autoMovieSubsurfaceTexture,
      implicitMaterial.normalMap,
    ]) {
      TestValidator.predicate(
        "actual shader factory exposes its shared Texture",
        resource instanceof THREE.Texture,
      );
      const sharedTexture: ThreeTypes.Texture<
        unknown,
        ThreeTypes.TextureEventMap
      > = resource as ThreeTypes.Texture;
      const sharedVersion: number = sharedTexture.version;
      TestValidator.predicate(
        "scene cannot retire an actual shared shader lookup",
        throwsError(
          (): void =>
            applySceneEnvironment(
              new THREE.Scene(),
              environment,
              sharedTexture,
            ),
          "material",
        ),
      );
      TestValidator.equals(
        "shared lookup refusal preserves its native inputs",
        sharedTexture.version,
        sharedVersion,
      );
    }

    for (const mutate of [
      (value: ReturnType<typeof make>): void => {
        value.type = THREE.HalfFloatType;
      },
      (value: ReturnType<typeof make>): void => {
        value.format = THREE.RGFormat;
      },
      (value: ReturnType<typeof make>): void => {
        value.internalFormat = "RGBA16F";
      },
      (value: ReturnType<typeof make>): void => {
        value.image.width = 8;
      },
      (value: ReturnType<typeof make>): void => {
        value.image.height = 8;
      },
    ]) {
      const value: ThreeTypes.DataTexture = make();
      const owner: ThreeTypes.Scene<ThreeTypes.Object3DEventMap> =
        new THREE.Scene();
      applySceneEnvironment(owner, environment, value);
      mutate(value);
      TestValidator.equals(
        "changed immutable allocation loses authority",
        read(value),
        false,
      );
      const capacityVersion: number = value.version;
      let retired: number = 0;
      value.addEventListener("dispose", (): void => {
        retired++;
      });
      TestValidator.predicate(
        "immutable mutation requires replacement",
        throwsError(
          (): void => applySceneEnvironment(owner, environment, value),
          ["Texture", "Source"],
        ),
      );
      TestValidator.equals(
        "immutable refusal preserves native version and lifetime",
        [value.version, retired],
        [capacityVersion, 0],
      );
      TestValidator.predicate(
        "immutable refusal preserves its owning scene",
        owner.environment === value && owner.background === value,
      );
      TestValidator.predicate(
        "a clone of the invalid Source is insufficient",
        throwsError(
          (): void => applySceneEnvironment(owner, environment, value.clone()),
          "decoded Source",
        ),
      );
      const replacement: ThreeTypes.DataTexture = make();
      applySceneEnvironment(owner, environment, replacement);
      TestValidator.equals(
        "new Texture and Source recover ownership",
        read(replacement),
        true,
      );
      value.dispose();
      replacement.dispose();
    }
    const replacedSource: ThreeTypes.DataTexture = make();
    const replacementScene: ThreeTypes.Scene<ThreeTypes.Object3DEventMap> =
      new THREE.Scene();
    applySceneEnvironment(replacementScene, environment, replacedSource);
    const newData: ThreeTypes.DataTexture = make();
    replacedSource.source = newData.source;
    for (let attempt: number = 0; attempt < 2; ++attempt)
      TestValidator.predicate(
        "changing Source on the same wrapper requires replacement",
        throwsError(
          (): void =>
            applySceneEnvironment(
              replacementScene,
              environment,
              replacedSource,
            ),
          ["Texture", "Source"],
        ),
      );
    applySceneEnvironment(replacementScene, environment, newData);
    TestValidator.equals(
      "a genuinely new wrapper and Source remain usable",
      read(newData),
      true,
    );
    Object.assign(newData, { mipmaps: null });
    TestValidator.equals(
      "malformed manual state remains unknown",
      read(newData),
      false,
    );
    applySceneEnvironment(replacementScene, environment, newData);
    TestValidator.equals(
      "ownership cannot certify malformed native mip storage",
      read(newData),
      false,
    );
    newData.mipmaps = [];
    applySceneEnvironment(replacementScene, environment, newData);
    TestValidator.equals(
      "supported empty mip list recovers",
      read(newData),
      true,
    );
    const failed: ThreeTypes.DataTexture = make();
    const failedScene: ThreeTypes.Scene<ThreeTypes.Object3DEventMap> =
      new THREE.Scene();
    const failure: Error = new Error("owned-disposal-failure");
    const fail: () => never = (): never => {
      throw failure;
    };
    failed.addEventListener("dispose", fail);
    let caught: unknown;
    try {
      applySceneEnvironment(failedScene, environment, failed);
    } catch (error) {
      caught = error;
    }
    TestValidator.predicate(
      "initial retirement preserves its original failure",
      caught === failure,
    );
    TestValidator.equals(
      "failed retirement certifies no bytes or allocation",
      read(failed),
      false,
    );
    TestValidator.predicate(
      "failed claim has not changed the scene",
      failedScene.background === null && failedScene.environment === null,
    );
    const compiled: ReturnType<typeof compiledShotFixture> =
      compiledShotFixture({
        models: [],
        scene: { ...sceneFixture(), nodes: [], lights: [], environment },
      });
    const assess: () => ReturnType<
      typeof assessAutoMovieRenderBudget
    > = (): ReturnType<typeof assessAutoMovieRenderBudget> =>
      assessAutoMovieRenderBudget({
        compiled,
        shot: "owned-environment",
        budget: null,
        textures: [readAutoMovieTextureSource("sky", failed)],
        assets: [],
        renderer: {
          api: "webgl2",
          vendor: "typed-owner-unit",
          device: "no-gpu-unit",
        },
        settings: {
          width: 32,
          height: 32,
          pixelRatio: 1,
          shadows: false,
          shadowType: "none",
          toneMapping: "none",
          exposure: 1,
        },
      });
    const refusal: (assessment: ReturnType<typeof assess>) => string | null = (
      assessment: ReturnType<typeof assess>,
    ): string | null =>
      autoMovieRenderBudgetRefusal(
        autoMovieRenderBudgetEvidence({
          tier: "unit",
          budgets: undefined,
          assessments: [assessment],
        }),
      );
    const unknown: ReturnType<typeof assessAutoMovieRenderBudget> = assess();
    TestValidator.equals(
      "failed owner propagates null byte and count totals",
      [
        unknown.inventory!.totals.textureBytes,
        unknown.inventory!.totals.textures,
      ],
      [null, null],
    );
    TestValidator.predicate(
      "normal preflight names its unresolved scene and source",
      refusal(unknown)!.includes("owned-environment") &&
        refusal(unknown)!.includes("sky"),
    );
    failed.removeEventListener("dispose", fail);
    applySceneEnvironment(failedScene, environment, failed);
    TestValidator.equals(
      "successful retirement recovers the same immutable image",
      read(failed),
      true,
    );
    const beforeFirstDraw: ReturnType<typeof assessAutoMovieRenderBudget> =
      assess();
    TestValidator.equals(
      "normal preflight admits recovered metadata without drawing",
      refusal(beforeFirstDraw),
      null,
    );
    TestValidator.equals(
      "owned fresh factory keeps independent baseline bounds",
      [
        beforeFirstDraw.inventory!.totals.textureBytes,
        beforeFirstDraw.inventory!.totals.textures,
      ],
      [4 * 4 * 4 + 6 * 4 * 4 * (4 + 4), 2],
    );
    TestValidator.predicate(
      "actual ownership recovery changes sealed target",
      beforeFirstDraw.target!.textureDigest !== unknown.target!.textureDigest,
    );
    failed.addEventListener("dispose", fail);
    failed.generateMipmaps = true;
    caught = undefined;
    try {
      applySceneEnvironment(failedScene, environment, failed);
    } catch (error) {
      caught = error;
    }
    TestValidator.predicate(
      "refresh failure keeps the owning scene and raw cause",
      caught === failure && failedScene.background === failed,
    );
    TestValidator.equals("failed refresh stays unknown", read(failed), false);
    failed.removeEventListener("dispose", fail);
    applySceneEnvironment(failedScene, environment, failed);
    TestValidator.equals(
      "successful refresh restores authority",
      read(failed),
      true,
    );
    TestValidator.equals(
      "generated refresh retains exact source and cube levels",
      assess().inventory!.totals.textureBytes,
      (16 + 4 + 1) * 4 + 6 * ((16 + 4 + 1) * 4 + 16 * 4),
    );
    await cache.dispose();
    await cache.dispose();
    texture.dispose();
    materialTexture.dispose();
    failed.dispose();
    inspected.dispose();
    replacedSource.dispose();
    newData.dispose();
    nullMaterialTexture.dispose();
    overlayTexture.dispose();
    implicitMaterial.dispose();
    geometry.dispose();
    foreignMaterial.dispose();
    bound.dispose();
    ordinary.dispose();
  };
