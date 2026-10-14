import { sceneFogTransmittance } from "@automovie/engine";
import { IAutoMovieFog, IAutoMovieScene } from "@automovie/interface";
import {
  type IAutoMovieModelObject,
  applyRenderMode,
  applySceneFog,
  buildModel,
  buildScene,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { IDENTITY_TRANSFORM, createModel } from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";

const FOG: IAutoMovieFog = {
  density: 0.02,
  color: { r: 0.25, g: 0.5, b: 0.75, a: null, hex: null },
};

const sceneOf: (
  fog: IAutoMovieScene["fog"],
) => THREE.Scene<THREE.Object3DEventMap> = (
  fog: IAutoMovieScene["fog"],
): THREE.Scene<THREE.Object3DEventMap> =>
  buildScene(
    {
      id: "scene-1",
      name: null,
      nodes: [
        {
          id: "node-a",
          model: "model-a",
          transform: IDENTITY_TRANSFORM,
          motion: null,
          pose: null,
        },
      ],
      cameras: [],
      lights: [],
      fog,
    },
    (): IAutoMovieModelObject =>
      buildModel({ ...createModel(), id: "model-a" }),
  ).scene;

/** JavaScript transcription of the squared-depth fog expression; this computes binary64 values rather than shader fragments. */
const shaderTransmittance: (fog: THREE.FogExp2, depth: number) => number = (
  fog: THREE.FogExp2,
  depth: number,
): number => 1 - (1 - Math.exp(-fog.density * fog.density * depth * depth));

/**
 * Scene fog constructs and clears the expected Three object, shares the engine's squared-depth prediction and restores atmosphere across guide modes.
 *
 * These are CPU object and numerical observations. The test starts no GPU renderer and cannot establish native fragment values, frame bytes or cross-platform pixel identity.
 *
 * The sampled law is T(d)=exp(-(density*d)^2). A JavaScript transcription using the constructed density is compared with engine predictions at the selected depths within 1e-12; matching that shared law is distinct from observing shader arithmetic or pixels.
 *
 * Scenarios:
 *
 * 1. Absence and null leave a fresh scene without fog and clear an existing fog object. The engine returns unit transmittance; no historical rendered bytes are compared.
 * 2. Native fog state preserves the authored density and linear color triple.
 * 3. Engine prediction and the JavaScript expression agree at the selected depths; half-transmittance and twice that depth distinguish the squared law from a linear Beer-Lambert exponent.
 * 4. Predicted transmittance decreases across the selected increasing depths, including the far sample.
 * 5. Structural modes suspend and restore fog, while beauty retains the same native fog object; palette pixels are not measured.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds/clears real FogExp2 scene values, evaluates Engine transmittance and applies/restores guide modes; catches retained absent fog, altered density/color and atmosphere left suspended after a structural pass.
 * @evidence contracts/testing.md#independent-expectations The squared-depth law gives unit transmission at zero, half at sqrt(ln2)/density and one sixteenth at twice that depth; a JavaScript transcription is explicitly a shared-law comparison, not shader arithmetic or pixel proof.
 * @evidence contracts/testing.md#distinguishing-cases Covers omission/null clearing an existing object, selected depths, monotonic distant decay and mask-versus-beauty state identity; malformed fog admission and actual GPU appearance belong elsewhere.
 * @evidence contracts/testing.md#execution-ownership This named portable unit calls maintained Engine/Viewer source and existing generic scene fixtures with CPU-side fog objects, restores pass state and starts no browser, renderer, worker or process.
 */
export function test_viewer_scene_fog(): void {
  // 1. Absence clears an existing fog object.
  //
  // Clearing a previously fogged scene distinguishes active removal from reading a fresh Scene's default null field.
  const clearedByNull: THREE.Scene<THREE.Object3DEventMap> = sceneOf(FOG);
  const carriedFogFirst: boolean = clearedByNull.fog !== null;
  applySceneFog(clearedByNull, null);
  const clearedByAbsence: THREE.Scene<THREE.Object3DEventMap> = sceneOf(FOG);
  applySceneFog(clearedByAbsence, undefined);
  TestValidator.equals(
    "a scene declaring no fog builds no fog, clears one already standing, and reads as fully transmissive",
    namedFacts([
      ["undeclared", (): boolean => sceneOf(undefined).fog === null],
      ["explicitNull", (): boolean => sceneOf(null).fog === null],
      ["aBuiltFogWasReallyThere", (): boolean => carriedFogFirst],
      ["nullClearsAStandingFog", (): boolean => clearedByNull.fog === null],
      ["absenceClearsItToo", (): boolean => clearedByAbsence.fog === null],
      [
        "engineUndefined",
        (): boolean => nclose(sceneFogTransmittance(undefined, 250), 1, 0),
      ],
      [
        "engineNull",
        (): boolean => nclose(sceneFogTransmittance(null, 250), 1, 0),
      ],
    ]),
    {
      undeclared: true,
      explicitNull: true,
      aBuiltFogWasReallyThere: true,
      nullClearsAStandingFog: true,
      absenceClearsItToo: true,
      engineUndefined: true,
      engineNull: true,
    },
  );

  // 2. Declared fog values reach the native scene object.
  const built: THREE.Fog | THREE.FogExp2 | null = sceneOf(FOG).fog;
  if (!(built instanceof THREE.FogExp2))
    throw new Error("a declared fog must build an exponential fog");
  TestValidator.equals(
    "the built fog carries the authored density and linear color unconverted",
    namedFacts([
      ["density", (): boolean => nclose(built.density, FOG.density, 0)],
      ["red", (): boolean => nclose(built.color.r, FOG.color.r, 1e-6)],
      ["green", (): boolean => nclose(built.color.g, FOG.color.g, 1e-6)],
      ["blue", (): boolean => nclose(built.color.b, FOG.color.b, 1e-6)],
    ]),
    { density: true, red: true, green: true, blue: true },
  );

  // 3. The Engine result agrees with the shared-law JavaScript reference and authored geometric values.
  const depths: number[] = [0, 1, 5, 20, 83.26, 250];
  TestValidator.equals(
    "Engine and the JavaScript squared-depth reference agree at selected depths",
    namedFacts([
      [
        "engineMatchesShader",
        (): boolean =>
          depths.every((depth: number): boolean =>
            nclose(
              sceneFogTransmittance(FOG, depth),
              shaderTransmittance(built, depth),
              1e-12,
            ),
          ),
      ],
      ["atTheLens", (): boolean => nclose(sceneFogTransmittance(FOG, 0), 1, 0)],
      [
        "halfVisibility",
        (): boolean =>
          nclose(
            sceneFogTransmittance(FOG, Math.sqrt(Math.LN2) / FOG.density),
            0.5,
            1e-12,
          ),
      ],
      // Doubling sqrt(ln2)/density quadruples the squared exponent and leaves one sixteenth, distinguishing the law from an unsquared exponent.
      [
        "squaredRatherThanLinear",
        (): boolean =>
          nclose(
            sceneFogTransmittance(FOG, (2 * Math.sqrt(Math.LN2)) / FOG.density),
            1 / 16,
            1e-12,
          ),
      ],
    ]),
    {
      engineMatchesShader: true,
      atTheLens: true,
      halfVisibility: true,
      squaredRatherThanLinear: true,
    },
  );

  // 4. distance is what fog reads.
  TestValidator.equals(
    "a farther subject keeps less of itself, monotonically",
    namedFacts([
      [
        "monotone",
        (): boolean =>
          depths.every(
            (depth: number, index: number): boolean =>
              index === 0 ||
              sceneFogTransmittance(FOG, depth) <
                sceneFogTransmittance(FOG, depths[index - 1]!),
          ),
      ],
      [
        "nearlyGoneFarOff",
        (): boolean => sceneFogTransmittance(FOG, 250) < 0.01,
      ],
    ]),
    { monotone: true, nearlyGoneFarOff: true },
  );

  // 5. structural passes suspend it; the beauty pass keeps it.
  const scene: THREE.Scene<THREE.Object3DEventMap> = sceneOf(FOG);
  const declared: THREE.Fog | THREE.FogExp2 | null = scene.fog;
  const mask: ReturnType<typeof applyRenderMode> = applyRenderMode(
    scene,
    "mask",
  );
  const suspended: THREE.Fog | THREE.FogExp2 | null = scene.fog;
  mask.restore();
  const beauty: ReturnType<typeof applyRenderMode> = applyRenderMode(
    scene,
    "beauty",
  );
  const duringBeauty: THREE.Fog | THREE.FogExp2 | null = scene.fog;
  beauty.restore();
  TestValidator.equals(
    "a structural pass drops the atmosphere and restores the same object",
    namedFacts([
      ["suspendedDuringMask", (): boolean => suspended === null],
      ["restoredAfterMask", (): boolean => scene.fog === declared],
      ["keptDuringBeauty", (): boolean => duringBeauty === declared],
    ]),
    {
      suspendedDuringMask: true,
      restoredAfterMask: true,
      keptDuringBeauty: true,
    },
  );
}
