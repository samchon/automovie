/**
 * Native modern-house GPU projection shared by the production inspector and public website. Inputs are the producer's resolved world meshes, finishes, lights and caller-decoded images. No geometry or authored state is rebuilt. The caller owns the renderer; this module sets its authored exposure and returns an independently owned scene. Scene/material disposal stays with the mounting host. Calibration retains the original simple light fallback.
 */
import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";

type IViewerSceneItem = import("./scenePayload").IViewerSceneItem;

/**
 * Turn one engine mesh item into a lit, shadowed three.js mesh.
 *
 * @param  item
 * @param  textures
 */
export const buildMesh: (item: IViewerSceneItem, textures: Map<string, THREE.Texture>) => Reflector | THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.MeshStandardMaterial, THREE.Object3DEventMap> = (item: IViewerSceneItem, textures: Map<string, THREE.Texture>) : Reflector | THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.MeshStandardMaterial, THREE.Object3DEventMap> => {
  const geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap> = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(item.positions, 3),
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(item.normals, 3),
  );
  geometry.setIndex(item.indices);
  if (item.uvs !== undefined)
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(item.uvs, 2));
  if (
    item.faceId === "mirror" &&
    !item.inspectionFace &&
    !item.inspectionSection
  ) {
    // Reflector's local plane is +Z through its origin. Rebase the actual
    // engine vertices onto the first front-face plane without changing a
    // single world vertex; the closed silver plate keeps its original depth.
    const origin: THREE.Vector3 = new THREE.Vector3(...item.positions.slice(0, 3));
    const normal: THREE.Vector3 = new THREE.Vector3(...item.normals.slice(0, 3)).normalize();
    const rotation: THREE.Quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal,
    );
    const inverse: THREE.Quaternion = rotation.clone().invert();
    geometry
      .translate(-origin.x, -origin.y, -origin.z)
      .applyQuaternion(inverse);
    const mirror: Reflector = new Reflector(geometry, {
      textureWidth: 512,
      textureHeight: 512,
      color: item.color,
      clipBias: 0.0001,
    });
    mirror.name = item.id;
    mirror.position.copy(origin).add(new THREE.Vector3(...item.position));
    mirror.quaternion.copy(rotation);
    mirror.castShadow = item.castShadow;
    mirror.receiveShadow = item.receiveShadow;
    return mirror;
  }
  const map: THREE.Texture<unknown, THREE.TextureEventMap> | undefined =
    item.texture === undefined ? undefined : textures.get(item.texture);
  const options: { color: number; map: THREE.Texture<unknown, THREE.TextureEventMap> | null; roughness: number; metalness: number; opacity: number; transparent: boolean; depthWrite: boolean; side: 0 | 2; } = {
    color: map === undefined || item.textureTint ? item.color : 0xffffff,
    map: map ?? null,
    roughness: item.roughness ?? 0.8,
    metalness: item.metalness ?? 0,
    opacity: item.opacity ?? 1,
    transparent: item.opacity !== undefined && item.opacity < 1,
    depthWrite: item.opacity === undefined || item.opacity >= 1,
    side: item.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
  };
  const material: THREE.MeshStandardMaterial =
    item.transmission !== undefined && item.transmission > 0
      ? new THREE.MeshPhysicalMaterial({
          ...options,
          transmission: item.transmission,
          ior: item.ior ?? 1.5,
          thickness: item.thickness ?? 0,
        })
      : new THREE.MeshStandardMaterial(options);
  const mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.MeshStandardMaterial, THREE.Object3DEventMap> = new THREE.Mesh(geometry, material);
  mesh.name = item.id;
  mesh.position.set(...item.position);
  mesh.castShadow = item.castShadow;
  mesh.receiveShadow = item.receiveShadow;
  return mesh;
};
