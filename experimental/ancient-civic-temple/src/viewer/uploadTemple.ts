// @ts-check
/**
 * Upload the server's actual engine meshes and placements into a Three scene.
 * Unbound (null) parts use one neutral clay; bound parts use their model material.
 * Inspection owner colors hash surface IDs and do not represent materials.
 */
import * as THREE from "three";
import type { ViewerPayload } from "./ViewerPayload";

/** @typedef {import("./payload.js").ViewerPayload} Payload */

/** Neutral clay for unbound parts: a review display, not a material decision. */
const unboundClay = () => new THREE.MeshStandardMaterial({ name: "unbound-clay", color: 0xd6d0c4, roughness: 0.93, metalness: 0 });

/**
 * @param {Payload} payload
 * @param {Map<string, THREE.Texture>} textures
 * @returns {{ root: THREE.Group, meshes: THREE.Mesh[], ownerMaterials: Map<string, THREE.Material>, beautyMaterials: Map<THREE.Mesh, THREE.Material> }}
 */
export function uploadTemple(payload: ViewerPayload, textures: Map<string, THREE.Texture> = new Map()) {
  const root = new THREE.Group();
  root.name = payload.environmentId;
  const clay = unboundClay();
  /** @type {THREE.Mesh[]} */
  const meshes: THREE.Mesh[] = [];
  /** @type {Map<string, THREE.Material>} */
  const ownerMaterials = new Map<string, THREE.Material>();
  /** @type {Map<THREE.Mesh, THREE.Material>} */
  const beautyMaterials = new Map<THREE.Mesh, THREE.Material>();
  for (const placement of payload.placements) {
    const model = payload.models.find((m) => m.id === placement.model);
    if (model === undefined) throw new Error(`${placement.node}: missing model ${placement.model}`);
    const node = new THREE.Group();
    node.name = placement.node;
    node.position.set(placement.position.x, placement.position.y, placement.position.z);
    node.quaternion.set(placement.rotation.x, placement.rotation.y, placement.rotation.z, placement.rotation.w);
    node.scale.set(placement.scale.x, placement.scale.y, placement.scale.z);
    for (const part of model.parts) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(part.mesh.positions, 3));
      if (part.mesh.normals) geometry.setAttribute("normal", new THREE.Float32BufferAttribute(part.mesh.normals, 3));
      if (part.mesh.uvs) geometry.setAttribute("uv", new THREE.Float32BufferAttribute(part.mesh.uvs, 2));
      if (part.mesh.indices) geometry.setIndex(part.mesh.indices);
      if (!part.mesh.normals) geometry.computeVertexNormals();
      /** @type {THREE.Material} */
      let material: THREE.Material = clay;
      if (part.material !== null) {
        const bound = model.materials.find((m) => m.id === part.material);
        if (bound === undefined) throw new Error(`${model.id}/${part.id}: bound material ${part.material} not found.`);
        if (bound.baseColorTexture !== null && (
          !part.mesh.uvs || part.mesh.uvs.length !== part.mesh.positions.length / 3 * 2 ||
          part.mesh.uvs.some((value) => !Number.isFinite(value))
        )) throw new Error(`${model.id}/${part.id}: texture binding requires finite UV0.`);
        material = new THREE.MeshStandardMaterial({
          name: bound.id, color: new THREE.Color(bound.baseColor.r, bound.baseColor.g, bound.baseColor.b),
          roughness: bound.roughness, metalness: bound.metallic, opacity: bound.opacity,
          transparent: bound.opacity < 1, side: bound.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
          map: textures.get(bound.id) ?? null,
        });
      }
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `${model.id}/${part.id}`;
      mesh.userData.surface = part.id;
      mesh.userData.model = model.id;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (!ownerMaterials.has(part.id)) {
        ownerMaterials.set(part.id, new THREE.MeshStandardMaterial({ color: ownerColor(part.id), roughness: 0.8 }));
      }
      beautyMaterials.set(mesh, material);
      meshes.push(mesh);
      node.add(mesh);
    }
    root.add(node);
  }
  return { root, meshes, ownerMaterials, beautyMaterials };
}

/** Surface ID hash color for inspection only. @param {string} id */
function ownerColor(id: string) {
  let hash = 2166136261;
  for (let i = 0; i < id.length; ++i) hash = Math.imul(hash ^ id.charCodeAt(i), 16777619);
  return new THREE.Color().setHSL(((hash >>> 0) % 360) / 360, 0.55, 0.6);
}

