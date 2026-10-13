// The production's review tooling keeps its part and prototype structure.
// Website views change visibility, pose and clipping at entry boundaries, so
// this adapter merges supported meshes in each entry's local coordinates.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { isMesh } from "./isMesh";

interface IBakeGroup {
  material: THREE.Material;
  geometries: THREE.BufferGeometry[];
}

type PaintedMaterial = THREE.Material & {
  color?: THREE.Color;
  map?: THREE.Texture | null;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  vertexColors: boolean;
};

const WHITE: THREE.Color = new THREE.Color(0xffffff);

/**
 * Two materials merge when a shader could not tell them apart once the diffuse tint moves into a vertex color: same texture bytes and sampling, same surface response, same transparency and sidedness.
 */
const materialKey: (material: PaintedMaterial) => string = (material: PaintedMaterial): string => {
  const map: THREE.Texture<unknown, THREE.TextureEventMap> | null = material.map ?? null;
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
const paintedGeometry: (source: THREE.BufferGeometry, matrix: THREE.Matrix4, color: THREE.Color) => THREE.BufferGeometry = (
  source: THREE.BufferGeometry,
  matrix: THREE.Matrix4,
  color: THREE.Color,
): THREE.BufferGeometry => {
  const geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap> = new THREE.BufferGeometry();
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
  for (let index: number = 0; index < count; ++index) color.toArray(colors, index * 3);
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
};

/** Give every geometry of a group the same attribute set and index state. */
const unifyAttributes: (geometries: THREE.BufferGeometry[]) => void = (geometries: THREE.BufferGeometry[]): void => {
  const textured: boolean = geometries.some((geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>) : boolean => geometry.hasAttribute("uv"));
  const indexed: boolean = geometries.every((geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>) : boolean => geometry.index !== null);
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

const isInstanced: (object: THREE.Object3D) => object is THREE.InstancedMesh = (object: THREE.Object3D): object is THREE.InstancedMesh =>
  (object as THREE.InstancedMesh).isInstancedMesh === true;

const singleMaterial: (material: THREE.Material | THREE.Material[]) => PaintedMaterial | null = (
  material: THREE.Material | THREE.Material[],
): PaintedMaterial | null =>
  Array.isArray(material)
    ? material.length === 1
      ? (material[0] as PaintedMaterial)
      : null
    : (material as PaintedMaterial);

/**
 * Merge one entry's meshes into one mesh per distinguishable material.
 *
 * A mesh whose material cannot be expressed as one shader is left as it is; nothing here needs every part to merge, only most of them.
 */
export const bakeEntry: (entry: THREE.Object3D) => void = (entry: THREE.Object3D): void => {
  entry.updateMatrixWorld(true);
  const toEntry: THREE.Matrix4 = entry.matrixWorld.clone().invert();
  const groups: Map<string, IBakeGroup> = new Map<string, IBakeGroup>();
  const consumed: THREE.Mesh[] = [];
  const instanceMatrix: THREE.Matrix4 = new THREE.Matrix4();
  const instanceColor: THREE.Color = new THREE.Color();
  const admit: (material: PaintedMaterial, geometry: THREE.BufferGeometry) => void = (
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
  entry.traverse((object: THREE.Object3D<THREE.Object3DEventMap>) : void => {
    if (!isMesh(object) || object === entry) return;
    const material: PaintedMaterial | null = singleMaterial(object.material);
    if (material === null) return;
    const geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap> = object.geometry;
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
    const merged: THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap> = mergeGeometries(group.geometries, false);
    if (merged === null)
      throw new Error(`Manor entry "${entry.name}" could not merge ${key}.`);
    const material: PaintedMaterial = group.material.clone() as PaintedMaterial;
    material.color?.copy(WHITE);
    material.vertexColors = true;
    const mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, PaintedMaterial, THREE.Object3DEventMap> = new THREE.Mesh(merged, material);
    mesh.name = `${entry.name}:baked`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    entry.add(mesh);
  }
};
