import {
  QuadrupedLocomotion,
  createCamel,
  rideQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { animalLocomotionFixture as fixture } from "../internal/animalLocomotionFixture";

/**
 * Clock representation and plan capacity refuse before unsafe event enumeration.
 *
 * The subnormal regression is submitted only to table admission, which never
 * enumerates strides. A finite billion-event clock is likewise constructed only,
 * never played. Public planning tests the capacity boundary and an adjacent
 * two-cycles-per-cell request that would have only4000cycles even if regressed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates representable clock frequency from the explicit one-decision-per-cell plan capacity and states which dangerous inputs are never submitted to event enumeration.
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual table admission on the subnormal clock and actual public ride preparation at and just beyond its fixed-grid capacity, asserting structured refusals and complete inclusive boundary landings.
 * @evidence contracts/development/testing.md#independent-expectations A4s plan with2000declared cells has0.002s cells. The stated one-stride-decision-per-cell policy admits period0.002 and refuses0.001; LF contacts at0 through4s give2001events. A1e-323s clock has nonfinite reciprocal frequency, while1e-9s is representable and must not be rejected as an invented biological floor; its large event plan is never executed.
 * @evidence contracts/development/testing.md#distinguishing-cases Nonfinite derived frequency, finite extremely short author input, exact planner capacity, adjacent over-capacity period and complete endpoints distinguish arithmetic safety and honest capacity from fixture exceptions or blanket biological minimums.
 * @evidence contracts/development/testing.md#execution-ownership A portable synchronous in-memory unit owns its inputs; dangerous clocks reach only non-enumerating admission and the public over-budget control is deliberately bounded even if the guard regresses. No wall-time assertion, renderer or process is used.
 */
export function test_archetype_animal_locomotion_budget(): void {
  const findings: string[] = [];
  fixture.refused(
    findings,
    "subnormal clock frequency is not representable",
    (): unknown =>
      QuadrupedLocomotion.camel({
        pace: [
          {
            speed: 3,
            stride: 1e-323,
            foreStance: Number.MIN_VALUE,
            hindStance: Number.MIN_VALUE,
          },
        ],
      }),
  );
  const fast: ReturnType<typeof QuadrupedLocomotion.camel> =
    QuadrupedLocomotion.camel({
      pace: [{ speed: 3, stride: 1e-9, foreStance: 4e-10, hindStance: 3e-10 }],
    });
  fixture.near(
    findings,
    "finite fast clocks have no invented biological floor",
    fast.gaits.pace!.rows[0]!.stride,
    1e-9,
    0,
  );
  const animal: fixture.Animal = createCamel(
    { ...createCamel.REFERENCE, tempo: 0 },
    73,
  );
  const course: rideQuadruped.ICourse = {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 12 }],
    cruise: 3,
    startSpeed: 3,
    endSpeed: 3,
  };
  const boundary: ReturnType<typeof QuadrupedLocomotion.camel> =
    QuadrupedLocomotion.camel({
      pace: [
        { speed: 3, stride: 0.002, foreStance: 0.0008, hindStance: 0.0007 },
      ],
    });
  const ride: fixture.Ride = rideQuadruped(animal, course, "pace", boundary);
  const count: number = ride.instants.filter(
    (instant: { seconds: number; label: string }): boolean =>
      instant.label === "leftForeOn",
  ).length;
  fixture.near(
    findings,
    "inclusive capacity boundary keeps every landing",
    count,
    2001,
    0,
  );
  if (ride.instants.length > 5 * 2000 + 4 + ride.plan.instants.length)
    findings.push("a fixed-capacity plan exceeded its declared event bound");
  const beyond: ReturnType<typeof QuadrupedLocomotion.camel> =
    QuadrupedLocomotion.camel({
      pace: [
        { speed: 3, stride: 0.001, foreStance: 0.0004, hindStance: 0.0003 },
      ],
    });
  fixture.refused(
    findings,
    "two stride decisions per cell exceed capacity",
    (): unknown => rideQuadruped(animal, course, "pace", beyond),
  );
  TestValidator.equals(
    "representable clocks and bounded phase-plan enumeration",
    findings,
    [],
  );
}
