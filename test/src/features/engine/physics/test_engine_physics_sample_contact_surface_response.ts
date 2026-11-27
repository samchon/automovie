import { AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMovieEffectRecipe,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../internal/PhysicalTolerance";

/**
 * Impact consumers keep solver and geometric receipts distinguishable.
 *
 * Scenarios:
 *
 * 1. A solver receipt drives effects and surface marks by its measured impulse,
 *    ignoring a conflicting formula estimate under its id.
 * 2. A geometric receipt has no impulse authority: both consumers refuse it
 *    without an explicit formula estimate and use exactly that estimate when
 *    supplied.
 * 3. A geometric receipt that asserts a solved impulse or completed solver samples
 *    is refused by both consumers.
 */
export function test_engine_physics_sample_contact_surface_response(): void {
  const solver: IAutoMovieContactReceipt = receipt("hit", "solver", 2);
  const geometric: IAutoMovieContactReceipt = receipt(
    "touch",
    "geometric",
    null,
  );
  const findings: string[] = [];

  expect("solver effect", burst(solver, { hit: 7 }), 20);
  expect("solver surface", weight(solver, { hit: 7 }), 0.2);
  expect("geometric effect without estimate", burst(geometric, {}), "refused");
  expect(
    "geometric surface without estimate",
    weight(geometric, {}),
    "refused",
  );
  expect("geometric effect with estimate", burst(geometric, { touch: 3 }), 30);
  expect(
    "geometric surface with estimate",
    weight(geometric, { touch: 3 }),
    0.3,
  );
  for (const forged of [
    { ...geometric, impulse: 2 },
    {
      ...geometric,
      samples: [
        {
          seconds: 1,
          duration: 1 / 120,
          impulse: 2,
          point: geometric.point,
          normal: geometric.normal,
          separation: 0,
          compression: 0,
        },
      ],
    },
  ]) {
    const kind: string = forged.impulse !== null ? "impulse" : "samples";
    expect(`geometric ${kind} effect`, burst(forged, { touch: 3 }), "refused");
    expect(
      `geometric ${kind} surface`,
      weight(forged, { touch: 3 }),
      "refused",
    );
  }
  TestValidator.equals(
    "consumers keep measured and formula impulses apart",
    findings,
    [],
  );

  /** Record a mismatch between an observation and its expectation. */
  function expect(
    label: string,
    actual: number | "refused",
    expected: number | "refused",
  ): void {
    const same: boolean =
      actual === "refused" || expected === "refused"
        ? actual === expected
        : Math.abs(actual - expected) <= PhysicalTolerance.ROUNDING;
    if (!same) findings.push(`${label}: ${actual} instead of ${expected}`);
  }

  /** Particle burst of the single effect, or a refusal. */
  function burst(
    contact: IAutoMovieContactReceipt,
    geometricImpulses: Record<string, number>,
  ): number | "refused" {
    try {
      const streams: ReturnType<typeof AutoMovieEnginePhysics.compileImpactEffects> =
        AutoMovieEnginePhysics.compileImpactEffects({
          contacts: [contact],
          geometricImpulses,
          recipe: recipe(),
          endSeconds: 3,
          fixedStepSeconds: 1 / 120,
          particlesPerImpulse: 10,
          speedPerImpulse: 1,
          upwardFraction: 0,
          maximumEffects: 1,
        });
      return streams.length === 1
        ? streams[0]!.recipe.emission.burst
        : streams.length;
    } catch {
      return "refused";
    }
  }

  /** Centred, undecayed surface weight one second after contact, or a refusal. */
  function weight(
    contact: IAutoMovieContactReceipt,
    geometricImpulses: Record<string, number>,
  ): number | "refused" {
    try {
      return AutoMovieEnginePhysics.sampleContactSurfaceResponse({
        contacts: [contact],
        seconds: 2,
        point: contact.point,
        center: (event: IAutoMovieContactReceipt) => event.point,
        radius: 0.5,
        weightPerImpulse: 0.1,
        decaySeconds: Infinity,
        geometricImpulses,
      });
    } catch {
      return "refused";
    }
  }

  /** One contact episode at one second with the given source and impulse. */
  function receipt(
    id: string,
    source: IAutoMovieContactReceipt["source"],
    impulse: number | null,
  ): IAutoMovieContactReceipt {
    return {
      id,
      source,
      seconds: 1,
      endSeconds: 1,
      a: { body: "a", bone: "root", shape: "surface", material: "solid" },
      b: { body: "b", bone: "root", shape: "surface", material: "solid" },
      point: { x: 0, y: 1, z: 0 },
      normal: { x: 1, y: 0, z: 0 },
      impulse,
      separation: 0,
      compression: 0,
    };
  }

  /** A minimal spray recipe with room for every expected burst. */
  function recipe(): IAutoMovieEffectRecipe {
    return {
      id: "spray",
      kind: "spray",
      seed: 1,
      emission: { rate: 0, burst: 1, duration: 1 / 120 },
      particle: {
        lifetime: { min: 1, max: 1 },
        size: { min: 0.02, max: 0.03 },
        color: "#335577",
        opacity: { min: 0.8, max: 0.8, envelope: "constant" },
      },
      motion: { wind: { x: 0, y: 0, z: 0 }, rise: 0, turbulence: 0 },
      budget: { maxParticles: 128, lodDistance: 100 },
      blend: "alpha",
    };
  }
}
