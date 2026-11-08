import type {
  IAutoMovieCompiledEffect,
  IAutoMovieContactReceipt,
  IAutoMovieEffectRecipe,
} from "@automovie/interface";

import { materializeCompiledEffects } from "../effectRuntime/materializeCompiledEffects";
import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";
import { samplePhysicalContactEvents } from "./samplePhysicalContactEvents";

/**
 * Compile contact-driven spray through the existing effect stream and sampler.
 * Colour, accumulation and physical coefficients belong to the provider or
 * production; Engine has no skin, coat, blood or species preset. Each stream
 * seed/digest covers actual contact bytes and its complete recipe. Kinematic
 * callers must explicitly supply their formula-derived impulse estimate.
 */
export function compileImpactEffects(input: {
  /** Chronological actual contact episodes, including source identity. */
  contacts: readonly IAutoMovieContactReceipt[];
  /** Formula-derived N s estimates for geometry-only receipts. */
  geometricImpulses: Readonly<Record<string, number>>;
  /** Provider-authored effect appearance, transport and budget. */
  recipe: IAutoMovieEffectRecipe;
  /** Film end, seconds; stains remain only to this cue end. */
  endSeconds: number;
  /** Absolute effect sample step in seconds. */
  fixedStepSeconds: number;
  /** Particle count per N s, before the recipe budget cap. */
  particlesPerImpulse: number;
  /** Outward speed in m/s per N s. */
  speedPerImpulse: number;
  /** World-up velocity fraction relative to outward speed. */
  upwardFraction: number;
  /** Explicit total stream cap; excess is refused, never silently dropped. */
  maximumEffects: number;
}): IAutoMovieCompiledEffect[] {
  if (
    !(input.endSeconds > 0) ||
    !(input.fixedStepSeconds > 0) ||
    !(input.particlesPerImpulse > 0) ||
    !(input.speedPerImpulse > 0) ||
    ![
      input.endSeconds,
      input.fixedStepSeconds,
      input.particlesPerImpulse,
      input.speedPerImpulse,
      input.upwardFraction,
    ].every(Number.isFinite)
  )
    throw new Error("Invalid impact-effect time, emission or velocity scale");
  if (
    !Number.isSafeInteger(input.maximumEffects) ||
    input.maximumEffects <= 0 ||
    !Number.isSafeInteger(input.recipe.budget.maxParticles) ||
    input.recipe.budget.maxParticles <= 0 ||
    input.recipe.budget.maxParticles > 4096
  )
    throw new Error("Invalid contact-effect stream or particle budget");
  const events: IAutoMovieContactReceipt[] = input.contacts.flatMap(
    (receipt: IAutoMovieContactReceipt): IAutoMovieContactReceipt[] =>
      samplePhysicalContactEvents(receipt).map(
        (event: IAutoMovieContactReceipt): IAutoMovieContactReceipt =>
          receipt.source === "solver" && receipt.samples !== undefined
            ? { ...event, id: `${receipt.id}@${event.seconds}` }
            : event,
      ),
  );
  if (events.length > input.maximumEffects)
    throw new Error("Contact-effect stream budget exceeded");
  return events.flatMap(
    (receipt: IAutoMovieContactReceipt): IAutoMovieCompiledEffect[] => {
      const impulse: number | undefined =
        receipt.source === "solver"
          ? receipt.impulse!
          : input.geometricImpulses[receipt.id];
      if (impulse === undefined || !Number.isFinite(impulse) || impulse < 0)
        throw new Error(
          `Impact effect requires a measured or formula impulse for ${receipt.id}`,
        );
      if (impulse === 0 || receipt.seconds >= input.endSeconds) return [];
      if (
        receipt.separation > 0 ||
        !Number.isFinite(receipt.seconds) ||
        receipt.seconds < 0
      )
        throw new Error(`Impact effect refuses non-contact ${receipt.id}`);
      const recipe: IAutoMovieEffectRecipe = structuredClone(input.recipe);
      recipe.kind = "spray";
      recipe.emission = {
        rate: 0,
        burst: Math.min(
          recipe.budget.maxParticles,
          Math.max(1, Math.ceil(impulse * input.particlesPerImpulse)),
        ),
        duration: input.fixedStepSeconds,
      };
      const speed: number = impulse * input.speedPerImpulse;
      recipe.motion.wind = {
        x: -receipt.normal.x * speed,
        y: -receipt.normal.y * speed + input.upwardFraction * speed,
        z: -receipt.normal.z * speed,
      };
      const seedDigest: string = autoMovieRenderDigest(
        canonicalizeAutoMovieJson({
          protocol: "automovie.contact-effect.v1",
          id: receipt.id,
          source: receipt.source,
          a: receipt.a,
          b: receipt.b,
          seconds: receipt.seconds,
          point: receipt.point,
          normal: receipt.normal,
          impulse,
          recipe,
        }),
      );
      const zone: string = `contact:${receipt.id}`;
      return materializeCompiledEffects({
        world: {
          effectRecipes: [recipe],
          effectZones: [
            {
              id: zone,
              recipe: recipe.id,
              bounds: { min: { ...receipt.point }, max: { ...receipt.point } },
              seed: Number.parseInt(seedDigest.slice(7, 20), 16),
            },
          ],
        },
        seedOwner: { production: "contact-performance", film: seedDigest },
        fixedStepSeconds: input.fixedStepSeconds,
        cues: [
          {
            id: `impact:${receipt.id}:${recipe.id}`,
            zone,
            start: receipt.seconds,
            end: input.endSeconds,
            intensity: { from: 1, to: 1 },
            event: receipt.id,
          },
        ],
      });
    },
  );
}
