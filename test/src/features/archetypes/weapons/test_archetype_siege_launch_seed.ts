import { type AutoMovieArchetype, AutoMovieArchetypeSiegeEngine } from "@automovie/archetypes";
import { AutoMovieEngineAir } from "@automovie/engine";
import type { IAutoMovieProjectileState } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Standard gravity, metres per second squared. */
const G: number = 9.80665;

/**
 * A throw is deterministic from its pin's second, and a drag-free flight from its launch lands where the closed form puts it.
 *
 * Scenarios, for each kind at three seeds:
 * 1. The same pin second gives the same throw: the same release second, place and velocity, bit for bit.
 * 2. A later pin second shifts the throw whole: the release second by the same delay, the place and the velocity unchanged.
 * 3. The stone's drag-free flight from the launch by the engine's `projectileAt` is on the ground, and at the closed form's landing, `z0 + vz t` at the root of `y0 + vy t - g t^2 / 2 = 0`, within 1 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs each throw twice and late, and flies its stone; a throw that depends on anything but the pin's second, or a launch whose flight misses its closed form, is caught.
 * @evidence contracts/development/testing.md#independent-expectations The landing is worked here in closed form and compared with the engine's `projectileAt`.
 * @evidence contracts/development/testing.md#distinguishing-cases Both kinds, three seeds, two pin seconds.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_siege_launch_seed(): void {
  const findings: string[] = [];
  for (const kind of AutoMovieArchetypeSiegeEngine.KINDS)
    for (const seed of [0, 5, 9]) {
      const engine: AutoMovieArchetype<
        AutoMovieArchetypeSiegeEngine.Affordance,
        AutoMovieArchetypeSiegeEngine.Dimension
      > = AutoMovieArchetypeSiegeEngine.create({ kind }, seed);
      const label: string = `${kind}@${seed}`;
      const a: AutoMovieArchetypeSiegeEngine.IThrow = AutoMovieArchetypeSiegeEngine.throwAt(engine, 2);
      const b: AutoMovieArchetypeSiegeEngine.IThrow = AutoMovieArchetypeSiegeEngine.throwAt(engine, 2);
      const late: AutoMovieArchetypeSiegeEngine.IThrow = AutoMovieArchetypeSiegeEngine.throwAt(
        engine,
        5,
      );
      if (
        a.second !== b.second ||
        JSON.stringify(a.origin) !== JSON.stringify(b.origin) ||
        JSON.stringify(a.velocity) !== JSON.stringify(b.velocity)
      )
        findings.push(`${label}: the same pin second gives another throw`);
      if (
        Math.abs(late.second - a.second - 3) > 1e-9 ||
        JSON.stringify(late.velocity) !== JSON.stringify(a.velocity)
      )
        findings.push(`${label}: a later pin does not shift the throw whole`);
      const { y: y0, z: z0 } = a.origin;
      const { y: vy, z: vz } = a.velocity;
      const t: number = (vy + Math.sqrt(vy * vy + 2 * G * y0)) / G;
      const closed: number = z0 + vz * t;
      const landed: IAutoMovieProjectileState = AutoMovieEngineAir.projectileAt(
        {
          origin: a.origin,
          velocity: a.velocity,
          gravity: { x: 0, y: -G, z: 0 },
        },
        t,
      );
      const z: number = landed.position.z;
      if (Math.abs(landed.position.y) > 0.001)
        findings.push(
          `${label}: the flight is not on the ground at the closed form's landing`,
        );
      if (Math.abs(z - closed) > 0.001)
        findings.push(
          `${label}: the flight lands at ${z}, not the closed form's ${closed}`,
        );
    }
  TestValidator.equals("a throw is the pin second's alone", findings, []);
}
