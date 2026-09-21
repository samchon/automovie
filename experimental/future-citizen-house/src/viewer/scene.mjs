// @ts-check
import * as THREE from "three";
/** @typedef {ReturnType<typeof import('./payload.js').createViewerPayload>} Payload */
/** @typedef {import('@automovie/interface').IAutoMovieMaterial} Material */
/** Upload current engine buffers. Instancing shares draw calls, never the source
 * identities or transforms: each mesh carries its exact placement-id array.
 * @param {Payload} payload */
export function uploadHouse(payload) {
  const root = new THREE.Group(); root.name = payload.environment.id;
  for (const model of payload.models) {
    const placements = payload.placements.filter((p) => p.model === model.id);
    if (!placements.length) continue;
    for (const part of model.parts) {
      if (part.mesh.skin) throw new Error(model.id + ": static mesh required");
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(part.mesh.positions, 3));
      if (part.mesh.normals) geometry.setAttribute("normal", new THREE.Float32BufferAttribute(part.mesh.normals, 3));
      if (part.mesh.uvs) geometry.setAttribute("uv", new THREE.Float32BufferAttribute(part.mesh.uvs, 2));
      if (part.mesh.colors) geometry.setAttribute("color", new THREE.Float32BufferAttribute(part.mesh.colors, 3));
      if (part.mesh.indices) geometry.setIndex(part.mesh.indices);
      if (!part.mesh.normals) geometry.computeVertexNormals();
      const entry = model.materials.find((m) => m.id === part.material);
      if (!entry) throw new Error(model.id + ": missing material");
      const material = uploadMaterial(entry); material.vertexColors = Boolean(part.mesh.colors);
      const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
      mesh.name = model.id + "/" + part.id; mesh.userData.placements = placements.map((p) => p.node);
      mesh.castShadow = material.transmission === 0; mesh.receiveShadow = true;
      const local = new THREE.Matrix4();
      if (part.transform) local.compose(new THREE.Vector3().copy(part.transform.translation), new THREE.Quaternion().copy(part.transform.rotation), new THREE.Vector3().copy(part.transform.scale));
      for (const [i, p] of placements.entries()) {
        const world = new THREE.Matrix4().compose(new THREE.Vector3().copy(p.position), new THREE.Quaternion().copy(p.rotation), new THREE.Vector3().copy(p.scale));
        mesh.setMatrixAt(i, world.multiply(local));
        // Instance colour multiplies the material; divide by its base to preserve
        // the engine palette's absolute linear colour rather than tint it twice.
        if (p.palette) mesh.setColorAt(i, new THREE.Color(p.palette.r / Math.max(entry.baseColor.r, 1e-6), p.palette.g / Math.max(entry.baseColor.g, 1e-6), p.palette.b / Math.max(entry.baseColor.b, 1e-6)));
        else mesh.setColorAt(i, new THREE.Color(1, 1, 1));
      }
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingBox(); mesh.computeBoundingSphere(); root.add(mesh);
      if (entry.emissive) for (const p of placements) {
        const light = new THREE.PointLight(0xffdbac, 12, 6, 2); light.position.copy(p.position); light.position.y -= 0.08; root.add(light);
      }
    }
  }
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
