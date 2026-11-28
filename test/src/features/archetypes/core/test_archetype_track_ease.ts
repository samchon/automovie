import { AutoMovieArchetypeRefusal, AutoMovieArchetypeTrack, AutoMovieArchetypeHatch } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * An eased track carries an articulation from one travel to another on the minimum-jerk profile, as a closer swings a cover shut.
 *
 * Scenarios, for a roof hatch's cover eased shut from its maker's 70 degrees to 0 over 3 s from the film's second 1:
 * 1. It holds 70 before it begins and 0 after it ends, is 35 halfway, and never turns back: each later second's travel is no greater than the one before.
 * 2. It starts and ends at rest: its rate over the first and the last millisecond is under 1e-3 of its mean rate, the minimum-jerk profile's zero velocity at both ends (Flash and Hogan 1985).
 * 3. A launch at 35 degrees comes halfway, at 1.875 times the mean rate, the profile's peak `30 / 16` of it.
 * 1b. At a quarter and three quarters of the way it is at `53/512` and `459/512` of the closing, the quintic's values there.
 * 1c. Eased open from 0 to the hinge's full travel, the range's own ends are admitted and it ends there.
 * 4. A `to` past the hinge's range, a `from` before it, a duration of 0 or less, a launch outside the two travels, and a launch on a track that does not move are refused at their fields.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States a hatch's direction, held endpoint travel, closing sample trajectory, launch instant and refusal axes.
 * @evidence contracts/development/testing.md#behavioral-verification Samples the real hatch's eased hinge track and reads its launch result. Boundary samples, both directions and invalid travel, duration and launch cases distinguish the authored trajectory from a linear ramp or premature launch.
 * @evidence contracts/development/testing.md#independent-expectations A normalized quintic `s^3 (10 - 15 s + 6 s^2)` gives the quarter and half samples. Its derivative is zero at both ends and `30/16` at the midpoint, which determines the stated finite-difference limits and the launch rate.
 */
export function test_archetype_track_ease(): void {
  const findings: string[] = [];
  const hatch: ReturnType<typeof AutoMovieArchetypeHatch.create> = AutoMovieArchetypeHatch.create();
  const open: number = hatch.affordance("hinge").travel!;
  const START: number = 1;
  const SECONDS: number = 3;
  const closing: AutoMovieArchetypeTrack.ITrack<AutoMovieArchetypeHatch.Affordance> =
    AutoMovieArchetypeTrack.ease(hatch, "hinge", {
      start: START,
      from: open,
      to: 0,
      seconds: SECONDS,
      launch: open / 2,
    });

  // 1. Held ends, the middle, never turning back.
  if (closing.travel(0) !== open || closing.travel(START + SECONDS + 1) !== 0)
    findings.push(
      `the ends hold ${closing.travel(0)} and ${closing.travel(START + SECONDS + 1)} degrees`,
    );
  if (!(Math.abs(closing.travel(START + SECONDS / 2) - open / 2) <= 1e-9))
    findings.push(
      `halfway the cover is at ${closing.travel(START + SECONDS / 2)} degrees`,
    );
  for (let t: number = START; t < START + SECONDS; t += 0.01)
    if (!(closing.travel(t + 0.01) <= closing.travel(t)))
      findings.push(`the cover turns back at ${t} s`);

  // 2. At rest at both ends.
  const mean: number = open / SECONDS;
  const ms: number = 1e-3;
  for (const t of [START, START + SECONDS - ms])
    if (
      !(
        Math.abs(closing.travel(t + ms) - closing.travel(t)) / ms <=
        1e-3 * mean
      )
    )
      findings.push(`the cover moves at ${t} s`);

  // 3. The launch.
  if (
    closing.launch === null ||
    !(Math.abs(closing.launch.seconds - (START + SECONDS / 2)) <= 1e-9) ||
    !(Math.abs(closing.launch.rate + (30 / 16) * mean) <= 1e-9)
  )
    findings.push(`the launch is ${JSON.stringify(closing.launch)}`);

  // 1b. The quintic at the quarter points: s^3 (10 - 15 s + 6 s^2) is 53/512 at 1/4 and 459/512 at 3/4, worked by hand.
  for (const [quarter, share] of [
    [0.25, 53 / 512],
    [0.75, 459 / 512],
  ] as const) {
    const at: number = closing.travel(START + quarter * SECONDS);
    if (!(Math.abs(at - open * (1 - share)) <= 1e-9))
      findings.push(
        `at ${quarter} of the way the cover is at ${at} degrees, ${open * (1 - share)} expected`,
      );
  }

  // 1c. The range's own ends are admitted: the cover eased open from shut to its full travel.
  const opening: AutoMovieArchetypeTrack.ITrack<AutoMovieArchetypeHatch.Affordance> =
    AutoMovieArchetypeTrack.ease(hatch, "hinge", {
      start: 0,
      from: 0,
      to: open,
      seconds: SECONDS,
    });
  if (opening.travel(SECONDS) !== open || opening.launch !== null)
    findings.push(
      `eased open the cover ends at ${opening.travel(SECONDS)} degrees`,
    );

  // 4. Refusals.
  for (const [field, props] of [
    ["to", { start: 0, from: 0, to: open + 10, seconds: 1 }],
    ["from", { start: 0, from: -10, to: 0, seconds: 1 }],
    ["seconds", { start: 0, from: open, to: 0, seconds: 0 }],
    ["seconds", { start: 0, from: open, to: 0, seconds: -1 }],
    ["launch", { start: 0, from: open, to: 0, seconds: 1, launch: open + 1 }],
    ["launch", { start: 0, from: open, to: open, seconds: 1, launch: open }],
  ] as const) {
    let refused: string | null = null;
    try {
      AutoMovieArchetypeTrack.ease(hatch, "hinge", props);
    } catch (error) {
      refused =
        error instanceof AutoMovieArchetypeRefusal ? error.axis : String(error);
    }
    if (refused !== field)
      findings.push(`a bad ${field} was refused at ${refused}`);
  }
  TestValidator.equals("an eased track closes as a closer does", findings, []);
}
