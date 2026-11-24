import {
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRefusal,
  createHorse,
  rideQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeHorseRide } from "../internal/archetypeHorseRide";

/**
 * The cruising speed, metres per second: inside both the canter's and the
 * gallop's measured ranges, below the declared canter-gallop change point.
 */
const SPEED: number = 7;

/** The cue's film seconds. */
const FROM: number = 4;
const TO: number = 10;

/**
 * The longest canter stride at this height, seconds: the cue's change lands at
 * the first stride start after it.
 */
const STRIDE: number = 0.6;

/**
 * A timed path's named-gait cue asks a cantering horse for the gallop at a
 * speed both gaits share: the change comes at the cue's stride and no planted
 * hoof slides; uncued, the declared change rule keeps the canter; a malformed
 * cue is refused.
 *
 * Scenarios:
 *
 * 1. Uncued at 7 m/s, the hazel horse never changes from canter to gallop.
 * 2. Cued gallop from 4 s to 10 s: `gait:canter-gallop` at the first stride start
 *    at or after 4 s, within one stride, and no planted hoof moves.
 * 3. A cue ending before it starts refuses as an AutoMovieArchetypeRefusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the path, the cue and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public ride's instants and every planted hoof's world position.
 * @evidence contracts/development/testing.md#independent-expectations The change second is the cue's; the slide bound is a planted hoof's exact fixity.
 * @evidence contracts/development/testing.md#distinguishing-cases Uncued, cued and a malformed cue.
 * @evidence contracts/development/testing.md#execution-ownership A memory-only archetype unit.
 */
export function test_archetype_equine_timed_cue(): void {
  const horse = createHorse({}, 1002);
  const plan: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.timed(
    "hazel",
    [
      { seconds: 0, x: 0, z: 0 },
      { seconds: 12, x: 0, z: SPEED * 12 },
    ],
  );
  const issues: string[] = [];
  const changes = (ride: ReturnType<typeof rideQuadruped>): number[] =>
    ride.instants
      .filter((event): boolean => event.label === "gait:canter-gallop")
      .map((event): number => event.seconds);

  const plain = rideQuadruped(horse, plan);
  if (changes(plain).length !== 0)
    issues.push(`uncued, the canter changes at ${changes(plain).join(", ")} s`);

  const cued = rideQuadruped(horse, {
    plan,
    cues: [{ from: FROM, to: TO, gait: "gallop" }],
  });
  const at: number[] = changes(cued);
  if (!(at.length === 1 && at[0]! >= FROM && at[0]! <= FROM + STRIDE))
    issues.push(`cued, the canter changes at [${at.join(", ")}] s`);
  const slide: number = archetypeHorseRide.slide(cued).worst;
  if (!(slide <= 1e-9)) issues.push(`a planted hoof slides ${slide} m`);

  let refusal: unknown;
  try {
    rideQuadruped(horse, {
      plan,
      cues: [{ from: TO, to: FROM, gait: "gallop" }],
    });
  } catch (error) {
    refusal = error;
  }
  if (!(refusal instanceof AutoMovieArchetypeRefusal))
    issues.push(`a backward cue raises ${String(refusal)}`);
  TestValidator.equals("timed gait cue", issues, []);
}
