import {
  ArchetypeRefusal,
  ArchetypeTrack,
  createHatch,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * An eased track carries an articulation from one travel to another on the minimum-jerk profile, as a closer swings a cover shut.
 *
 * Scenarios, for a roof hatch's cover eased shut from its maker's 70 degrees to 0 over 3 s from the film's second 1:
 * 1. It holds 70 before it begins and 0 after it ends, is 35 halfway, and never turns back: each later second's travel is no greater than the one before.
 * 2. It starts and ends at rest: its rate over the first and the last millisecond is under 1e-3 of its mean rate, the minimum-jerk profile's zero velocity at both ends (Flash and Hogan 1985).
 * 3. A launch at 35 degrees comes halfway, at 1.875 times the mean rate, the profile's peak `30 / 16` of it.
 * 4. A travel past the hinge's range and a launch outside the two travels are refused at their fields.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Eases a produced hatch's hinge and reads the travel through seconds; a linear ramp, a track that overshoots or turns back, ends that are not held, or a launch at the wrong instant or rate is caught.
 * @evidence contracts/development/testing.md#independent-expectations The halfway travel, the zero end rates and the peak rate `30/16` are the quintic's own properties, worked by hand: `s^3 (10 - 15 s + 6 s^2)` is 1/2 at 1/2 and its derivative `30 s^2 (1 - s)^2` is 0 at both ends and 30/16 at the middle.
 * @evidence contracts/development/testing.md#distinguishing-cases A closing track, its held ends, a launch, and two refusals.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_track_ease(): void {
  const findings: string[] = [];
  const hatch: ReturnType<typeof createHatch> = createHatch();
  const open: number = hatch.affordance("hinge").travel!;
  const START: number = 1;
  const SECONDS: number = 3;
  const closing: ArchetypeTrack.ITrack<createHatch.Affordance> =
    ArchetypeTrack.ease(hatch, "hinge", {
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
  if (Math.abs(closing.travel(START + SECONDS / 2) - open / 2) > 1e-9)
    findings.push(`halfway the cover is at ${closing.travel(START + SECONDS / 2)} degrees`);
  for (let t: number = START; t < START + SECONDS; t += 0.01)
    if (closing.travel(t + 0.01) > closing.travel(t))
      findings.push(`the cover turns back at ${t} s`);

  // 2. At rest at both ends.
  const mean: number = open / SECONDS;
  const ms: number = 1e-3;
  for (const t of [START, START + SECONDS - ms])
    if (Math.abs(closing.travel(t + ms) - closing.travel(t)) / ms > 1e-3 * mean)
      findings.push(`the cover moves at ${t} s`);

  // 3. The launch.
  if (
    closing.launch === null ||
    Math.abs(closing.launch.seconds - (START + SECONDS / 2)) > 1e-9 ||
    Math.abs(closing.launch.rate + (30 / 16) * mean) > 1e-9
  )
    findings.push(`the launch is ${JSON.stringify(closing.launch)}`);

  // 4. Refusals.
  for (const [field, props] of [
    ["to", { start: 0, from: 0, to: open + 10, seconds: 1 }],
    ["launch", { start: 0, from: open, to: 0, seconds: 1, launch: open + 1 }],
  ] as const) {
    let refused: string | null = null;
    try {
      ArchetypeTrack.ease(hatch, "hinge", props);
    } catch (error) {
      refused = error instanceof ArchetypeRefusal ? error.axis : String(error);
    }
    if (refused !== field)
      findings.push(`a bad ${field} was refused at ${refused}`);
  }
  TestValidator.equals("an eased track closes as a closer does", findings, []);
}
