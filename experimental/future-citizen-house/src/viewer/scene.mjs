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
      const material = uploadMaterial(entry, payload.textures); material.vertexColors = Boolean(part.mesh.colors);
      const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
      mesh.name = model.id + "/" + part.id; mesh.userData.placements = placements.map((p) => p.node);
      mesh.castShadow = material.transmission === 0; mesh.receiveShadow = true;
      if (material.map && material.transparent) {
        // Opaque portions of a thin laminate cast a patterned shadow. The clear
        // portion remains glass in beauty; the depth pass is an approximation.
        mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: material.map, alphaTest: 0.6 });
      }
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
        // These authored household luminaires emit downward. An isotropic point
        // leaking through a ceiling creates false rooftop specular highlights.
        const light = new THREE.SpotLight(0xffdbac, 12, 6, Math.PI / 2.5, 0.55, 2);
        light.position.copy(p.position); light.position.y -= 0.08;
        light.target.position.copy(light.position); light.target.position.y -= 1;
        light.userData.emitter = new THREE.Vector3().copy(p.position);
        root.add(light, light.target);
      }
    }
  }
  return root;
}
/** @param {Material} entry @param {Payload["textures"]} assets */
function uploadMaterial(entry, assets) {
  if (entry.normalTexture || entry.metallicRoughnessTexture || entry.occlusionTexture || entry.emissiveTexture)
    throw new Error(entry.id + ": texture resource binding has not been supplied to this viewer");
  let map = null;
  if (entry.baseColorTexture) {
    /** @type {import('@automovie/interface').IAutoMovieTextureReference} */
    const binding = typeof entry.baseColorTexture === "string" ? { asset: entry.baseColorTexture, texCoord: 0, colorSpace: "srgb" } : entry.baseColorTexture;
    if (binding.texCoord !== 0) throw new Error(entry.id + ": viewer only uploads the native primary UV set");
    const asset = assets.find(value => value.id === binding.asset);
    if (!asset) throw new Error(binding.asset + ": missing texture asset");
    map = new THREE.DataTexture(new Uint8Array(asset.rgba), asset.width, asset.height, THREE.RGBAFormat);
    map.colorSpace = binding.colorSpace === "linear" ? THREE.LinearSRGBColorSpace : THREE.SRGBColorSpace;
    const wrap = { clamp: THREE.ClampToEdgeWrapping, repeat: THREE.RepeatWrapping, mirror: THREE.MirroredRepeatWrapping };
    map.wrapS = wrap[binding.sampler?.wrapS ?? "clamp"]; map.wrapT = wrap[binding.sampler?.wrapT ?? "clamp"];
    const filters = { nearest: THREE.NearestFilter, linear: THREE.LinearFilter, nearestMipmapLinear: THREE.NearestMipmapLinearFilter, linearMipmapLinear: THREE.LinearMipmapLinearFilter };
    map.minFilter = filters[binding.sampler?.minFilter ?? "linearMipmapLinear"];
    map.magFilter = binding.sampler?.magFilter === "nearest" ? THREE.NearestFilter : THREE.LinearFilter;
    map.generateMipmaps = true; map.anisotropy = 8;
    if (binding.transform) {
      map.repeat.set(binding.transform.scale.x, binding.transform.scale.y);
      map.offset.set(binding.transform.offset.x, binding.transform.offset.y);
      map.rotation = THREE.MathUtils.degToRad(binding.transform.rotationDeg);
    }
    map.needsUpdate = true;
  }
  return new THREE.MeshPhysicalMaterial({
    name: entry.id,
    map,
    color: new THREE.Color(entry.baseColor.r, entry.baseColor.g, entry.baseColor.b),
    roughness: entry.roughness, metalness: entry.metallic,
    emissive: entry.emissive ? new THREE.Color(entry.emissive.r, entry.emissive.g, entry.emissive.b) : new THREE.Color(0, 0, 0),
    opacity: entry.opacity,
    transparent: entry.alphaMode === "blend" || (entry.alphaMode === undefined && entry.opacity < 1),
    depthWrite: entry.alphaMode !== "blend",
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
  const textures = new Set();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    if (object.customDepthMaterial) materials.add(object.customDepthMaterial);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) {
    if ("map" in material && material.map instanceof THREE.Texture) textures.add(material.map);
    material.dispose();
  }
  for (const texture of textures) texture.dispose();
}
