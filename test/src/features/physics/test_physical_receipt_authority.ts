import {
  compileImpactEffects,
  sampleContactSurfaceResponse,
} from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMovieEffectRecipe,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Impact consumers keep solver and geometric receipts distinguishable.
 *
 * Scenarios:
 * 1. A solver receipt drives effects and surface marks by its measured impulse, ignoring a conflicting formula estimate under its id.
 * 2. A geometric receipt has no impulse authority: both consumers refuse it without an explicit formula estimate and use exactly that estimate when supplied.
 * 3. A geometric receipt that asserts a solved impulse or completed solver samples is refused by both consumers.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `compileImpactEffects` and `sampleContactSurfaceResponse` on in-memory receipts and observes the particle burst and the surface weight each impulse produces. A consumer that prefers a formula over a measured impulse, promotes geometry to a solved impulse, silently treats a missing estimate as zero, or accepts a geometric receipt carrying solver evidence fails an assertion.
 * @evidence contracts/development/testing.md#independent-expectations The consumers' documented scales give the expectations: the burst is the ceiling of impulse times particles per N s (10 here), and a centred, undecayed surface weight is impulse times weight per N s (0.1 here), so measured 2 N s, formula 3 N s and the conflicting 7 N s give distinct 20, 30 and 70 particles or 0.2, 0.3 and 0.7 weights.
 * @evidence contracts/development/testing.md#distinguishing-cases Pairs each source with and without a formula estimate, adds the conflicting estimate for a solver id, and refuses geometric receipts with an impulse or samples. Native receipt production belongs to test_physical_native_contact_pair; spray transport and stains belong to test_physical_effect_transport; outcome audits belong to test_physical_layers_geometry; contact marks belong to test_mark_contacts.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_receipt_authority`; it starts no simulation, process, viewer or render host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios, naming the receipts, estimates and observed burst and weight.
 */
export function test_physical_receipt_authority(): void {
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
    if (
      typeof actual !== typeof expected ||
      (typeof actual === "number" &&
        Math.abs(actual - (expected as number)) > 1e-12)
    )
      findings.push(`${label}: ${actual} instead of ${expected}`);
  }

  /** Particle burst of the single effect, or a refusal. */
  function burst(
    contact: IAutoMovieContactReceipt,
    geometricImpulses: Record<string, number>,
  ): number | "refused" {
    try {
      const streams: ReturnType<typeof compileImpactEffects> =
        compileImpactEffects({
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
      return sampleContactSurfaceResponse({
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
