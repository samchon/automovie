import {
  IAutoMovieCompiledEffect,
  IAutoMovieEffectRecipe,
} from "@automovie/interface";

import { IAutoMovieEffectParticle } from "./IAutoMovieEffectParticle";
import { IAutoMovieEffectSample } from "./IAutoMovieEffectSample";
import { mixSeed } from "./math/mixSeed";

/**
 * Sample a compiled primitive effect from its absolute fixed-step clock.
 *
 * Spawn identity depends only on compiled bytes and particle index. Call
 * scheduling, wall time, worker count and GPU randomness cannot change it.
 * Inputs must be admitted compiled recipes and finite sampling coordinates.
 * Time is floored to the effect's absolute step with a 1e-9 quotient allowance;
 * the cue is half-open. Far LOD retains indexes divisible by four, and the
 * output caps live particles rather than all candidate allocations.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Absolute-step spawn times and the preserved seed/index/domain stream determine ballistic drift, lifetime and sinusoidal opacity independently of evaluation order; admitted positive step and recipe ranges are required.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Viewer instanced effects and shot runtime sampling share one compiled v1 sampler while recipe compilation owns validation and source-derived budgets.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Fixed-step quotient allowance and index-quarter thinning are stated clock and LOD conventions, not fixture-specific recovery; invalid direct inputs are not silently admitted here.
 * @evidence contracts/development/common.md#meaningful-documentation Documents scheduling independence, half-open cue time, admitted-input premise, quotient allowance, LOD thinning and the distinction between candidate storage and output budget.
 * @evidence contracts/development/implementation.md#efficient-algorithms Ordinary work and candidate indexes use the maximum-lifetime window; retained stains scan the complete recipe-bounded emission history. Returned records stop at maxParticles, independently of candidate storage.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each particle identity reuses stable random domains but each time sample recomputes its live population; no mutable recipe equivalence is assumed across frames.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Candidate and thinned index arrays are call-local; output owns its particle positions and bounded live records, and no GPU object or recipe reference is retained.
 */
