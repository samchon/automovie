import {
  type ArchetypeRide,
  QuadrupedLocomotion,
  createCamel,
  createDeer,
  createDog,
  rideQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { animalLocomotionFixture as fixture } from "../internal/animalLocomotionFixture";

/** Only the observable timeline fields needed across different contact vocabularies. */
type Timeline = Pick<
  ArchetypeRide.IRide<string, string>,
  "duration" | "instants"
>;

/**
 * Exact declared singleton speeds select their own gait automatically.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names actual camel/deer/dog consumers and exact speed/period pairs, absence of a forced gait and preservation of the unobserved canine speed gap.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual shared ride without a gait argument, with an authored fourth table for camel/deer and registered dog data, then reads successive real left-fore landings.
 * @evidence contracts/development/testing.md#independent-expectations Inclusive authored availability boundaries put the 3 m/s camel at the caller's 1 s pace, the 2/4 m/s deer at 0.6/0.5 s and the 0.9/2.69/4.34 m/s dog at Light 2010's 1.11 s or Choi 2021's representative 0.57/0.45 s; these literals are independent of implementation tables or change-point outputs.
 * @evidence contracts/development/testing.md#distinguishing-cases Exact first faster rows, the previous gait's upper endpoint and a missing 1.5 m/s dog interval distinguish inclusive admission from a broad fallback or an invented interpolation range; existing horse transition units own Froude/mass/overlap behavior.
 * @evidence contracts/development/testing.md#execution-ownership One portable synchronous unit owns actual finite models and six-second plans; each positive case records its own failure and no renderer, registry mutation or process is used.
 */
export function test_archetype_animal_locomotion_auto(): void {
  const findings: string[] = [];
  const camel: ReturnType<typeof createCamel> = createCamel(
    { ...createCamel.REFERENCE, tempo: 0 },
    73,
  );
  const deer: ReturnType<typeof createDeer> = createDeer({ tempo: 0 }, 73);
  const dog: ReturnType<typeof createDog> = createDog(
    { mass: 22, tempo: 0 },
    73,
  );
  const camelTable: ReturnType<typeof QuadrupedLocomotion.camel> =
    QuadrupedLocomotion.camel({
      pace: [{ speed: 3, stride: 1, foreStance: 0.45, hindStance: 0.45 }],
    });
  const deerTable: ReturnType<typeof QuadrupedLocomotion.deer> =
    QuadrupedLocomotion.deer({
      trot: [{ speed: 2, stride: 0.6, foreStance: 0.3, hindStance: 0.3 }],
      gallop: [{ speed: 4, stride: 0.5, foreStance: 0.2, hindStance: 0.2 }],
    });
  const cases: readonly (readonly [string, () => Timeline, number])[] = [
    [
      "camel pace3",
      (): Timeline =>
        rideQuadruped(camel, fixture.course(3), undefined, camelTable),
      1,
    ],
    [
      "deer trot2",
      (): Timeline =>
        rideQuadruped(deer, fixture.course(2), undefined, deerTable),
      0.6,
    ],
    [
      "deer rotary4",
      (): Timeline =>
        rideQuadruped(deer, fixture.course(4), undefined, deerTable),
      0.5,
    ],
    [
      "dog walk.9",
      (): Timeline => rideQuadruped(dog, fixture.course(0.9)),
      1.11,
    ],
    [
      "dog trot2.69",
      (): Timeline => rideQuadruped(dog, fixture.course(2.69)),
      0.57,
    ],
    [
      "dog gallop4.34",
      (): Timeline => rideQuadruped(dog, fixture.course(4.34)),
      0.45,
    ],
  ];
  for (const [label, make, expected] of cases) {
    try {
      const ride: Timeline = make();
      const landings: number[] = ride.instants
        .filter(
          (instant: { seconds: number; label: string }): boolean =>
            instant.label === "leftForeOn" &&
            instant.seconds > 0.5 &&
            instant.seconds < ride.duration - 1,
        )
        .map((instant: { seconds: number }): number => instant.seconds);
      if (landings.length < 2)
        findings.push(`${label}: no complete actual stride`);
      else
        fixture.near(
          findings,
          `${label} auto period`,
          landings[1]! - landings[0]!,
          expected,
          1e-9,
        );
    } catch (error) {
      findings.push(`${label}: ${String(error)}`);
    }
  }
  fixture.refused(
    findings,
    "inclusive boundaries do not invent the dog gap",
    (): unknown => rideQuadruped(dog, fixture.course(1.5)),
  );
  TestValidator.equals(
    "automatic gait at exact declared availability boundaries",
    findings,
    [],
  );
}
