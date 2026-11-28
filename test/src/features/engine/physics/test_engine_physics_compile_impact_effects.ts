import { AutoMovieEngineEffect, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMovieEffectRecipe,
  IAutoMovieEffectSample,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A three-dimensional spray keeps its declared visible opacity, lands as
 * enlarged persistent stains and rejects malformed transport.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes a 3D spray at early time and retained floor stains at late time, with invalid gravity and stain scale refused.
 * @evidence contracts/development/testing.md#behavioral-verification Compiles two typed solver-receipt recipes differing in stain retention, samples each at 1.2 s and 20 s, and submits two malformed transports.
 * @evidence contracts/development/testing.md#independent-expectations The fixture requires at least 0.1 m height spread, its constant opacity, and late stains at y = 0.002 scaled by 2.3. The other recipe yields an empty late sample.
 */
export function test_engine_physics_compile_impact_effects(): void {
  const receipt: IAutoMovieContactReceipt = {
    id: "controlled-surface",
    source: "solver",
    seconds: 1,
    endSeconds: 1,
    a: { body: "tool", bone: "root", shape: "surface", material: "solid" },
    b: { body: "panel", bone: "root", shape: "surface", material: "coating" },
    point: { x: 0, y: 1, z: 0 },
    normal: { x: -1, y: 0, z: 0 },
    impulse: 1,
    separation: -0.01,
    compression: 0.01,
  };
  const streams: ReturnType<typeof AutoMovieEnginePhysics.compileImpactEffects> = [
    false,
    true,
  ].flatMap(
    (retainStains: boolean): ReturnType<typeof AutoMovieEnginePhysics.compileImpactEffects> => {
      const recipe: IAutoMovieEffectRecipe = {
        id: retainStains ? "settling-coating" : "evaporating-spray",
        kind: "spray",
        seed: 1,
        emission: { rate: 0, burst: 1, duration: 1 / 120 },
        particle: {
          lifetime: { min: 1, max: 1 },
          size: { min: 0.02, max: 0.03 },
          color: "#335577",
          opacity: { min: 0.8, max: 0.8, envelope: "constant" },
        },
        motion: {
          wind: { x: 0, y: 0, z: 0 },
          rise: 0,
          turbulence: 0.5,
          ballistic: {
            gravity: 9.81,
            floor: 0.002,
            retainStains,
            velocitySpread: { x: 0, y: 0.8, z: 0 },
            stainSizeMultiplier: 2.3,
          },
        },
        budget: { maxParticles: 64, lodDistance: 100 },
        blend: "alpha",
      };
      return AutoMovieEnginePhysics.compileImpactEffects({
        contacts: [receipt],
        geometricImpulses: {},
        recipe,
        endSeconds: 30,
        fixedStepSeconds: 1 / 120,
        particlesPerImpulse: 40,
        speedPerImpulse: 2,
        upwardFraction: 0.5,
        maximumEffects: 1,
      });
    },
  );
  const findings: string[] = [];
  for (const stream of streams) {
    const early: IAutoMovieEffectSample = AutoMovieEngineEffect.sample(
      stream,
      1.2,
    );
    const heights: number[] = early.particles.map(
      (particle: (typeof early.particles)[number]): number =>
        particle.position.y,
    );
    if (Math.max(...heights) - Math.min(...heights) < 0.1)
      findings.push(`${stream.id}: flat spray`);
    if (
      !early.particles.every(
        (particle: (typeof early.particles)[number]): boolean =>
          particle.opacity === stream.recipe.particle.opacity.min,
      )
    )
      findings.push(
        `${stream.id}: opacity differs from declared constant envelope`,
      );
    const late: IAutoMovieEffectSample = AutoMovieEngineEffect.sample(
      stream,
      20,
    );
    if (stream.recipe.motion.ballistic!.retainStains) {
      if (
        late.particles.length !== stream.recipe.emission.burst ||
        !late.particles.every(
          (particle: (typeof late.particles)[number]): boolean =>
            particle.position.y === 0.002 &&
            particle.normal?.y === 1 &&
            particle.size >= stream.recipe.particle.size.min * 2.3 &&
            particle.size <= stream.recipe.particle.size.max * 2.3,
        )
      )
        findings.push(`${stream.id}: missing or undersized persistent stains`);
    } else if (late.particles.length !== 0)
      findings.push(`${stream.id}: airborne spray survives its lifetime`);
  }
  const source: ReturnType<typeof AutoMovieEnginePhysics.compileImpactEffects>[number] = streams[0]!;
  const invalid: ((recipe: IAutoMovieEffectRecipe) => void)[] = [
    (recipe: IAutoMovieEffectRecipe): void => {
      recipe.motion.ballistic!.gravity = -1;
    },
    (recipe: IAutoMovieEffectRecipe): void => {
      recipe.motion.ballistic!.stainSizeMultiplier = 0;
    },
  ];
  for (const [index, change] of invalid.entries()) {
    const recipe: IAutoMovieEffectRecipe = structuredClone(source.recipe);
    change(recipe);
    let refused: boolean = false;
    try {
      AutoMovieEnginePhysics.compileImpactEffects({
        contacts: [
          {
            id: "receipt",
            source: "solver",
            seconds: 1,
            endSeconds: 1,
            a: { body: "a", bone: "root", shape: "surface", material: "solid" },
            b: { body: "b", bone: "root", shape: "surface", material: "solid" },
            point: { x: 0, y: 1, z: 0 },
            normal: { x: 1, y: 0, z: 0 },
            impulse: 1,
            separation: 0,
            compression: 0,
          },
        ],
        geometricImpulses: {},
        recipe,
        endSeconds: 3,
        fixedStepSeconds: 1 / 120,
        particlesPerImpulse: 1,
        speedPerImpulse: 1,
        upwardFraction: 1,
        maximumEffects: 1,
      });
    } catch {
      refused = true;
    }
    if (!refused) findings.push(`invalid transport ${index} admitted`);
  }
  TestValidator.equals(
    "all measured spray, stain and refusal outcomes",
    findings,
    [],
  );
}
