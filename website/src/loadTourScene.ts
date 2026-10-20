/**
 * Native scene adapters for the three static transports. Each uploader receives the production's original payload; lighting also follows its native viewer. The website resolves texture URLs beneath its own relative mount path and waits for every required image before it declares the tour ready. This host does not own geometry, material authoring or household states.
 */
import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";

import { runWebsiteCleanup } from "./internal/runWebsiteCleanup";
import { type ModernPayload, modernScene } from "./modernScene";
import { textureUrl } from "./textureUrl";
import type { TourData } from "./tourData";

/**
 * The native temple material fields needed to decode its authored albedo binding.
 */
interface TempleMaterial {
  /** Native material identity used by uploadTemple's texture lookup. */
  id: string;

  /** No albedo, a direct image path, or an image with authored UV sampling. */
  baseColorTexture:
    | null
    | string
    | {
        /** First-party texture path under the production's textures directory. */
        asset: string;

        /** Optional UV affine settings, with angle in degrees. */
        transform?: {
          /** UV translation applied before native material sampling. */
          offset: { x: number; y: number };

          /** UV repetition factors on each image axis. */
          scale: { x: number; y: number };

          /** UV rotation in degrees, converted once to radians. */
          rotationDeg: number;
        };
      };
}

/**
 * Load the selected production's textures and native scene. Disposal retires its callback authority, discovers owned resources before invoking cleanup, and attempts each discovered geometry, material, texture and supplemental cleanup once. A saved failure is reported without retrying; rollback preserves the loading cause alongside cleanup failures. Discovery covers mesh geometry/materials, material.map, custom depth materials, reflector targets, lights and explicitly acquired textures, not every possible custom shader resource. A native uploader that throws before returning its constructed root owns any resources unreachable from this adapter. Native GPU release remains unverified by callback return.
 *
 * @evidence contracts/common.md#principled-implementation The building discriminator selects its actual native uploader and lighting, while decoded albedo bindings keep authored sampler transforms; scene traversal and identity sets collect the known Three resources before independent disposal attempts.
 * @evidence contracts/common.md#clear-and-simple-design This owner adapts first-party transport and texture URLs without rebuilding geometry; native source uploaders own mesh construction, and runWebsiteCleanup owns ordered failure-preserving cleanup coordination.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supported production-specific adapters and lighting are explicit route differences, not fixture substitutions; missing modern physical lighting refuses loading, and cleanup errors remain observable rather than retried or represented as GPU proof.
 * @evidence contracts/common.md#meaningful-documentation The comment explains native payload ownership, texture readiness, known resource discovery, sticky cleanup failure and unreachable partial-uploader resource limits.
 * @evidence contracts/performance.md#efficient-algorithms Loading scans source materials/items and serially awaits each required decode; modern image paths are deduplicated by exact string while temple textures retain material-specific sampling, and teardown scans O(N + M + T) known scene objects, materials and textures with identity sets.
 * @evidence contracts/performance.md#reuse-equivalent-work One modern texture is shared per exact native path within a scene; temple material bindings remain separate because transforms may differ, and resources discovered under multiple objects are deduplicated by object identity before release.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A load retains decoded textures and native scene resources until disposal or rollback; population/bytes and pending decode duration have no imposed cap, no cancellation is exposed, and the adapter can release only acquired or returned resources reachable through its known fields.
 */