export const sampleCompiledEffect: (
  effect: IAutoMovieCompiledEffect,
  time: number,
  cameraDistance?: number,
) => IAutoMovieEffectSample = (
  effect: IAutoMovieCompiledEffect,
  time: number,
  cameraDistance: number = 0,
): IAutoMovieEffectSample => {
  const step: number = effect.fixedStepSeconds;
  const sampledTime: number =
    Math.floor(Math.max(0, time) / step + 1e-9) * step;
  if (sampledTime < effect.start || sampledTime >= effect.end)
    return { time: sampledTime, active: false, intensity: 0, particles: [] };
  const cueProgress: number =
    (sampledTime - effect.start) / Math.max(step, effect.end - effect.start);
  const intensity: number =
    effect.intensity.from +
    (effect.intensity.to - effect.intensity.from) * cueProgress;
  const recipe: IAutoMovieEffectRecipe = effect.recipe;
  const emissionElapsed: number = Math.min(
    sampledTime - effect.start,
    recipe.emission.duration,
  );
  const regularSpawned: number = Math.floor(
    emissionElapsed * recipe.emission.rate + 1e-9,
  );
  const maximumLifetime: number = recipe.particle.lifetime.max;
  const earliestRegular: number =
    recipe.motion.ballistic?.retainStains === true
      ? 0
      : Math.max(
          0,
          Math.floor(
            Math.max(0, sampledTime - effect.start - maximumLifetime) *
              recipe.emission.rate,
          ),
        );
  const candidates: number[] = [
    ...Array.from(
      { length: recipe.emission.burst },
      (_: unknown, index: number): number => index,
    ),
    ...Array.from(
      { length: Math.max(0, regularSpawned - earliestRegular) },
      (_: unknown, offset: number): number =>
        recipe.emission.burst + earliestRegular + offset,
    ),
  ];
  const thinned: number[] =
    cameraDistance > recipe.budget.lodDistance
      ? candidates.filter((index: number): boolean => index % 4 === 0)
      : candidates;
  const particles: IAutoMovieEffectParticle[] = [];
  for (const index of thinned) {
    const regular: number = index - recipe.emission.burst;
    const spawnTime: number =
      regular < 0
        ? effect.start
        : effect.start + (regular + 1) / recipe.emission.rate;
    const age: number = sampledTime - spawnTime;
    const lifetime: number = interpolate(
      recipe.particle.lifetime.min,
      recipe.particle.lifetime.max,
      effectValue(effect.seed, index, 0x6c696665),
    );
    if (
      age < 0 ||
      (age >= lifetime && recipe.motion.ballistic?.retainStains !== true)
    )
      continue;
    const ageRatio: number = Math.min(1, age / lifetime);
    const initial: { x: number; y: number; z: number } = {
      x: interpolate(
        effect.bounds.min.x,
        effect.bounds.max.x,
        effectValue(effect.seed, index, 0x706f7358),
      ),
      y: interpolate(
        effect.bounds.min.y,
        effect.bounds.max.y,
        effectValue(effect.seed, index, 0x706f7359),
      ),
      z: interpolate(
        effect.bounds.min.z,
        effect.bounds.max.z,
        effectValue(effect.seed, index, 0x706f735a),
      ),
    };
    const turbulenceAngle: number =
      effectValue(effect.seed, index, 0x74757262) * Math.PI * 2;
    const turbulenceSpeed: number =
      recipe.motion.turbulence * effectValue(effect.seed, index, 0x73706565);
    const velocity: { x: number; y: number; z: number } = {
      x: recipe.motion.wind.x + Math.cos(turbulenceAngle) * turbulenceSpeed,
      y: recipe.motion.wind.y + recipe.motion.rise,
      z: recipe.motion.wind.z + Math.sin(turbulenceAngle) * turbulenceSpeed,
    };
    const ballistic: IAutoMovieEffectRecipe["motion"]["ballistic"] =
      recipe.motion.ballistic;
    if (ballistic?.velocitySpread)
      for (const [axis, domain] of [
        ["x", 0x76737078],
        ["y", 0x76737079],
        ["z", 0x7673707a],
      ] as const)
        velocity[axis] +=
          (effectValue(effect.seed, index, domain) * 2 - 1) *
          ballistic.velocitySpread[axis];
    const landing: number =
      ballistic === undefined
        ? Infinity
        : initial.y < ballistic.floor
          ? 0
          : ballistic.gravity > 0
            ? (velocity.y +
                Math.sqrt(
                  velocity.y ** 2 +
                    2 * ballistic.gravity * (initial.y - ballistic.floor),
                )) /
              ballistic.gravity
            : velocity.y < 0
              ? (ballistic.floor - initial.y) / velocity.y
              : Infinity;
    const settled: boolean = age >= landing;
    // Retention preserves a stain formed by a live particle. An airborne
    // particle that expired before landing cannot reappear on a later seek.
    if (age >= lifetime && landing >= lifetime) continue;
    if (age >= lifetime && !settled) continue;
    if (settled && ballistic?.retainStains !== true) continue;
    const travel: number = Math.min(age, landing);
    const opacity: number =
      interpolate(
        recipe.particle.opacity.min,
        recipe.particle.opacity.max,
        effectValue(effect.seed, index, 0x6f706163),
      ) *
      intensity *
      (settled || recipe.particle.opacity.envelope === "constant"
        ? 1
        : Math.sin(Math.PI * ageRatio));
    particles.push({
      index,
      position: {
        x: initial.x + velocity.x * travel,
        y: settled
          ? ballistic!.floor
          : initial.y +
            velocity.y * travel -
            0.5 * (ballistic?.gravity ?? 0) * travel ** 2,
        z: initial.z + velocity.z * travel,
      },
      size:
        interpolate(
          recipe.particle.size.min,
          recipe.particle.size.max,
          effectValue(effect.seed, index, 0x73697a65),
        ) * (settled ? (ballistic?.stainSizeMultiplier ?? 1) : 1),
      opacity,
      ageRatio,
      ...(settled ? { normal: { x: 0, y: 1, z: 0 } } : {}),
    });
    if (particles.length === recipe.budget.maxParticles) break;
  }
  return { time: sampledTime, active: true, intensity, particles };
};

const interpolate: (from: number, to: number, ratio: number) => number = (
  from: number,
  to: number,
  ratio: number,
): number => from * (1 - ratio) + to * ratio;

/**
 * Preserve the compiled-effect v1 stream while the public multi-part sampler
 * serves new domains. The effect digest does not carry a sampler version, so
 * changing this fold would make identical compiled bytes replay differently.
 */
const effectValue: (seed: number, index: number, domain: number) => number = (
  seed: number,
  index: number,
  domain: number,
): number => {
  let state: number = mixSeed(seed, domain);
  state = mixSeed(index, state);
  state = (state + 0x6d2b79f5) >>> 0;
  let output: number = state;
  output = Math.imul(output ^ (output >>> 15), output | 1);
  output ^= output + Math.imul(output ^ (output >>> 7), output | 61);
  return ((output ^ (output >>> 14)) >>> 0) / 4_294_967_296;
};
