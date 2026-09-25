import * as THREE from "three";

import { balanceHumanPreviewRig } from "./previewExposure";

/**
 * Light a preview scene with the authored rig, exposed and white balanced as
 * a photograph on a grey card turned to the key (`balanceHumanPreviewRig`):
 * a warm key high on the left that casts the shadows, a cool fill on the
 * right, a rim behind, and a sky over ground. `scale` is the subject's half
 * extent over a head's 0.2 m; the lights' positions and the key's shadow
 * frustum grow with it so one rig serves a head and a whole body. Sets the
 * renderer's tone mapping exposure and returns the shadow-casting lights.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Keeps the inspected face readable under a photographically exposed, white-balanced light rig.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Exposes and white balances the preview on a key-lit grey card without changing the saved anatomical document.
 */
export function addHumanPreviewRig(props: {
  scene: THREE.Scene;
  renderer: { toneMappingExposure: number };
  scale: number;
}): THREE.DirectionalLight[] {
  const { scene, scale } = props;
  const linear = (hex: number): [number, number, number] => {
    const color = new THREE.Color(hex);
    return [color.r, color.g, color.b];
  };
  const key: [number, number, number] = [-0.3, 0.35, 0.45];
  const rig = balanceHumanPreviewRig(
    [
      {
        kind: "hemisphere",
        sky: linear(0xffeee2),
        ground: linear(0x526578),
        intensity: 0.5,
      },
      ...(
        [
          [key, 2.3, 0xffe9d8],
          [[0.35, 0.1, 0.3], 0.85, 0xdaeaff],
          [[0.1, 0.3, -0.25], 1.6, 0xffffff],
        ] as const
      ).map(([direction, intensity, hex]) => ({
        kind: "directional" as const,
        direction,
        color: linear(hex),
        intensity,
      })),
    ],
    key,
  );
  props.renderer.toneMappingExposure = rig.exposure;
  const shadowLights: THREE.DirectionalLight[] = [];
  for (const one of rig.lights) {
    if (one.kind === "hemisphere") {
      scene.add(
        new THREE.HemisphereLight(
          new THREE.Color(...one.sky),
          new THREE.Color(...one.ground),
          one.intensity,
        ),
      );
      continue;
    }
    const light = new THREE.DirectionalLight(
      new THREE.Color(...one.color),
      one.intensity,
    );
    const [x, y, z] = one.direction;
    light.position.set(x * scale, y * scale, z * scale);
    scene.add(light);
    if (one.direction !== key) continue;
    shadowLights.push(light);
    light.castShadow = true;
    light.shadow.mapSize.set(4096, 4096);
    Object.assign(light.shadow.camera, {
      left: -0.2 * scale,
      right: 0.2 * scale,
      top: 0.2 * scale,
      bottom: -0.2 * scale,
      near: 0.01,
      far: 2 * scale,
    });
    light.shadow.normalBias = 0.0008 * scale;
    light.shadow.bias = -0.00005;
    light.shadow.camera.updateProjectionMatrix();
  }
  return shadowLights;
}