export const loadTourScene: (
  data: TourData,
  renderer: {
    shadowMap: { type: THREE.ShadowMapType };
    toneMappingExposure: number;
    capabilities: { getMaxAnisotropy(): number };
  },
  base: string,
  dependencies: {
    load(url: string): Promise<THREE.Texture>;
    createTempleDaylight(): {
      sky: THREE.DataTexture;
      hemisphere: THREE.HemisphereLight;
      sun: THREE.DirectionalLight;
    };
    uploadTemple(
      payload: unknown,
      textures: Map<string, THREE.Texture>,
    ): { root: THREE.Group };
    daylight(): {
      sky: THREE.DataTexture;
      environment: THREE.WebGLRenderTarget;
      dispose(): void;
    };
    uploadHouse(payload: unknown): THREE.Group;
  },
) => Promise<{ scene: THREE.Scene; dispose(): void }> = async (
  data: TourData,
  renderer: {
    shadowMap: { type: THREE.ShadowMapType };
    toneMappingExposure: number;
    capabilities: { getMaxAnisotropy(): number };
  },
  base: string,
  dependencies: {
    load(url: string): Promise<THREE.Texture>;
    createTempleDaylight(): {
      sky: THREE.DataTexture;
      hemisphere: THREE.HemisphereLight;
      sun: THREE.DirectionalLight;
    };
    uploadTemple(
      payload: unknown,
      textures: Map<string, THREE.Texture>,
    ): { root: THREE.Group };
    daylight(): {
      sky: THREE.DataTexture;
      environment: THREE.WebGLRenderTarget;
      dispose(): void;
    };
    uploadHouse(payload: unknown): THREE.Group;
  },
): Promise<{ scene: THREE.Scene; dispose(): void }> => {
  const {
    load,
    createTempleDaylight,
    uploadTemple,
    daylight,
    uploadHouse,
  }: {
    load(url: string): Promise<THREE.Texture>;
    createTempleDaylight(): {
      sky: THREE.DataTexture;
      hemisphere: THREE.HemisphereLight;
      sun: THREE.DirectionalLight;
    };
    uploadTemple(
      payload: unknown,
      textures: Map<string, THREE.Texture>,
    ): { root: THREE.Group };
    daylight(): {
      sky: THREE.DataTexture;
      environment: THREE.WebGLRenderTarget;
      dispose(): void;
    };
    uploadHouse(payload: unknown): THREE.Group;
  } = dependencies;
  const textures: Map<
    string,
    THREE.Texture<unknown, THREE.TextureEventMap>
  > = new Map<string, THREE.Texture>();
  const additional: (() => void)[] = [];
  let scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
  let disposed: boolean = false;
  const disposalFailure: unknown[] = [];
  const dispose: () => void = (): void => {
    if (disposed) {
      if (disposalFailure.length !== 0) throw disposalFailure[0];
      return;
    }
    disposed = true;
    try {
      const geometries: Set<
        THREE.BufferGeometry<
          THREE.NormalBufferAttributes,
          THREE.BufferGeometryEventMap
        >
      > = new Set<THREE.BufferGeometry>();
      const materials: Set<THREE.Material<THREE.MaterialEventMap>> =
        new Set<THREE.Material>();
      const objectCleanup: (() => void)[] = [];
      scene.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
        if (object instanceof THREE.Mesh) {
          if (object instanceof Reflector) {
            const target: THREE.WebGLRenderTarget = object.getRenderTarget();
            objectCleanup.push((): void => target.dispose());
          }
          geometries.add(object.geometry);
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material])
            materials.add(material);
          if (object.customDepthMaterial)
            materials.add(object.customDepthMaterial);
        }
        if (object instanceof THREE.Light)
          objectCleanup.push((): void => object.dispose());
      });
      for (const material of materials) {
        const map: THREE.Texture<unknown, THREE.TextureEventMap> | null = (
          material as THREE.MeshStandardMaterial
        ).map;
        if (map) textures.set(map.uuid, map);
      }
      const ownedTextures: Set<THREE.Texture> = new Set(textures.values());
      textures.clear();
      runWebsiteCleanup([
        ...objectCleanup,
        ...Array.from(
          geometries,
          (geometry: THREE.BufferGeometry): (() => void) =>
            (): void =>
              geometry.dispose(),
        ),
        ...Array.from(
          materials,
          (material: THREE.Material): (() => void) =>
            (): void =>
              material.dispose(),
        ),
        ...Array.from(
          ownedTextures,
          (texture: THREE.Texture): (() => void) =>
            (): void =>
              texture.dispose(),
        ),
        ...additional.splice(0),
      ]);
    } catch (error) {
      disposalFailure.push(error);
      throw error;
    }
  };
  try {
    if (data.building === "ancient") {
      const native: {
        models: { materials: TempleMaterial[] }[];
      } = data.native as {
        models: { materials: TempleMaterial[] }[];
      };
      const materials: Map<string, TempleMaterial> = new Map(
        native.models.flatMap(
          (model: {
            materials: TempleMaterial[];
          }): (readonly [string, TempleMaterial])[] =>
            model.materials.map(
              (material: TempleMaterial): readonly [string, TempleMaterial] =>
                [material.id, material] as const,
            ),
        ),
      );
      for (const material of materials.values()) {
        const binding:
          | string
          | {
              asset: string;
              transform?: {
                offset: { x: number; y: number };
                scale: { x: number; y: number };
                rotationDeg: number;
              };
            }
          | null = material.baseColorTexture;
        if (binding === null) continue;
        const texture: THREE.Texture<unknown, THREE.TextureEventMap> =
          await load(
            textureUrl(
              typeof binding === "string" ? binding : binding.asset,
              base,
            ),
          );
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        if (typeof binding !== "string" && binding.transform) {
          texture.offset.set(
            binding.transform.offset.x,
            binding.transform.offset.y,
          );
          texture.repeat.set(
            binding.transform.scale.x,
            binding.transform.scale.y,
          );
          texture.rotation = THREE.MathUtils.degToRad(
            binding.transform.rotationDeg,
          );
        }
        textures.set(material.id, texture);
      }
      scene = new THREE.Scene();
      const lighting: {
        sky: THREE.DataTexture;
        hemisphere: THREE.HemisphereLight;
        sun: THREE.DirectionalLight;
      } = createTempleDaylight();
      additional.push((): void => lighting.sky.dispose());
      scene.background = lighting.sky;
      scene.environment = lighting.sky;
      scene.environmentIntensity = 0.25;
      scene.add(
        lighting.hemisphere,
        lighting.sun,
        lighting.sun.target,
        uploadTemple(data.native, textures).root,
      );
      renderer.shadowMap.type = THREE.PCFShadowMap;
    } else if (data.building === "future") {
      scene = new THREE.Scene();
      const lighting: {
        sky: THREE.DataTexture;
        environment: THREE.WebGLRenderTarget;
        dispose(): void;
      } = daylight();
      additional.push(lighting.dispose);
      scene.background = lighting.sky;
      scene.environment = lighting.environment.texture;
      scene.environmentIntensity = 0.8;
      const sky: THREE.HemisphereLight = new THREE.HemisphereLight(
        0xe8f1ff,
        0x887b65,
        1.25,
      );
      const sun: THREE.DirectionalLight = new THREE.DirectionalLight(
        0xffefdb,
        3,
      );
      sun.position.set(-12, 18, -8);
      sun.castShadow = true;
      sun.shadow.mapSize.set(4096, 4096);
      Object.assign(sun.shadow.camera, {
        left: -18,
        right: 18,
        top: 18,
        bottom: -18,
        far: 70,
      });
      sun.shadow.normalBias = 0.003;
      sun.shadow.bias = -0.00005;
      scene.add(sky, sun, sun.target, uploadHouse(data.native));
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } else {
      const native: ModernPayload = data.native as ModernPayload;
      for (const url of new Set(
        native.items.flatMap(
          (
            item: import("../../experimental/modern-suburban-house/src/viewer/scenePayload").IViewerSceneItem,
          ): string[] => (item.texture === undefined ? [] : [item.texture]),
        ),
      )) {
        const texture: THREE.Texture<unknown, THREE.TextureEventMap> =
          await load(textureUrl(url, base));
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = Math.min(
          8,
          renderer.capabilities.getMaxAnisotropy(),
        );
        textures.set(url, texture);
      }
      scene = modernScene(native, textures);
      renderer.toneMappingExposure =
        native.physicalLighting!.environment.exposure;
      renderer.shadowMap.type = THREE.PCFShadowMap;
    }
    return { scene, dispose };
  } catch (error) {
    runWebsiteCleanup([dispose], [error]);
    throw error;
  }
};
