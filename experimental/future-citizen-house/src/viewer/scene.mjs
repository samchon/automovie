// @ts-check
import * as THREE from "three";
/** @typedef {ReturnType<typeof import('./payload.js').createViewerPayload>} Payload */
/** @typedef {import('@automovie/interface').IAutoMovieMaterial} Material */
/** @typedef {Payload["models"][number]["parts"][number]["mesh"]} Mesh */
/** @typedef {{ mesh: Mesh; matrix: THREE.Matrix4; colour: THREE.Color | null; node: string }} Item */
/** Upload current engine buffers as static batches. Every part placement whose
 * native material record is identical is baked into one world-space geometry,
 * so draw calls follow the number of distinct finishes instead of the number of
 * models. Identities and transforms still come from the payload unchanged:
 * each batch keeps the exact placement ids it carries, instance palettes become
 * per-vertex colour ratios, and a mirrored transform flips its triangle winding.
 * @param {Payload} payload */
export function uploadHouse(payload) {
  const root = new THREE.Group(); root.name = payload.environment.id;
  const texture = textureCache(payload.textures);
  /** @type {Map<string, Payload["placements"]>} */
  const placementsByModel = new Map();
  for (const p of payload.placements) {
    const list = placementsByModel.get(p.model) ?? [];
    list.push(p); placementsByModel.set(p.model, list);
  }
  /** @type {Map<string, { entry: Material; items: Item[] }>} */
  const batches = new Map();
  for (const model of payload.models) {
    const placements = placementsByModel.get(model.id) ?? [];
    if (!placements.length) continue;
    for (const part of model.parts) {
      if (part.mesh.skin) throw new Error(model.id + ": static mesh required");
      const entry = model.materials.find((m) => m.id === part.material);
      if (!entry) throw new Error(model.id + ": missing material");
      const key = JSON.stringify(entry);
      const batch = batches.get(key) ?? { entry, items: [] };
      batches.set(key, batch);
      const local = new THREE.Matrix4();
      if (part.transform) local.compose(new THREE.Vector3().copy(part.transform.translation), new THREE.Quaternion().copy(part.transform.rotation), new THREE.Vector3().copy(part.transform.scale));
      for (const p of placements) {
        const matrix = new THREE.Matrix4().compose(new THREE.Vector3().copy(p.position), new THREE.Quaternion().copy(p.rotation), new THREE.Vector3().copy(p.scale)).multiply(local);
        // The engine palette is an absolute linear colour; divide by the base so
        // the material colour times the vertex ratio reproduces it exactly once.
        const colour = p.palette ? new THREE.Color(p.palette.r / Math.max(entry.baseColor.r, 1e-6), p.palette.g / Math.max(entry.baseColor.g, 1e-6), p.palette.b / Math.max(entry.baseColor.b, 1e-6)) : null;
        batch.items.push({ mesh: part.mesh, matrix, colour, node: p.node });
      }
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
  for (const { entry, items } of batches.values()) root.add(bake(entry, items, texture));
  return root;
}
/** @param {Material} entry @param {Item[]} items @param {ReturnType<typeof textureCache>} texture */
function bake(entry, items, texture) {
  const material = uploadMaterial(entry, texture);
  const withUv = items.filter((item) => item.mesh.uvs).length;
  if (material.map && withUv !== items.length) throw new Error(entry.id + ": a textured batch needs primary UVs on every part");
  const uv = withUv === items.length;
  const coloured = items.some((item) => item.colour || item.mesh.colors);
  let vertices = 0, indices = 0;
  for (const { mesh } of items) { vertices += mesh.positions.length / 3; indices += mesh.indices ? mesh.indices.length : mesh.positions.length / 3; }
  const positions = new Float32Array(vertices * 3), normals = new Float32Array(vertices * 3);
  const uvs = uv ? new Float32Array(vertices * 2) : null, colours = coloured ? new Float32Array(vertices * 3) : null;
  const index = vertices > 65535 ? new Uint32Array(indices) : new Uint16Array(indices);
  const point = new THREE.Vector3(), normal = new THREE.Vector3(), normalMatrix = new THREE.Matrix3();
  let v = 0, i = 0;
  for (const { mesh, matrix, colour } of items) {
    const count = mesh.positions.length / 3;
    normalMatrix.getNormalMatrix(matrix);
    const hasNormals = Boolean(mesh.normals);
    const r = colour?.r ?? 1, g = colour?.g ?? 1, b = colour?.b ?? 1;
    for (let k = 0; k < count; k++) {
      const o = (v + k) * 3;
      point.set(mesh.positions[k * 3], mesh.positions[k * 3 + 1], mesh.positions[k * 3 + 2]).applyMatrix4(matrix);
      positions[o] = point.x; positions[o + 1] = point.y; positions[o + 2] = point.z;
      if (hasNormals && mesh.normals) {
        normal.set(mesh.normals[k * 3], mesh.normals[k * 3 + 1], mesh.normals[k * 3 + 2]).applyMatrix3(normalMatrix).normalize();
        normals[o] = normal.x; normals[o + 1] = normal.y; normals[o + 2] = normal.z;
      }
      if (uvs && mesh.uvs) { uvs[(v + k) * 2] = mesh.uvs[k * 2]; uvs[(v + k) * 2 + 1] = mesh.uvs[k * 2 + 1]; }
      if (colours) {
        colours[o] = r * (mesh.colors ? mesh.colors[k * 3] : 1);
        colours[o + 1] = g * (mesh.colors ? mesh.colors[k * 3 + 1] : 1);
        colours[o + 2] = b * (mesh.colors ? mesh.colors[k * 3 + 2] : 1);
      }
    }
    const source = mesh.indices ?? Array.from({ length: count }, (_, k) => k);
    const mirrored = matrix.determinant() < 0;
    for (let t = 0; t < source.length; t += 3) {
      index[i + t] = v + source[t];
      index[i + t + 1] = v + source[mirrored ? t + 2 : t + 1];
      index[i + t + 2] = v + source[mirrored ? t + 1 : t + 2];
    }
    v += count; i += source.length;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  if (uvs) geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  if (colours) geometry.setAttribute("color", new THREE.BufferAttribute(colours, 3));
  geometry.setIndex(new THREE.BufferAttribute(index, 1));
  if (items.some((item) => !item.mesh.normals)) geometry.computeVertexNormals();
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  material.vertexColors = coloured;
  const object = new THREE.Mesh(geometry, material);
  object.name = entry.id + " ×" + items.length;
  object.userData.placements = [...new Set(items.map((item) => item.node))];
  object.castShadow = material.transmission === 0; object.receiveShadow = true;
  if (material.map && material.transparent) {
    // Opaque portions of a thin laminate cast a patterned shadow. The clear
    // portion remains glass in beauty; the depth pass is an approximation.
    object.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: material.map, alphaTest: 0.6 });
  }
  return object;
}
/** One GPU source per texture asset. Bindings that sample the same asset share
 * that source through their own sampler and transform, so a repeated finish is
 * uploaded once however many models or batches bind it.
 * @param {Payload["textures"]} assets */
function textureCache(assets) {
  /** @type {Map<string, THREE.DataTexture>} */
  const sources = new Map();
  /** @param {import('@automovie/interface').IAutoMovieTextureReference} binding */
  return (binding) => {
    let base = sources.get(binding.asset);
    if (!base) {
      const asset = assets.find((value) => value.id === binding.asset);
      if (!asset) throw new Error(binding.asset + ": missing texture asset");
      base = new THREE.DataTexture(new Uint8Array(asset.rgba), asset.width, asset.height, THREE.RGBAFormat);
      base.needsUpdate = true;
      sources.set(binding.asset, base);
    }
    const map = base.clone();
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
    return map;
  };
}
/** @param {Material} entry @param {ReturnType<typeof textureCache>} texture */
function uploadMaterial(entry, texture) {
  if (entry.normalTexture || entry.metallicRoughnessTexture || entry.occlusionTexture || entry.emissiveTexture)
    throw new Error(entry.id + ": texture resource binding has not been supplied to this viewer");
  let map = null;
  if (entry.baseColorTexture) {
    /** @type {import('@automovie/interface').IAutoMovieTextureReference} */
    const binding = typeof entry.baseColorTexture === "string" ? { asset: entry.baseColorTexture, texCoord: 0, colorSpace: "srgb" } : entry.baseColorTexture;
    if (binding.texCoord !== 0) throw new Error(entry.id + ": viewer only uploads the native primary UV set");
    map = texture(binding);
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
