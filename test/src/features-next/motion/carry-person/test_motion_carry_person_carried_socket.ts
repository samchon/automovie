import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeQuadrupedLocomotion,
  createCamel,
  createQuadruped,
  rideQuadruped,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { animalLocomotionFixture as fixture } from "../../../features/internal/animalLocomotionFixture";
import { qclose, vclose } from "../../../features/internal/predicates";

/**
 * The moving head carries its equipment socket and sampling a prepared ride owns its returned transforms.
 *
 * Scenarios:
 * 1. A measured head nod rotates the lead's rest offset with the head.
 * 2. Mutating a returned pose or external clock leaves later independent samples and event times intact.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed head and world socket frame before and after mutation.
 * @evidence contracts/development/testing.md#independent-expectations A rigid head displacement uniquely transforms a fixed lead.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates model rest coordinates, moving head and course placement.
 * @evidence contracts/development/testing.md#execution-ownership Samples a prepared analytic ride.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies socket transport and sample ownership.
 */
export function test_motion_carry_person_carried_socket(): void {
  const animal = createCamel(
    {
      ...createCamel.REFERENCE,
      tempo: 0,
      lead: {
        width: 0.02,
        thickness: 0.003,
        leadLength: 0.6,
        leadRadius: 0.004,
      },
    },
    73,
  );
  const table = AutoMovieArchetypeQuadrupedLocomotion.admit(
    createQuadruped.species(animal).table,
  );
  table.gaits.walk!.nod = { range: 20, timing: "support" };
  const ride = rideQuadruped(animal, fixture.course(1.08), "walk", table);
  const time = 1.137,
    rest = animal.parts.find((p) => p.id === "head")!.transform!,
    snapshot = ride.at(time);
  const head = snapshot.archetype.parts.find(
    (p) => p.id === "head",
  )!.transform!;
  const change = Quaternion.multiply(
      head.rotation,
      Quaternion.inverse(rest.rotation),
    ),
    lead = animal.affordance("lead").frame;
  TestValidator.predicate("nonzero head nod", Math.abs(change.w) < 1 - 1e-8);
  const expected = AutoMovieArchetypeFrame.compose(snapshot.placement, {
    translation: Vector3.add(
      head.translation,
      Quaternion.rotateVector(
        change,
        Vector3.subtract(lead.translation, rest.translation),
      ),
    ),
    rotation: Quaternion.multiply(change, lead.rotation),
    scale: lead.scale,
  });
  const actual = ride.frame("lead", time);
  TestValidator.predicate(
    "head carries both position and orientation",
    vclose(actual.translation, expected.translation, 1e-9) &&
      qclose(actual.rotation, expected.rotation, 1e-12),
  );
  head.translation.x += 1;
  table.gaits.walk!.rows[0]!.stride *= 2;
  ride.at(time + 1);
  const replay = ride.frame("lead", time);
  TestValidator.predicate(
    "published pose and caller table do not alter the prepared ride",
    vclose(replay.translation, expected.translation, 1e-9) &&
      qclose(replay.rotation, expected.rotation, 1e-12),
  );
  const fore = ride.instants.filter((e) => e.label === "leftForeOn");
  TestValidator.predicate(
    "registered walking period",
    Math.abs(fore[2]!.seconds - fore[1]!.seconds - 1.7333333333333336) <= 1e-9,
  );
}
