import * as THREE from "three";

import type { HumanPreviewLight } from "./HumanPreviewLight.js";
import { balanceHumanPreviewRig } from "./balanceHumanPreviewRig.js";
import { humanPreviewSoftbox } from "./humanPreviewSoftbox.js";

/**
 * The key softbox's authored point-sample count. Each sample casts one shadow;
 * the actual device and material population determine texture-unit availability.
 */
const KEY_SAMPLES: number = 8;

/**
 * Create the authored display studio and its calibrated exposure.
 * Eight directional key samples approximate a round source with angular radius
 * atan(0.5/1.5); fill, rim and hemisphere values are authored conventions.
 * The caller supplies positive finite scale, owns scene membership and retires
 * returned shadow lights. This function alone proves no photographic match.
 *
 * @evidence contracts/common.md#principled-implementation Samples the authored key cap, divides its power among eight directions, balances the numerical card, then allocates native lights and scaled shadow frusta. Finite positive scale and admitted fixed rig values are premises; the cap is an approximation rather than measured anatomical illumination.
 * @evidence contracts/common.md#clear-and-simple-design One studio constructor owns scene light creation and exposure assignment, while numerical cap sampling and grey-card calibration have their own owners. Returned key lights expose shadow resources to the stage that later closes them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed studio colors, powers, key sample count and shadow biases are declared display conventions, not fixture-derived corrections. Penumbra smoothness and material appearance require current beauty observation and are not inferred from these values.
 * @evidence contracts/common.md#meaningful-documentation The comment states angular source approximation, scale premise, caller scene/shadow ownership and absence of photographic proof; native clip/map values remain implementation policy.
 * @evidence contracts/performance.md#efficient-algorithms Allocates one hemisphere, eight key samples and two other directional lights, a fixed population. Eight potential 1024-square shadow maps add their actual native raster cost; each shadow view requires scene work beyond constructing the light records.
 * @evidence contracts/performance.md#reuse-equivalent-work One balanced rig supplies all native lights, and softbox tuple identity identifies the eight returned casters. The host constructs the studio once per viewport rather than caching independently mutable native lights across scenes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Scene owns all allocated lights; the returned caster list lets the viewport dispose each allocated shadow map at close. This helper provides no scene-detach or partial-construction rollback API and borrows the renderer only to set exposure.
 */
export function addHumanPreviewRig(props: {
  scene: THREE.Scene;
  renderer: { toneMappingExposure: number };
  scale: number;
}): THREE.DirectionalLight[] {
  const {
    scene,
    scale,
  }: {
    scene: THREE.Scene;
    renderer: { toneMappingExposure: number };
    scale: number;
  } = props;
  const linear: (hex: number) => [number, number, number] = (
    hex: number,
  ): [number, number, number] => {
    const color: THREE.Color = new THREE.Color(hex);
    return [color.r, color.g, color.b];
  };
  const key: [number, number, number] = [-0.3, 0.35, 0.45];
  const softbox: [number, number, number][] = humanPreviewSoftbox(
    key,
    Math.atan(0.5 / 1.5),
    KEY_SAMPLES,
  );
  const rig: {
    lights: HumanPreviewLight[];
    gain: [number, number, number];
    exposure: number;
  } = balanceHumanPreviewRig(
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
            (
              direction: [number, number, number],
            ): readonly [[number, number, number], number, 16771544] =>
              [direction, 2.3 / KEY_SAMPLES, 0xffe9d8] as const,
          ),
          [[0.35, 0.1, 0.3], 0.85, 0xffe9d8],
          [[0.1, 0.3, -0.25], 1.6, 0xffffff],
        ] as const
      ).map(
        ([direction, intensity, hex]:
          | readonly [[number, number, number], number, 16771544]
          | readonly [readonly [0.35, 0.1, 0.3], 0.85, 16771544]
          | readonly [readonly [0.1, 0.3, -0.25], 1.6, 16777215]): {
          kind: "directional";
          direction:
            | [number, number, number]
            | readonly [0.35, 0.1, 0.3]
            | readonly [0.1, 0.3, -0.25];
          color: [number, number, number];
          intensity: number;
        } => ({
          kind: "directional" as const,
          direction,
          color: linear(hex),
          intensity,
        }),
      ),
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
    const light: THREE.DirectionalLight = new THREE.DirectionalLight(
      new THREE.Color(...one.color),
      one.intensity,
    );
    const [x, y, z]: readonly [number, number, number] = one.direction;
    light.position.set(x * scale, y * scale, z * scale);
    scene.add(light);
    if (!softbox.includes(one.direction as [number, number, number])) continue;
    shadowLights.push(light);
    light.castShadow = true;
    // The authored shadow view spans 0.4 * scale world metres on each axis.
    // Map resolution and filter radius are display settings, not crease measurements.
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
