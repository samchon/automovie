// The production's review tooling keeps its part and prototype structure.
// Website views change visibility, pose and clipping at entry boundaries, so
// this adapter merges supported meshes in each entry's local coordinates.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { isMesh } from "./isMesh";

/**
 * One admitted material key and its entry-local copied geometry fragments.
 */
interface IBakeGroup {
  /** Borrowed source material whose clone supplies the merged shader. */
  material: THREE.Material;

  /** Temporary transformed fragments accumulated in traversal/instance order. */
  geometries: THREE.BufferGeometry[];
}

/** Material fields used by the current manor's tint-baking and merge equivalence key. */
type PaintedMaterial = THREE.Material & {
  /** Optional diffuse tint multiplied into generated vertex colors. */
  color?: THREE.Color;

  /** Borrowed albedo texture and sampler state retained by the cloned material. */
  map?: THREE.Texture | null;

  /** Optional emitted color included in the merge key. */
  emissive?: THREE.Color;

  /** Optional emission strength included in the merge key. */
  emissiveIntensity?: number;

  /** Optional surface roughness included in the merge key. */
  roughness?: number;

  /** Optional metal response included in the merge key. */
  metalness?: number;

  /** Enabled on the merged material to consume baked per-vertex diffuse tint. */
  vertexColors: boolean;
};

const WHITE: THREE.Color = new THREE.Color(0xffffff);

/**
 * Group the current manor projection by material type, referenced texture source and sampling, selected surface response, transparency and sidedness after diffuse tint moves into vertex colors. This key does not establish general shader equivalence for arbitrary custom materials or properties the manor producer does not use.
 */
const materialKey: (material: PaintedMaterial) => string = (
  material: PaintedMaterial,
): string => {
  const map: THREE.Texture<unknown, THREE.TextureEventMap> | null =
    material.map ?? null;
  return JSON.stringify([
    material.type,
    map === null
      ? null
      : [
          map.source.uuid,
          map.repeat.toArray(),
          map.offset.toArray(),
          map.rotation,
          map.wrapS,
          map.wrapT,
          map.colorSpace,
          map.minFilter,
          map.magFilter,
        ],
    material.transparent,
    material.opacity,
    material.side,
    material.depthWrite,
    material.alphaTest,
    material.roughness,
    material.metalness,
    material.emissive?.getHex(),
    material.emissiveIntensity,
  ]);
};

/** A copy of one part's geometry in entry space, tinted by a vertex color. */
const paintedGeometry: (
  source: THREE.BufferGeometry,
  matrix: THREE.Matrix4,
  color: THREE.Color,
) => THREE.BufferGeometry = (
  source: THREE.BufferGeometry,
  matrix: THREE.Matrix4,
  color: THREE.Color,
): THREE.BufferGeometry => {
  const geometry: THREE.BufferGeometry<
    THREE.NormalBufferAttributes,
    THREE.BufferGeometryEventMap
  > = new THREE.BufferGeometry();
  geometry.setAttribute("position", source.getAttribute("position").clone());
  if (source.hasAttribute("normal"))
    geometry.setAttribute("normal", source.getAttribute("normal").clone());
  if (source.hasAttribute("uv"))
    geometry.setAttribute("uv", source.getAttribute("uv").clone());
  if (source.index !== null) geometry.setIndex(source.index.clone());
  geometry.applyMatrix4(matrix);
  if (!geometry.hasAttribute("normal")) geometry.computeVertexNormals();
  const count: number = geometry.getAttribute("position").count;
  const colors: Float32Array<ArrayBuffer> = new Float32Array(count * 3);
  for (let index: number = 0; index < count; ++index)
    color.toArray(colors, index * 3);
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
};

/** Give every geometry of a group the same attribute set and index state. */
const unifyAttributes: (geometries: THREE.BufferGeometry[]) => void = (
  geometries: THREE.BufferGeometry[],
): void => {
  const textured: boolean = geometries.some(
    (
      geometry: THREE.BufferGeometry<
        THREE.NormalBufferAttributes,
        THREE.BufferGeometryEventMap
      >,
    ): boolean => geometry.hasAttribute("uv"),
  );
  const indexed: boolean = geometries.every(
    (
      geometry: THREE.BufferGeometry<
        THREE.NormalBufferAttributes,
        THREE.BufferGeometryEventMap
      >,
    ): boolean => geometry.index !== null,
  );
  for (const [position, geometry] of geometries.entries()) {
    if (textured && !geometry.hasAttribute("uv"))
      geometry.setAttribute(
        "uv",
        new THREE.BufferAttribute(
          new Float32Array(geometry.getAttribute("position").count * 2),
          2,
        ),
      );
    if (!indexed && geometry.index !== null)
      geometries[position] = geometry.toNonIndexed();
  }
};

/** Read Three's trusted instancing capability before expanding its live slots. */
const isInstanced: (object: THREE.Object3D) => object is THREE.InstancedMesh = (
  object: THREE.Object3D,
): object is THREE.InstancedMesh =>
  (object as THREE.InstancedMesh).isInstancedMesh === true;

/** Admit one shader; multi-material geometry remains in the original entry. */
const singleMaterial: (
  material: THREE.Material | THREE.Material[],
) => PaintedMaterial | null = (
  material: THREE.Material | THREE.Material[],
): PaintedMaterial | null =>
  Array.isArray(material)
    ? material.length === 1
      ? (material[0] as PaintedMaterial)
      : null
    : (material as PaintedMaterial);

