import * as THREE from "three";

import type { AutoMovieHumanSkeleton as Skeleton } from "../../../human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import type { HumanStickmanController } from "./HumanStickmanController";
import type { IHumanMannequinSnapshot } from "./IHumanMannequinSnapshot";

/** Observe the actual displayed Mannequin, without regenerating body, rig or hints.
 *
 * @evidence contracts/common.md#principled-implementation Reads existing Three buffers, evaluated world matrices, materials, marker metadata and WebGL facts from the page-owned scene; display visibility remains separate from invariant geometry and materials.
 * @evidence contracts/common.md#clear-and-simple-design One snapshot owner serves the interactive page and maintained HTTP capture with the same existing JSON representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No supplied palette label, guessed joint position, mesh count or reconstructed pose substitutes for actual displayed data; raster texture pixels are recorded only when the actual image exposes numeric data.
 * @evidence contracts/common.md#meaningful-documentation Buffers and placements use metres, material colors are Three's stored linear components, marker size uses material pixels, and unavailable image pixels remain null.
 * @evidence contracts/performance.md#efficient-algorithms One scene traversal copies actual geometry arrays and bounded material/marker fields; its cost scales with displayed buffer bytes, not body-law evaluation.
 * @evidence contracts/performance.md#reuse-equivalent-work One observed controller state and existing scene supply every snapshot domain; hashing and same-frame reuse belong to the capture owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned arrays and cloned authoring parameters, head-driver bones and rest neck descriptor belong to the caller; scratch traversal and material records are call-owned and no renderer, listener or retained snapshot cache is acquired.
 */
export function readHumanMannequinSnapshot(
  options: readHumanMannequinSnapshot.IOptions,
): IHumanMannequinSnapshot {
  const {
    scene,
    controller,
    camera,
    canvas,
    renderer,
    sun,
    rest,
  }: readHumanMannequinSnapshot.IOptions = options;
  const geometry: IHumanMannequinSnapshot["geometry"] = [];
  const markers: IHumanMannequinSnapshot["markers"] = [];
  const materials: IHumanMannequinSnapshot["materials"] = [];
  const materialIds: Map<THREE.Material, number> = new Map();
  const textures: IHumanMannequinSnapshot["textures"] = [];
  const textureIds: Map<THREE.Texture, number> = new Map();
  const textureIndex: (
    texture: THREE.Texture | null | undefined,
  ) => number | null = (
    texture: THREE.Texture | null | undefined,
  ): number | null => {
    if (texture === null || texture === undefined) return null;
    const known: number | undefined = textureIds.get(texture);
    if (known !== undefined) return known;
    const index: number = textures.length;
    textures.push(textureSnapshot(texture));
    textureIds.set(texture, index);
    return index;
  };
  const materialIndex: (material: THREE.Material) => number = (
    material: THREE.Material,
  ): number => {
    const known: number | undefined = materialIds.get(material);
    if (known !== undefined) return known;
    const index: number = materials.length;
    materials.push(materialSnapshot(material, textureIndex));
    materialIds.set(material, index);
    return index;
  };
  const parts: { name: string; vertices: number; triangles: number }[] = [];
  scene.updateMatrixWorld(true);
  scene.traverse((part: THREE.Object3D): void => {
    if (
      !(part instanceof THREE.Mesh) &&
      !(part instanceof THREE.Line) &&
      !(part instanceof THREE.Points)
    )
      return;
    const hierarchy: string[] = [];
    let effectiveVisible: boolean = true;
    for (
      let ancestor: THREE.Object3D | null = part;
      ancestor !== null;
      ancestor = ancestor.parent
    ) {
      hierarchy.unshift(ancestor.name || ancestor.type);
      effectiveVisible &&= ancestor.visible;
    }
    const position:
      | THREE.BufferAttribute
      | THREE.InterleavedBufferAttribute
      | undefined = part.geometry.getAttribute("position");
    const normal:
      | THREE.BufferAttribute
      | THREE.InterleavedBufferAttribute
      | undefined = part.geometry.getAttribute("normal");
    const materialSlots: number[] = ([] as THREE.Material[])
      .concat(part.material)
      .map(materialIndex);
    geometry.push({
      name: part.name,
      hierarchy,
      kind: part.type,
      renderOrder: part.renderOrder,
      visible: part.visible,
      effectiveVisible,
      matrixWorld: part.matrixWorld.toArray(),
      positions: position === undefined ? [] : Array.from(position.array),
      normals: normal === undefined ? [] : Array.from(normal.array),
      indices:
        part.geometry.index === null
          ? null
          : Array.from(part.geometry.index.array),
      materials: materialSlots,
    });
    if (part instanceof THREE.Mesh)
      parts.push({
        name: part.name,
        vertices: position?.count ?? 0,
        triangles: (part.geometry.index?.count ?? position?.count ?? 0) / 3,
      });
    if (
      part instanceof THREE.Points &&
      typeof part.userData.humanHintBone === "string"
    )
      markers.push({
        node: part.name,
        bone: part.userData.humanHintBone,
        detail: String(part.userData.humanHintDetail),
        matrixWorld: part.matrixWorld.toArray(),
        worldPosition: part.getWorldPosition(new THREE.Vector3()).toArray(),
        visible: part.visible,
        effectiveVisible,
        materials: materialSlots,
      });
  });
  const gl: WebGLRenderingContext | WebGL2RenderingContext =
    renderer.getContext();
  const debug: WEBGL_debug_renderer_info | null = gl.getExtension(
    "WEBGL_debug_renderer_info",
  );
  const state: HumanStickmanController.IState = controller.state;
  return {
    style: options.style,
    pass: options.pass,
    parameters: structuredClone(options.parameters),
    controller: state,
    completion: { ...options.completion },
    bodyPreparations: options.preparations,
    poseEvaluations: options.evaluations,
    evaluatorCalls: options.evaluations,
    geometry,
    markers,
    materials,
    textures,
    hint: { ...options.hint },
    root: {
      matrixWorld: controller.object.matrixWorld.toArray(),
      position: controller.object.position.toArray(),
      quaternion: controller.object.quaternion.toArray(),
      scale: controller.object.scale.toArray(),
    },
    headDrivers: structuredClone(
      rest.bones.filter((bone: Skeleton.IBone): boolean =>
        ["neck", "atlas", "head", "jaw"].includes(bone.bone),
      ),
    ),
    neckSurface: structuredClone(rest.neckSurface),
    rig: rest.bones.map(
      (bone: Skeleton.IBone): IHumanMannequinSnapshot["rig"][number] => {
        const node: THREE.Object3D | undefined =
          controller.object.getObjectByName(bone.bone);
        if (node === undefined)
          throw new Error("Missing controller bone: " + bone.bone);
        return {
          bone: bone.bone,
          parent: bone.parent,
          position: node.getWorldPosition(new THREE.Vector3()).toArray(),
          localPosition: node.position.toArray(),
        };
      },
    ),
    unsupported: state.unsupported,
    camera: {
      position: camera.position.toArray(),
      target: options.target.toArray(),
      up: camera.up.toArray(),
      fov: camera.fov,
      near: camera.near,
      far: camera.far,
    },
    light: {
      mode: "reference",
      position: sun.position.toArray(),
      target: sun.target.position.toArray(),
      intensity: sun.intensity,
    },
    body: "rigid-polygon-blockout",
    skinBinding: false,
    boneCount: rest.bones.length,
    parts,
    canvas: { width: canvas.width, height: canvas.height },
    renderer: {
      vendor: gl.getParameter(debug?.UNMASKED_VENDOR_WEBGL ?? gl.VENDOR),
      renderer: gl.getParameter(debug?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER),
    },
  };
}

