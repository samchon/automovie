import { createLight } from "@automovie/archetypes";
import { compileAutoMovieFlameFlicker } from "@automovie/engine";
import type {
  IAutoMovieClip,
  IAutoMovieFlameCue,
  IAutoMovieModel,
  IAutoMovieScene,
} from "@automovie/interface";
import {
  applyAutoMovieShadowParticipation,
  buildModel,
  buildScene,
  prepareAutoMovieFlames,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/nclose";
import { renderFixtureIdentity } from "../internal/renderFixtureIdentity";
import { renderFixtureNode } from "../internal/renderFixtureNode";

/**
 * A flame bound to a practical light is an unlit additive emitter whose
 * radiance is the light's intensity over the flame's mean area, added once
 * along every view ray, and it casts no shadow.
 *
 * Scenarios:
 *
 * 1. With a 1.2 cd point light of colour (1, 0.6, 0.3) bound through its light
 *    clip, the flame material's linear colour is that colour times 1.2 / Ā, Ā
 *    from compileAutoMovieFlameFlicker over the same cue.
 * 2. The material is a basic (unlit) material with additive blending and no depth
 *    write; the mesh draws at render order −1.
 * 3. After shadow participation, the flame casts no shadow while the candle's
 *    opaque parts do.
 * 4. An unbound flame of 15.92 cd/m² white has linear colour 15.92, the radiance
 *    of a Lambertian card of albedo 0.5 under 1 cd at 0.1 m (100 × 0.5 / π).
 * 5. Additive blending sums every face a ray crosses that the material draws, so a
 *    ray seen side-on through the closed flame's middle, from the front and
 *    from behind, meets exactly one drawn face, and the summed radiance is the
 *    luminance times that face's soft-edge factor `|n · v|^1.5`, never more
 *    than the luminance; drawn on both faces, the far wall adds a second time
 *    and the sum is about twice the luminance.
 * 6. An ember's disc, one open sheet, is met once from above and once from below,
 *    so it shows from either side at its luminance.
 *
 * The same radiance read back from a floating-point colour target beside the
 * 15.92 cd/m² Lambertian card needs a WebGL host, which this unit test does not
 * start; scenarios 4 and 5 pin the two facts that capture depends on.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists each scenario's light, cue and the material, ray sum or shadow fact it pins, and the GPU read-back it leaves to a capture.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares flames through the public preparer and reads the material and shadow flags of the mesh it mounts; scenarios 5 and 6 cast rays at the mounted mesh with three's Raycaster, which culls faces by the material's side as the rasterizer does, and add each drawn face's unlit radiance as additive blending adds it.
 * @evidence contracts/development/testing.md#independent-expectations The luminance follows I_on / Ā from issue #4094; 15.92 cd/m² follows from E = I/d² and L = ρE/π; one face per ray follows from additive blending's sum and the issue's requirement that the emissive luminance be I_on / Ā.
 * @evidence contracts/development/testing.md#distinguishing-cases A lit flame, a depth-writing flame, a shadow-casting flame, a luminance not divided by Ā, a closed flame drawn on both faces, which doubles the ray sum, and an ember drawn on one face, which vanishes from one side, each fail. The floating-point read-back on a GPU is a capture's, not this unit's; the flame's light belongs to test_render_flame_light_flicker.
 * @evidence contracts/development/testing.md#execution-ownership In-memory Three scene graph and CPU ray casts; no renderer.
 */
export function test_render_flame_emission(): void {
  const candle: IAutoMovieModel = createLight({ id: "candle", kind: "candle" });
  const scene: IAutoMovieScene = {
    id: "table",
    name: null,
    nodes: [renderFixtureNode("candle-1", candle.id)],
    cameras: [],
    lights: [
      {
        id: "candle-light",
        type: "point",
        transform: renderFixtureIdentity,
        color: { r: 1, g: 0.6, b: 0.3, a: null, hex: null },
        intensity: 1.2,
        range: 6,
      },
    ],
  };
  const bound: IAutoMovieFlameCue = {
    id: "wick",
    node: "candle-1",
    emitter: "light",
    seed: 3,
    size: { kind: "small", height: 0.03, radius: 0.006 },
    light: "candle-glow",
  };
  const clip: IAutoMovieClip = {
    id: "candle-glow",
    name: null,
    duration: 3,
    loop: false,
    tracks: [
      {
        channel: {
          kind: "pointer",
          pointer: "/lights/candle-light/intensity",
          valueType: "scalar",
        },
        times: [0],
        values: [1.2],
        interpolation: "step",
      },
    ],
  } as IAutoMovieClip;
  const object: ReturnType<typeof buildModel> = buildModel(candle);
  const mounted: ReturnType<typeof buildScene> = buildScene(
    scene,
    (): ReturnType<typeof buildModel> => object,
  );
  const flames: ReturnType<typeof prepareAutoMovieFlames> =
    prepareAutoMovieFlames({
      shot: { flames: [bound], lightMotions: [clip], duration: 3 },
      scene,
      models: [candle],
      resolveNode: (): ReturnType<typeof buildModel> => object,
      resolveLight: (light: string): THREE.Light | undefined =>
        mounted.lights.get(light),
    });
  const mesh: THREE.Mesh = object.object.getObjectByName(
    "flame:candle-1/wick",
  ) as THREE.Mesh;
  const material: THREE.MeshBasicMaterial =
    mesh.material as THREE.MeshBasicMaterial;

  // 1. Luminance from the light.
  const mean: number = compileAutoMovieFlameFlicker(bound, 3).mean;
  const luminance: number = 1.2 / mean;
  TestValidator.predicate(
    "colour is the light's colour times I_on / mean area",
    Math.abs(material.color.r - luminance) / luminance < 1e-6 &&
      Math.abs(material.color.g - 0.6 * luminance) / luminance < 1e-6 &&
      Math.abs(material.color.b - 0.3 * luminance) / luminance < 1e-6,
  );

  // 2. Unlit, additive, no depth write, drawn first.
  TestValidator.predicate(
    "unlit additive emitter drawn before the prop",
    material instanceof THREE.MeshBasicMaterial &&
      material.blending === THREE.AdditiveBlending &&
      material.depthWrite === false &&
      mesh.renderOrder === -1,
  );

  // 3. Shadow participation.
  applyAutoMovieShadowParticipation(mounted.scene);
  let opaqueCasts: boolean = false;
  object.object.traverse((candidate: THREE.Object3D): void => {
    if (candidate !== mesh && (candidate as THREE.Mesh).isMesh === true)
      opaqueCasts ||= candidate.castShadow;
  });
  TestValidator.predicate(
    "the flame casts no shadow; the candle does",
    mesh.castShadow === false && opaqueCasts,
  );

  // 5. One drawn face per view ray through the closed flame, from either side.
  flames.apply(1);
  mounted.scene.updateMatrixWorld(true);
  const height: number = 0.03;
  const radius: number = 0.006;
  for (const side of [1, -1] as const) {
    const ray: IRaySum = sumAlongRay(
      mesh,
      new THREE.Vector3(0.1 * radius, 0.47 * height, side),
      new THREE.Vector3(0.1 * radius, 0.47 * height, 0),
    );
    TestValidator.predicate(
      `a side-on ray ${side > 0 ? "from the front" : "from behind"} adds the luminance once (${ray.faces} faces, ${ray.radiance.toFixed(1)} of ${luminance.toFixed(1)} cd/m²)`,
      ray.faces === 1 &&
        ray.radiance <= luminance * (1 + 1e-9) &&
        ray.radiance >= 0.5 * luminance,
    );
  }
  flames.dispose();

  // 6. An ember's open disc shows once from above and once from below.
  const ember: ReturnType<typeof prepareAutoMovieFlames> =
    prepareAutoMovieFlames({
      shot: {
        flames: [
          {
            id: "ash",
            node: "candle-1",
            emitter: "light",
            seed: 5,
            size: { kind: "ember", radius: 0.004 },
            emission: {
              luminance: 100,
              color: { r: 1, g: 0.3, b: 0.1, a: null, hex: null },
            },
          },
        ],
        duration: 3,
      },
      scene,
      models: [candle],
      resolveNode: (): ReturnType<typeof buildModel> => object,
      resolveLight: (light: string): THREE.Light | undefined =>
        mounted.lights.get(light),
    });
  ember.apply(1);
  mounted.scene.updateMatrixWorld(true);
  const disc: THREE.Mesh = object.object.getObjectByName(
    "flame:candle-1/ash",
  ) as THREE.Mesh;
  const glow: number = (disc.material as THREE.MeshBasicMaterial).color.r;
  const across: THREE.Vector3 = new THREE.Vector3(
    0.0012 * Math.cos(Math.PI / 24),
    0,
    0.0012 * Math.sin(Math.PI / 24),
  );
  for (const side of [1, -1] as const) {
    const ray: IRaySum = sumAlongRay(disc, across.clone().setY(side), across);
    TestValidator.predicate(
      `the ember shows once from ${side > 0 ? "above" : "below"}`,
      ray.faces === 1 && nclose(ray.radiance, glow, 1e-6 * glow),
    );
  }
  ember.dispose();

  // 4. The calibration value.
  const unbound: ReturnType<typeof prepareAutoMovieFlames> =
    prepareAutoMovieFlames({
      shot: {
        flames: [
          {
            ...bound,
            light: undefined,
            emission: {
              luminance: 15.92,
              color: { r: 1, g: 1, b: 1, a: null, hex: null },
            },
          },
        ],
        duration: 3,
      },
      scene,
      models: [candle],
      resolveNode: (): ReturnType<typeof buildModel> => object,
      resolveLight: (light: string): THREE.Light | undefined =>
        mounted.lights.get(light),
    });
  const card: number = (100 * 0.5) / Math.PI;
  TestValidator.predicate(
    "15.92 cd/m² white matches the Lambertian card within 1 %",
    Math.abs(
      (
        (object.object.getObjectByName("flame:candle-1/wick") as THREE.Mesh)
          .material as THREE.MeshBasicMaterial
      ).color.r - card,
    ) /
      card <=
      0.01,
  );
  unbound.dispose();
}

/** The drawn faces a view ray meets and the radiance additive blending sums. */
interface IRaySum {
  /** Faces the material draws that the ray crosses. */
  faces: number;

  /** The sum of each face's unlit radiance times its soft-edge factor. */
  radiance: number;
}

/**
 * Cast a ray from `from` toward `toward`, both in the mesh's local frame, and
 * add the radiance of every face it meets that the material's side draws: the
 * material's red channel times `|n · v|^1.5`, the soft-edge factor the flame's
 * shader patch applies, with `n` the interpolated normal the hit reports.
 */
function sumAlongRay(
  mesh: THREE.Mesh,
  from: THREE.Vector3,
  toward: THREE.Vector3,
): IRaySum {
  const origin: THREE.Vector3 = mesh.localToWorld(from.clone());
  const direction: THREE.Vector3 = mesh
    .localToWorld(toward.clone())
    .sub(origin)
    .normalize();
  const hits: THREE.Intersection[] = new THREE.Raycaster(
    origin,
    direction,
  ).intersectObject(mesh, false);
  const red: number = (mesh.material as THREE.MeshBasicMaterial).color.r;
  let radiance: number = 0;
  for (const hit of hits) {
    const normal: THREE.Vector3 = hit
      .normal!.clone()
      .transformDirection(mesh.matrixWorld);
    radiance += red * Math.abs(normal.dot(direction)) ** 1.5;
  }
  return { faces: hits.length, radiance };
}
