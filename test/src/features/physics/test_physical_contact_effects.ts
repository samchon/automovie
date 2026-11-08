import type {
  IAutoMovieEffectRecipe,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { compileImpactEffects } from "../../../../packages/engine/src/physics/compileImpactEffects";
import { sampleCompiledEffect } from "../../../../packages/engine/src/sampleCompiledEffect";
import { AutoMovieHumanContactAppearance as Appearance } from "../../../../packages/human/src/appearance/AutoMovieHumanContactAppearance";

/** Causal effects and local skin response from actual completed-step quantities.
 *
 * Scenarios:
 * 1. Two contact impulses materialize through the existing compiled stream owner.
 * 2. Airborne spray follows gravity and settled stains persist through late seeks.
 * 3. Later impulses cannot change earlier spray seeds or early local skin weight.
 * 4. A mark affects nearby vertices of its struck bone, with remote samples neutral.
 * 5. Random-order reads do not accumulate extra marks or particle state.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `compileImpactEffects`, `sampleCompiledEffect`, `AutoMovieHumanContactAppearance` on in-memory inputs and asserts the returned observations through 3x TestValidator.predicate, 4x TestValidator.equals; 5 numbered scenarios (first: Two contact impulses materialize through the existing compiled stream owner.; last: Random-order reads do not accumulate extra marks or particle state.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (7 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 5 numbered scenarios (first: Two contact impulses materialize through the existing compiled stream owner.; last: Random-order reads do not accumulate extra marks or particle state.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_contact_effects`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Two contact impulses materialize through the existing compiled stream owner.).
 */
export function test_physical_contact_effects(): void {
  const receipt: Receipt = {
    id: "impact",
    source: "solver",
    seconds: 1,
    endSeconds: 2,
    a: { body: "person", bone: "head", shape: "skin", material: "skin" },
    b: { body: "other", bone: "hand", shape: "glove", material: "glove" },
    point: { x: 0, y: 1, z: 0 },
    normal: { x: 1, y: 0, z: 0 },
    impulse: 11,
    separation: -0.01,
    compression: 0.01,
    samples: [1, 2].map(
      (
        seconds: number,
        index: number,
      ): {
        seconds: number;
        duration: number;
        impulse: number;
        point: { x: number; y: number; z: number };
        normal: { x: number; y: number; z: number };
        separation: number;
        compression: number;
      } => ({
        seconds,
        duration: 1 / 120,
        impulse: index === 0 ? 1 : 10,
        point: { x: 0, y: 1, z: 0 },
        normal: { x: 1, y: 0, z: 0 },
        separation: -0.01,
        compression: 0.01,
      }),
    ),
  };
  const recipe: IAutoMovieEffectRecipe = {
    id: "spray",
    kind: "spray",
    seed: 1,
    emission: { rate: 0, burst: 1, duration: 0.1 },
    particle: {
      lifetime: { min: 1, max: 1 },
      size: { min: 0.02, max: 0.02 },
      color: "#660011",
      opacity: { min: 1, max: 1 },
    },
    motion: {
      wind: { x: 0, y: 0, z: 0 },
      rise: 0,
      turbulence: 0.1,
      ballistic: { gravity: 9.81, floor: 0, retainStains: true },
    },
    budget: { maxParticles: 100, lodDistance: 100 },
    blend: "alpha",
  };
  const compile: (value: Receipt) => ReturnType<typeof compileImpactEffects> = (
    value: Receipt,
  ): ReturnType<typeof compileImpactEffects> =>
    compileImpactEffects({
      contacts: [value],
      geometricImpulses: {},
      recipe,
      endSeconds: 10,
      fixedStepSeconds: 1 / 120,
      particlesPerImpulse: 10,
      speedPerImpulse: 0.1,
      upwardFraction: 0.5,
      maximumEffects: 10,
    });
  const effects: ReturnType<typeof compileImpactEffects> = compile(receipt);
  TestValidator.predicate(
    "actual impulses create two shared compiled streams",
    effects.length === 2 &&
      effects[0]!.recipe.emission.burst === 10 &&
      effects[1]!.recipe.emission.burst === 100,
  );
  const prefix: Receipt = {
    ...receipt,
    samples: receipt.samples!.slice(0, 1),
    endSeconds: 1,
    impulse: 1,
  };
  TestValidator.equals(
    "future contact does not change earlier effect",
    JSON.stringify(effects[0]),
    JSON.stringify(compile(prefix)[0]),
  );
  const late: ReturnType<typeof sampleCompiledEffect> = sampleCompiledEffect(
    effects[0]!,
    8,
  );
  TestValidator.predicate(
    "floor stains remain after airborne lifetime",
    late.particles.length === 10 &&
      late.particles.every(
        (particle: (typeof late.particles)[number]): boolean =>
          particle.position.y === 0 &&
          particle.normal?.y === 1 &&
          particle.opacity > 0,
      ),
  );
  const appearance: (
    value: Receipt,
  ) => ReturnType<typeof Appearance.prepare> = (
    value: Receipt,
  ): ReturnType<typeof Appearance.prepare> =>
    Appearance.prepare({
      body: "person",
      contacts: [value],
      frameAt: (): {
        position: { x: number; y: number; z: number };
        rotation: { x: number; y: number; z: number; w: number };
      } => ({
        position: { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      }),
      materials: ["skin"],
      radius: 0.1,
      weightPerImpulse: 0.1,
      color: [0.5, 0.2, 0.2],
      decaySeconds: Infinity,
      compressionSeconds: 0.1,
      geometricImpulses: {},
    });
  const full: ReturnType<typeof Appearance.prepare> = appearance(receipt);
  const point: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  TestValidator.equals(
    "future impulse cannot color an earlier skin sample",
    full("head", point, 1.5),
    appearance(prefix)("head", point, 1.5),
  );
  TestValidator.predicate(
    "appearance is local to actual struck surface",
    full("head", point, 2).color[0] < 1 &&
      full("head", { x: 0.2, y: 0, z: 0 }, 2).color[0] === 1 &&
      full("chest", point, 2).color[0] === 1,
  );
  const snapshot: string = JSON.stringify(full("head", point, 1.5));
  full("head", point, 9);
  TestValidator.equals(
    "random seek does not accumulate skin state",
    JSON.stringify(full("head", point, 1.5)),
    snapshot,
  );
  TestValidator.equals(
    "random seek does not change floor stains",
    JSON.stringify(sampleCompiledEffect(effects[0]!, 8)),
    JSON.stringify(late),
  );
}
