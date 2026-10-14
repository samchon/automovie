/**
 * Native modern-house GPU projection shared by the production inspector and public website. Inputs are the producer's resolved world meshes, finishes, lights and caller-decoded images. No geometry or authored state is rebuilt. The caller owns the renderer; this module sets its authored exposure and returns an independently owned scene. Scene/material disposal stays with the mounting host. Calibration retains the original simple light fallback.
 */
import * as THREE from "three";
import { buildMesh } from "./buildMesh";

type IViewerScene = import("./scenePayload").IViewerScene;

/**
 * Build lights and meshes for one scene payload.
 *
 * @param  payload
 * @param  textures
 * @param  renderer
 */
export const buildScene: (payload: IViewerScene, textures: Map<string, THREE.Texture>, renderer: { toneMappingExposure: number; }) => THREE.Scene<THREE.Object3DEventMap> = (payload: IViewerScene, textures: Map<string, THREE.Texture>, renderer: { toneMappingExposure: number }) : THREE.Scene<THREE.Object3DEventMap> => {
  const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
  scene.background = new THREE.Color(0xd9dde2);
  const light: import("./scenePayload").IViewerSceneLighting = payload.lighting;
  if (payload.physicalLighting) {
    const physical: { lights: import("@automovie/interface").IAutoMovieLight[]; environment: import("@automovie/interface").IAutoMovieSceneEnvironment; } = payload.physicalLighting;
    const background: import("@automovie/interface").IAutoMovieColor | null = physical.environment.background;
    scene.background = background
      ? new THREE.Color().setRGB(background.r, background.g, background.b)
      : null;
    for (const source of physical.lights) {
      const c: THREE.Color = new THREE.Color().setRGB(
        source.color.r,
        source.color.g,
        source.color.b,
      );
      if (source.type !== "point" && source.type !== "directional")
        throw new Error(`unsupported house light ${source.id}`);
      const light: THREE.DirectionalLight | THREE.PointLight =
        source.type === "point"
          ? new THREE.PointLight(c, source.intensity, source.range, 2)
          : new THREE.DirectionalLight(c, source.intensity);
      const p: import("@automovie/interface").IAutoMovieVector3 = source.transform.translation;
      if (light instanceof THREE.DirectionalLight) {
        const q: import("@automovie/interface").IAutoMovieQuaternion = source.transform.rotation,
          d: THREE.Vector3 = new THREE.Vector3(0, 0, -1).applyQuaternion(
            new THREE.Quaternion(q.x, q.y, q.z, q.w),
          );
        light.target.position.set(3, 0, -5);
        light.position.copy(light.target.position).addScaledVector(d, -52);
        scene.add(light.target);
      } else light.position.set(p.x, p.y, p.z);
      light.castShadow = source.castShadow ?? false;
      if (source.shadow) {
        const s: import("@automovie/interface").IAutoMovieLightShadow = source.shadow;
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
  const key: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, light.keyIntensity);
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
  const reach: number = light.shadowHalfExtent ?? 8;
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