/**
 * Merge the current manor entry's supported meshes into one mesh per material key, transforming geometry into entry-local coordinates and retaining diffuse tint in vertex colors. The key covers the current producer's selected material fields rather than every possible Three shader property.
 *
 * A mesh whose material cannot be expressed as one shader is left as it is; nothing here needs every part to merge, only most of them.
 *
 * Work and temporary geometry grow with admitted vertices and instance count. This operation creates copied and merged geometries and cloned materials, then detaches admitted original meshes; it does not dispose those originals or intermediate copies. Prototype/material sharing belongs to the source scene, so physical resource release needs a separately established owning boundary.
 *
 * @evidence contracts/common.md#principled-implementation Entry-inverse times mesh-world transforms express admitted vertices in entry coordinates, expanding instanced slot transforms and baking diffuse/instance tint into vertex colors before mergeGeometries; entry transforms must be invertible and mirrored winding is not independently corrected here.
 * @evidence contracts/common.md#clear-and-simple-design One entry owns its local merge groups, preserving entry-level pose/visibility boundaries; unsupported multi-material, skinned or morphing meshes remain in place instead of a second fallback mesh representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The material key is limited to the current manor producer's selected fields and does not prove arbitrary shader equivalence; original/intermediate resource release and rollback after detached meshes remain unresolved rather than hidden behind successful draw-count claims.
 * @evidence contracts/common.md#meaningful-documentation The comment states coordinate/tint preservation, admission exclusions, material-key limits and undisposed original/intermediate ownership.
 * @evidence contracts/performance.md#efficient-algorithms Traversal and copying scale with source nodes and expanded instance vertices/indices, plus group merge copies; normalization and merge traverse each group's admitted geometry because attribute/index layouts must agree.
 * @evidence contracts/performance.md#reuse-equivalent-work Texture sources and selected sampler/material fields form a per-entry merge key after diffuse tint moves to vertex colors; this equivalence is scoped to current producer fields and is rebuilt for each invocation without cross-entry caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Merged geometry and cloned materials transfer to the entry, but detached original geometry/materials and temporary copied or nonindexed fragments are not explicitly disposed; population and bytes grow with expanded source geometry without an imposed bound, and later scene traversal cannot discover detached originals.
 */
export const bakeEntry: (entry: THREE.Object3D) => void = (
  entry: THREE.Object3D,
): void => {
  entry.updateMatrixWorld(true);
  const toEntry: THREE.Matrix4 = entry.matrixWorld.clone().invert();
  const groups: Map<string, IBakeGroup> = new Map<string, IBakeGroup>();
  const consumed: THREE.Mesh[] = [];
  const instanceMatrix: THREE.Matrix4 = new THREE.Matrix4();
  const instanceColor: THREE.Color = new THREE.Color();
  const admit: (
    material: PaintedMaterial,
    geometry: THREE.BufferGeometry,
  ) => void = (
    material: PaintedMaterial,
    geometry: THREE.BufferGeometry,
  ): void => {
    const key: string = materialKey(material);
    let group: IBakeGroup | undefined = groups.get(key);
    if (group === undefined) {
      group = { material, geometries: [] };
      groups.set(key, group);
    }
    group.geometries.push(geometry);
  };
  entry.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    if (!isMesh(object) || object === entry) return;
    const material: PaintedMaterial | null = singleMaterial(object.material);
    if (material === null) return;
    const geometry: THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    > = object.geometry;
    if (
      geometry.morphAttributes.position !== undefined ||
      Object.keys(geometry.morphAttributes).length !== 0 ||
      (object as THREE.SkinnedMesh).isSkinnedMesh === true
    )
      return;
    const local: THREE.Matrix4 = toEntry.clone().multiply(object.matrixWorld);
    if (isInstanced(object)) {
      for (let slot: number = 0; slot < object.count; ++slot) {
        object.getMatrixAt(slot, instanceMatrix);
        if (object.instanceColor !== null)
          object.getColorAt(slot, instanceColor);
        else instanceColor.copy(WHITE);
        admit(
          material,
          paintedGeometry(
            geometry,
            local.clone().multiply(instanceMatrix),
            instanceColor.clone().multiply(material.color ?? WHITE),
          ),
        );
      }
    } else
      admit(
        material,
        paintedGeometry(geometry, local, material.color ?? WHITE),
      );
    consumed.push(object);
  });
  if (consumed.length === 0) return;
  for (const mesh of consumed) mesh.removeFromParent();
  for (const [key, group] of groups) {
    unifyAttributes(group.geometries);
    const merged: THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    > | null = mergeGeometries(group.geometries, false);
    if (merged === null)
      throw new Error(`Manor entry "${entry.name}" could not merge ${key}.`);
    const material: PaintedMaterial = group.material.clone() as PaintedMaterial;
    material.color?.copy(WHITE);
    material.vertexColors = true;
    const mesh: THREE.Mesh<
      THREE.BufferGeometry<
        THREE.NormalBufferAttributes,
        THREE.BufferGeometryEventMap
      >,
      PaintedMaterial,
      THREE.Object3DEventMap
    > = new THREE.Mesh(merged, material);
    mesh.name = `${entry.name}:baked`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    entry.add(mesh);
  }
};
