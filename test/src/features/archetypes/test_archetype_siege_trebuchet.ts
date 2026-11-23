import {
  type AutoMovieArchetype,
  createSiegeEngine,
} from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * A siege engine's arm winds, swings and throws as its sources and its own masses say.
 *
 * Scenarios, for each kind at four seeds:
 * 1. The engine is its source's: a trebuchet Hansen's replica (long arm 5.85 m, short 1.2 m, axle 3.15 m, cocked 32 degrees, a 15 kg stone, Saimre's measurements), a mangonel Tarver's (a 16 ft beam at six to one, 12 ft uprights, a 2.5 kg stone); the bands' provisional marks are `test_archetype_siege_bands`'s.
 * 2. Winding the arm down by its cocked travel turns the winch by the ratio the other way, and every pose from cocked to the reach's end is an admitted model.
 * 3. A trebuchet's counterweight stays plumb (within 0.5 degree) at the cocked travel, level, straight up and the release.
 * 4. After the pin's second the arm rises monotonically from its cocked travel to the release, which it reaches at the throw's second.
 * 5. The stone leaves at the pouch's velocity: the arm's rate there, read off the track by a central difference, times the long arm, square to the arm, within the difference's 1e-3 m/s; and from the pouch's place at that travel.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each kind, articulates its arm and winch, reads its counterweight's tilt, runs its throw and reads the track and the launch; a figure off its source, a winch off its ratio, a tilting box, a swing that falls back before release or a launch off the pouch is caught.
 * @evidence contracts/development/testing.md#independent-expectations The figures are written here from Saimre and Tarver; the pouch's velocity is worked here from the track's own rate by finite difference and the arm's geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases Both kinds, four seeds each, the arm's ends and the release.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_archetype_siege_trebuchet(): void {
  const findings: string[] = [];
  const close = (a: number, b: number, tolerance: number = 1e-9): boolean =>
    Math.abs(a - b) <= tolerance;
  const FT: number = 0.3048;
  const t: Readonly<Partial<Record<createSiegeEngine.Dimension, number>>> =
    createSiegeEngine({ kind: "trebuchet" }, 1).dimensions;
  for (const [name, expected] of [
    ["armLength", 5.85],
    ["shortArm", 1.2],
    ["axleHeight", 3.15],
    ["cocked", 32],
    ["projectile", 15],
  ] as const)
    if (!close(t[name]!, expected))
      findings.push(`trebuchet ${name} is ${t[name]}, not ${expected}`);
  const m: Readonly<Partial<Record<createSiegeEngine.Dimension, number>>> =
    createSiegeEngine({ kind: "mangonel" }, 1).dimensions;
  for (const [name, expected] of [
    ["armLength", (16 * FT * 6) / 7],
    ["shortArm", (16 * FT) / 7],
    ["axleHeight", 12 * FT],
    ["projectile", 2.5],
  ] as const)
    if (!close(m[name]!, expected))
      findings.push(`mangonel ${name} is ${m[name]}, not ${expected}`);
  for (const kind of createSiegeEngine.KINDS)
    for (const seed of [0, 3, 7, 12]) {
      const engine: AutoMovieArchetype<
        createSiegeEngine.Affordance,
        createSiegeEngine.Dimension
      > = createSiegeEngine({ kind }, seed);
      const d: Readonly<Partial<Record<createSiegeEngine.Dimension, number>>> =
        engine.dimensions;
      const label: string = `${kind}@${seed}`;
      const cocked: AutoMovieArchetype<
        createSiegeEngine.Affordance,
        createSiegeEngine.Dimension
      > = engine.articulate({ arm: -d.cocked! });
      if (!close(cocked.travel("winch"), d.winchRatio! * d.cocked!, 1e-6))
        findings.push(
          `${label}: the winch turns ${cocked.travel("winch")}, not the ratio times the cocked travel`,
        );
      for (const arm of [-d.cocked!, 0, 90, d.release!, d.reach!]) {
        const posed: AutoMovieArchetype<
          createSiegeEngine.Affordance,
          createSiegeEngine.Dimension
        > = engine.articulate({ arm });
        if (!validateModel({ model: posed }).success)
          findings.push(`${label}: the arm at ${arm} is refused`);
        if (kind === "trebuchet") {
          const tilt: number =
            posed.travel("arm") + posed.travel("counterweight");
          if (
            Math.abs(tilt) > 0.5 ||
            !(archetypeExtent(posed, "x", ["counterweight"]).size > 0)
          )
            findings.push(
              `${label}: the counterweight tilts ${tilt} degrees at ${arm}`,
            );
        }
      }
      const shot: createSiegeEngine.IThrow = createSiegeEngine.throwAt(
        engine,
        1,
      );
      let last: number = -Infinity;
      for (let k: number = 0; k <= 50; k++) {
        const second: number = 1 + ((shot.second - 1) * k) / 50;
        const arm: number = shot.track.travel(second);
        if (arm < last - 1e-9)
          findings.push(
            `${label}: the arm falls back before release at ${second}`,
          );
        last = arm;
      }
      if (
        !close(shot.track.travel(1), -d.cocked!, 1e-6) ||
        !close(shot.track.travel(shot.second), d.release!, 1e-6)
      )
        findings.push(
          `${label}: the swing runs from ${shot.track.travel(1)} to ${shot.track.travel(shot.second)}`,
        );
      const step: number = 1e-6;
      const rate: number =
        ((shot.track.travel(shot.second + step) -
          shot.track.travel(shot.second - step)) /
          (2 * step)) *
        (Math.PI / 180);
      const a: number = (d.release! * Math.PI) / 180;
      const expected: IAutoMovieVector3 = {
        x: 0,
        y: rate * d.armLength! * Math.cos(a),
        z: -rate * d.armLength! * Math.sin(a),
      };
      if (
        Math.hypot(shot.velocity.y - expected.y, shot.velocity.z - expected.z) >
        1e-3
      )
        findings.push(
          `${label}: the stone leaves at ${JSON.stringify(shot.velocity)}, not the pouch's ${JSON.stringify(expected)}`,
        );
      const pouch: IAutoMovieVector3 = engine
        .articulate({ arm: d.release! })
        .affordance("pouch").frame.translation;
      if (
        Math.hypot(
          pouch.x - shot.origin.x,
          pouch.y - shot.origin.y,
          pouch.z - shot.origin.z,
        ) > 1e-9
      )
        findings.push(`${label}: the stone does not leave from the pouch`);
    }
  TestValidator.equals(
    "a siege engine winds, swings and throws by its own masses",
    findings,
    [],
  );
}
