import { IAutoMovieCompiledEffect, IAutoMovieEffectRecipe } from "@automovie/interface";
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
 * @evidence contracts/common.md#principled-implementation Absolute-step spawn times and the preserved seed/index/domain stream determine ballistic drift, lifetime and sinusoidal opacity independently of evaluation order; admitted positive step and recipe ranges are required.
 * @evidence contracts/common.md#clear-and-simple-design Viewer instanced effects and shot runtime sampling share one compiled v1 sampler while recipe compilation owns validation and source-derived budgets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed-step quotient allowance and index-quarter thinning are stated clock and LOD conventions, not fixture-specific recovery; invalid direct inputs are not silently admitted here.
 * @evidence contracts/common.md#meaningful-documentation Documents scheduling independence, half-open cue time, admitted-input premise, quotient allowance, LOD thinning and the distinction between candidate storage and output budget.
 * @evidence contracts/performance.md#efficient-algorithms Work and temporary indexes scale with burst plus regular spawns in the maximum-lifetime window, while returned live records stop at maxParticles; a large burst can allocate more candidates than that cap.
 * @evidence contracts/performance.md#reuse-equivalent-work Each particle identity reuses stable random domains but each time sample recomputes its live population; no mutable recipe equivalence is assumed across frames.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Candidate and thinned index arrays are call-local; output owns its particle positions and bounded live records, and no GPU object or recipe reference is retained.
 */
export const sampleCompiledEffect: (effect: IAutoMovieCompiledEffect, time: number, cameraDistance?: number) => IAutoMovieEffectSample = (
  effect: IAutoMovieCompiledEffect,
  time: number,
  cameraDistance: number = 0,
): IAutoMovieEffectSample => {
  const step: number = effect.fixedStepSeconds;
  const sampledTime: number = Math.floor(Math.max(0, time) / step + 1e-9) * step;
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
  const earliestRegular: number = Math.max(
    0,
    Math.floor(
      Math.max(0, sampledTime - effect.start - maximumLifetime) *
        recipe.emission.rate,
    ),
  );
  const candidates: number[] = [
    ...Array.from({ length: recipe.emission.burst }, (_: unknown, index: number): number => index),
    ...Array.from(
      { length: Math.max(0, regularSpawned - earliestRegular) },
      (_: unknown, offset: number): number => recipe.emission.burst + earliestRegular + offset,
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
    if (age < 0 || age >= lifetime) continue;
    const ageRatio: number = age / lifetime;
    const initial: { x: number; y: number; z: number; } = {
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
    const opacity: number =
      interpolate(
        recipe.particle.opacity.min,
        recipe.particle.opacity.max,
        effectValue(effect.seed, index, 0x6f706163),
      ) *
      intensity *
      Math.sin(Math.PI * ageRatio);
    particles.push({
      index,
      position: {
        x:
          initial.x +
          (recipe.motion.wind.x + Math.cos(turbulenceAngle) * turbulenceSpeed) *
            age,
        y: initial.y + (recipe.motion.wind.y + recipe.motion.rise) * age,
        z:
          initial.z +
          (recipe.motion.wind.z + Math.sin(turbulenceAngle) * turbulenceSpeed) *
            age,
      },
      size: interpolate(
        recipe.particle.size.min,
        recipe.particle.size.max,
        effectValue(effect.seed, index, 0x73697a65),
      ),
      opacity,
      ageRatio,
    });
    if (particles.length === recipe.budget.maxParticles) break;
  }
  return { time: sampledTime, active: true, intensity, particles };
};

const interpolate: (from: number, to: number, ratio: number) => number = (from: number, to: number, ratio: number): number =>
  from * (1 - ratio) + to * ratio;

/**
 * Preserve the compiled-effect v1 stream while the public multi-part sampler
 * serves new domains. The effect digest does not carry a sampler version, so
 * changing this fold would make identical compiled bytes replay differently.
 */
const effectValue: (seed: number, index: number, domain: number) => number = (seed: number, index: number, domain: number): number => {
  let state: number = mixSeed(seed, domain);
  state = mixSeed(index, state);
  state = (state + 0x6d2b79f5) >>> 0;
  let output: number = state;
  output = Math.imul(output ^ (output >>> 15), output | 1);
  output ^= output + Math.imul(output ^ (output >>> 7), output | 61);
  return ((output ^ (output >>> 14)) >>> 0) / 4_294_967_296;
};
