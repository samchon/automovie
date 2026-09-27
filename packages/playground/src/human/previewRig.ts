import * as THREE from "three";

import { balanceHumanPreviewRig } from "./previewExposure";
import { humanPreviewSoftbox } from "./previewSoftbox";

/**
 * The key softbox's point samples. Each casts a shadow, and a WebGL fragment
 * shader has sixteen texture units for those maps and the materials' own.
 */
const KEY_SAMPLES = 8;

/**
 * Light a preview scene with the authored rig, exposed and white balanced as
 * a photograph on a grey card turned to the key (`balanceHumanPreviewRig`):
 * a warm key high on the left that casts the shadows, a fill on the right,
 * a rim behind, and a sky over ground. The key is a softbox, not a point: a
 * 1 m source 1.5 m from the face, the size and distance of a studio
 * portrait key, sampled as `KEY_SAMPLES` lights of equal share over its
 * half angle of atan(0.5 / 1.5) (`humanPreviewSoftbox`), each casting its
 * own shadow, so a shadow's penumbra grows with its occluder's distance as
 * under the real source: the nose's shadow fades over a centimetre, a lid's
 * over a millimetre. A point key drew them all with the same hard edge, and
 * its single shadow map left the hair cards' stochastic transmittance
 * (`createHairCardShadowMaterial`) as a visible dot grid where the filter's
 * five taps could not average it. The fill is the key's light returned by a
 * white reflector, so it has the key's colour: a cool fill turned every
 * shadowed surface blue once the key-lit card was balanced neutral, the
 * teeth in the lips' shadow included. `scale` is the subject's half extent
 * over a head's 0.2 m; the lights' positions and the key's shadow frustum
 * grow with it so one rig serves a head and a whole body. Sets the
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
  const softbox = humanPreviewSoftbox(key, Math.atan(0.5 / 1.5), KEY_SAMPLES);
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
          ...softbox.map(
            (direction) => [direction, 2.3 / KEY_SAMPLES, 0xffe9d8] as const,
          ),
          [[0.35, 0.1, 0.3], 0.85, 0xffe9d8],
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
    if (!softbox.includes(one.direction as [number, number, number])) continue;
    shadowLights.push(light);
    light.castShadow = true;
    // 0.4 mm texels over a head; the filter smooths each sample's edge over
    // 0.8 mm, under the width of the face's creases.
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.radius = 2;
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
