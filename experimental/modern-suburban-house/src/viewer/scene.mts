/**
 * Native modern-house GPU projection shared by the production inspector and
 * public website. Inputs are the producer's resolved world meshes, finishes,
 * lights and caller-decoded images. No geometry or authored state is rebuilt.
 * The caller owns the renderer; this module sets its authored exposure and
 * returns an independently owned scene. Scene/material disposal stays with
 * the mounting host. Calibration retains the original simple light fallback.
 */
import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";

type IViewerScene = import("./scenePayload").IViewerScene;
type IViewerSceneItem = import("./scenePayload").IViewerSceneItem;

/**
 * Turn one engine mesh item into a lit, shadowed three.js mesh.
 *
 * @param  item
 * @param  textures
 */
export const buildMesh = (item: IViewerSceneItem, textures: Map<string, THREE.Texture>) => {
  const geometry = new THREE.BufferGeometry();
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
    const origin = new THREE.Vector3(...item.positions.slice(0, 3));
    const normal = new THREE.Vector3(...item.normals.slice(0, 3)).normalize();
    const rotation = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal,
    );
    const inverse = rotation.clone().invert();
    geometry
      .translate(-origin.x, -origin.y, -origin.z)
      .applyQuaternion(inverse);
    const mirror = new Reflector(geometry, {
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
  const map =
    item.texture === undefined ? undefined : textures.get(item.texture);
  const options = {
    color: map === undefined || item.textureTint ? item.color : 0xffffff,
    map: map ?? null,
    roughness: item.roughness ?? 0.8,
    metalness: item.metalness ?? 0,
    opacity: item.opacity ?? 1,
    transparent: item.opacity !== undefined && item.opacity < 1,
    depthWrite: item.opacity === undefined || item.opacity >= 1,
    side: item.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
  };
  const material =
    item.transmission !== undefined && item.transmission > 0
      ? new THREE.MeshPhysicalMaterial({
          ...options,
          transmission: item.transmission,
          ior: item.ior ?? 1.5,
          thickness: item.thickness ?? 0,
        })
      : new THREE.MeshStandardMaterial(options);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = item.id;
  mesh.position.set(...item.position);
  mesh.castShadow = item.castShadow;
  mesh.receiveShadow = item.receiveShadow;
  return mesh;
};

/**
 * Build lights and meshes for one scene payload.
 *
 * @param  payload
 * @param  textures
 * @param  renderer
 */
export const buildScene = (payload: IViewerScene, textures: Map<string, THREE.Texture>, renderer: { toneMappingExposure: number }) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd9dde2);
  const light = payload.lighting;
  if (payload.physicalLighting) {
    const physical = payload.physicalLighting;
    const background = physical.environment.background;
    scene.background = background
      ? new THREE.Color().setRGB(background.r, background.g, background.b)
      : null;
    for (const source of physical.lights) {
      const c = new THREE.Color().setRGB(
        source.color.r,
        source.color.g,
        source.color.b,
      );
      if (source.type !== "point" && source.type !== "directional")
        throw new Error(`unsupported house light ${source.id}`);
      const light =
        source.type === "point"
          ? new THREE.PointLight(c, source.intensity, source.range, 2)
          : new THREE.DirectionalLight(c, source.intensity);
      const p = source.transform.translation;
      if (light instanceof THREE.DirectionalLight) {
        const q = source.transform.rotation,
          d = new THREE.Vector3(0, 0, -1).applyQuaternion(
            new THREE.Quaternion(q.x, q.y, q.z, q.w),
          );
        light.target.position.set(3, 0, -5);
        light.position.copy(light.target.position).addScaledVector(d, -52);
        scene.add(light.target);
      } else light.position.set(p.x, p.y, p.z);
      light.castShadow = source.castShadow ?? false;
      if (source.shadow) {
        const s = source.shadow;
        light.shadow.mapSize.set(s.mapSize, s.mapSize);
        light.shadow.bias = s.bias;
        light.shadow.normalBias = s.normalBias;
        light.shadow.camera.near = s.near;
        light.shadow.camera.far = s.far;
        if (light instanceof THREE.DirectionalLight) {
          light.shadow.camera.left = -24;
          light.shadow.camera.right = 24;
          light.shadow.camera.bottom = -24;
          light.shadow.camera.top = 24;
        }
      }
      scene.add(light);
    }
    for (const item of payload.items) scene.add(buildMesh(item, textures));
    renderer.toneMappingExposure = physical.environment.exposure;
    return scene;
  }
  scene.add(
    new THREE.HemisphereLight(
      light.skyColor,
      light.groundColor,
      light.fillIntensity,
    ),
  );
  const key = new THREE.DirectionalLight(0xffffff, light.keyIntensity);
  key.position
    .set(...light.keyFrom)
    .normalize()
    .multiplyScalar(2 * (light.shadowHalfExtent ?? 8) + 4);
  if (light.keyTarget) {
    key.target.position.set(...light.keyTarget);
    key.position.add(key.target.position);
  }
  key.castShadow = true;
  // The shadow box must cover the subject: the calibration shape or the whole house and site.
  const reach = light.shadowHalfExtent ?? 8;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.camera.left = -reach;
  key.shadow.camera.right = reach;
  key.shadow.camera.top = reach;
  key.shadow.camera.bottom = -reach;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 4 * reach + 40;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  scene.add(key.target);
  for (const item of payload.items) scene.add(buildMesh(item, textures));
  renderer.toneMappingExposure = light.exposure;
  return scene;
};