/** Actual shader inputs used by this material; image data is available for generated DataTextures.
 * Colors stay in Three's stored linear working space; no display RGB is invented.
 */
function materialSnapshot(
  material: THREE.Material,
  textureIndex: (texture: THREE.Texture | null | undefined) => number | null,
): IHumanMannequinSnapshot.IMaterial {
  const value: THREE.Material & {
    color?: THREE.Color;
    size?: number;
    sizeAttenuation?: boolean;
    roughness?: number;
    map?: THREE.Texture | null;
    alphaMap?: THREE.Texture | null;
  } = material;
  return {
    type: material.type,
    color: value.color?.toArray() ?? null,
    opacity: material.opacity,
    transparent: material.transparent,
    depthTest: material.depthTest,
    depthWrite: material.depthWrite,
    side: material.side,
    size: value.size ?? null,
    sizeAttenuation: value.sizeAttenuation ?? null,
    roughness: value.roughness ?? null,
    map: textureIndex(value.map),
    alphaMap: textureIndex(value.alphaMap),
  };
}

/** Inspect one existing texture without image decoding, canvas allocation or model mutation. */
function textureSnapshot(
  texture: THREE.Texture,
): IHumanMannequinSnapshot.ITexture {
  const image: unknown = texture.image;
  const width: unknown = image !== null && typeof image === "object" ? Reflect.get(image, "width") : undefined;
  const height: unknown = image !== null && typeof image === "object" ? Reflect.get(image, "height") : undefined;
  const pixels: unknown = image !== null && typeof image === "object" ? Reflect.get(image, "data") : undefined;
  let data: number[] | null = null;
  if (pixels !== null && typeof pixels === "object") {
    const length: unknown = Reflect.get(pixels, "length");
    if (typeof length === "number" && Number.isSafeInteger(length) && length >= 0) {
      const copied: number[] = [];
      for (let index: number = 0; index < length; index++) {
        const value: unknown = Reflect.get(pixels, String(index));
        if (typeof value !== "number") break;
        copied.push(value);
      }
      if (copied.length === length) data = copied;
    }
  }
  return {
    width: typeof width === "number" ? width : null,
    height: typeof height === "number" ? height : null,
    colorSpace: texture.colorSpace,
    format: texture.format,
    minFilter: texture.minFilter,
    magFilter: texture.magFilter,
    data,
  };
}

/** Borrowed page state for one actual snapshot; no geometry ownership transfers. */
export namespace readHumanMannequinSnapshot {
  /** Existing page owners and actual UI selection; all placement comes from the scene. */
  export interface IOptions {
    /** The original mount's actual completed draw, observed by this page. */
    completion: IHumanMannequinSnapshot["completion"];
    scene: THREE.Scene;
    controller: HumanStickmanController;
    rest: Skeleton.IOutput;
    parameters: IAutoMovieHumanParameters;
    camera: THREE.PerspectiveCamera;
    target: THREE.Vector3;
    sun: THREE.DirectionalLight;
    canvas: HTMLCanvasElement;
    renderer: THREE.WebGLRenderer;
    style: string;
    pass: string;
    preparations: number;
    evaluations: number;
    hint: IHumanMannequinSnapshot["hint"];
  }
}
