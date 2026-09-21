// @ts-check
import * as THREE from "three";
/** @typedef {ReturnType<typeof import('./payload.js').createViewerPayload>} Payload */
/** @typedef {import('@automovie/interface').IAutoMovieMaterial} Material */

/** Upload the producer's part buffers and declared material coefficients. @param {Payload} payload */
export function uploadHouse(payload) {
  const root = new THREE.Group();
  root.name = payload.environment.id;
  /** @type {Map<string, THREE.Group>} */
  const templates = new Map();
  for (const model of payload.models) {
    if (!payload.placements.some((placement) => placement.model === model.id)) continue;
    const group = new THREE.Group();
    const materials = new Map(model.materials.map((entry) => [entry.id, uploadMaterial(entry)]));
    for (const part of model.parts) {
      if (part.mesh.skin) throw new Error(model.id + "/" + part.id + ": static mesh required");
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(part.mesh.positions, 3));
      if (part.mesh.normals) geometry.setAttribute("normal", new THREE.Float32BufferAttribute(part.mesh.normals, 3));
      if (part.mesh.uvs) geometry.setAttribute("uv", new THREE.Float32BufferAttribute(part.mesh.uvs, 2));
      if (part.mesh.colors) geometry.setAttribute("color", new THREE.Float32BufferAttribute(part.mesh.colors, 3));
      if (part.mesh.indices) geometry.setIndex(part.mesh.indices);
      if (!part.mesh.normals) geometry.computeVertexNormals();
      const material = part.material === null ? undefined : materials.get(part.material);
      if (!material) throw new Error(model.id + "/" + part.id + ": missing material");
      const drawMaterial = material.clone();
      drawMaterial.vertexColors = Boolean(part.mesh.colors);
      const mesh = new THREE.Mesh(geometry, drawMaterial);
      mesh.name = part.id;
      mesh.castShadow = drawMaterial.transmission === 0;
      mesh.receiveShadow = true;
      if (part.transform) {
        mesh.position.copy(part.transform.translation);
        mesh.quaternion.copy(part.transform.rotation);
        mesh.scale.copy(part.transform.scale);
      }
      group.add(mesh);
    }
    templates.set(model.id, group);
    for (const material of materials.values()) material.dispose();
  }
  for (const placement of payload.placements) {
    const template = templates.get(placement.model);
    if (!template) throw new Error(placement.node + ": missing prototype");
    const instance = template.clone(true);
    instance.name = placement.node;
    instance.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      if (!(object.material instanceof THREE.MeshPhysicalMaterial)) throw new Error(placement.node + ": expected physical material");
      object.material = object.material.clone();
      if (placement.palette) object.material.color.setRGB(placement.palette.r, placement.palette.g, placement.palette.b);
    });
    instance.position.copy(placement.position);
    instance.quaternion.copy(placement.rotation);
    instance.scale.copy(placement.scale);
    root.add(instance);
  }
  for (const template of templates.values()) template.traverse((object) => {
    if (object instanceof THREE.Mesh && !Array.isArray(object.material)) object.material.dispose();
  });
  return root;
}

/** @param {Material} entry */
function uploadMaterial(entry) {
  if (entry.baseColorTexture || entry.normalTexture || entry.metallicRoughnessTexture || entry.occlusionTexture || entry.emissiveTexture)
    throw new Error(entry.id + ": texture resource binding has not been supplied to this viewer");
  return new THREE.MeshPhysicalMaterial({
    name: entry.id,
    color: new THREE.Color(entry.baseColor.r, entry.baseColor.g, entry.baseColor.b),
    roughness: entry.roughness, metalness: entry.metallic,
    emissive: entry.emissive ? new THREE.Color(entry.emissive.r, entry.emissive.g, entry.emissive.b) : new THREE.Color(0, 0, 0),
    opacity: entry.opacity,
    transparent: entry.alphaMode === "blend" || (entry.alphaMode === undefined && entry.opacity < 1),
    alphaTest: entry.alphaMode === "mask" ? (entry.alphaCutoff ?? 0.5) : 0,
    side: entry.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    transmission: entry.transmission ?? 0, ior: entry.ior ?? 1.5,
    thickness: entry.thickness ?? 0, clearcoat: entry.clearcoat ?? 0,
  });
}

/** @param {THREE.Object3D} root */
export function disposeHouse(root) {
  const geometries = new Set();
  const materials = new Set();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}
