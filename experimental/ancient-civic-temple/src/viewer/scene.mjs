// @ts-check
/**
 * 서버가 보낸 실제 engine mesh와 배치를 three 장면으로 올린다. 건물을
 * 다시 만들지 않고, 재료가 결속되지 않은(null) part는 하나의 중성 클레이로,
 * 결속된 part는 model 재료 그대로 그린다. 검사 모드의 표면 소유 색은
 * 표면 ID의 해시이며 재료가 아니다.
 */
import * as THREE from "three";

/** @typedef {import("./payload.js").ViewerPayload} Payload */

/** 재료 미결속 part 표시용 중성 클레이(검토 표시이며 materials 결정이 아님). */
const unboundClay = () => new THREE.MeshStandardMaterial({ name: "unbound-clay", color: 0xd6d0c4, roughness: 0.93, metalness: 0 });

/**
 * @param {Payload} payload
 * @returns {{ root: THREE.Group, meshes: THREE.Mesh[], ownerMaterials: Map<string, THREE.Material>, beautyMaterials: Map<THREE.Mesh, THREE.Material> }}
 */
export function uploadTemple(payload) {
  const root = new THREE.Group();
  root.name = payload.environmentId;
  const clay = unboundClay();
  /** @type {THREE.Mesh[]} */
  const meshes = [];
  /** @type {Map<string, THREE.Material>} */
  const ownerMaterials = new Map();
  /** @type {Map<THREE.Mesh, THREE.Material>} */
  const beautyMaterials = new Map();
  for (const placement of payload.placements) {
    const model = payload.models.find((m) => m.id === placement.model);
    if (model === undefined) throw new Error(`${placement.node}: model ${placement.model} 누락`);
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
      let material = clay;
      if (part.material !== null) {
        const bound = model.materials.find((m) => m.id === part.material);
        if (bound === undefined) throw new Error(`${model.id}/${part.id}: 결속 재료 ${part.material}를 찾지 못했습니다.`);
        material = new THREE.MeshStandardMaterial({
          name: bound.id, color: new THREE.Color(bound.baseColor.r, bound.baseColor.g, bound.baseColor.b),
          roughness: bound.roughness, metalness: bound.metallic, opacity: bound.opacity,
          transparent: bound.opacity < 1, side: bound.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
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

/** 표면 ID 해시 색(검사 전용). @param {string} id */
export function ownerColor(id) {
  let hash = 2166136261;
  for (let i = 0; i < id.length; ++i) hash = Math.imul(hash ^ id.charCodeAt(i), 16777619);
  return new THREE.Color().setHSL(((hash >>> 0) % 360) / 360, 0.55, 0.6);
}

/** support 선언(검사 전용) 반투명 면. @param {Payload} payload */
export function uploadSupports(payload) {
  const group = new THREE.Group();
  group.name = "supports";
  for (const support of payload.supports) {
    const shape = new THREE.Shape(support.polygon.map((p) => new THREE.Vector2(p.x, -p.z)));
    for (const hole of support.holes) shape.holes.push(new THREE.Path(hole.map((p) => new THREE.Vector2(p.x, -p.z))));
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    const position = geometry.getAttribute("position");
    for (let i = 0; i < position.count; ++i) {
      const { origin, slopeX, slopeZ } = support.plane;
      position.setY(i, origin + slopeX * position.getX(i) + slopeZ * position.getZ(i) + 0.01);
    }
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: 0x2f8f5b, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide,
    }));
    mesh.name = support.id;
    group.add(mesh);
  }
  return group;
}

/** @param {THREE.Object3D} root */
export function disposeTree(root) {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
    }
  });
}
