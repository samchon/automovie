import {
  AutoMoviePhysicalSimulation as Simulation,
  bindPhysicalWorld,
  collectPhysicalSupports as collect,
  trackPhysicalWorld,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMovieFootfallPattern as Pattern,
} from "@automovie/interface";
import RAPIER, { type World } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";
import { vclose } from "../internal/vclose";

/** Independent balance, endpoint and reaction policies retain their own actual patch witnesses.
 *
 * Scenarios:
 * 1. A single endpoint actuator cannot remove three actual contacts from a four-support balance assessment.
 * 2. The same endpoint can declare a different local point and a proximal patch without borrowing balance's floor contacts for reaction.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMoviePhysicalSimulation`, `bindPhysicalWorld`, `collectPhysicalSupports` on in-memory inputs and asserts the returned observations through 4x TestValidator.equals, 1x TestValidator.predicate; 2 numbered scenarios (first: A single endpoint actuator cannot remove three actual contacts from a four-support balance assessment.; last: The same endpoint can declare a different local point and a proximal patch without borrowing balance's floor...). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (4 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 2 numbered scenarios (first: A single endpoint actuator cannot remove three actual contacts from a four-support balance assessment.; last: The same endpoint can declare a different local point and a proximal patch without borrowing balance's floor...), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_support_policy_ownership`, which owns the cases delegated to `PhysicalFixtures`, `PhysicalModelFixtures`, `PhysicalSupportFixtures`, `vclose`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A single endpoint actuator cannot remove three actual contacts from a four-support balance assessment.).
 */
export async function test_physical_support_policy_ownership(): Promise<void> {
  await RAPIER.init();
  for (const proximal of [false, true]) {
    const body: Simulation.IBody = PhysicalSupportFixtures.body(
      PhysicalModelFixtures.quadrupod(),
      1 / 120,
    );
    body.actuation = "internal";
    body.compensateGravity = true;
    const pattern: Pattern = structuredClone(body.balance!.pattern);
    pattern.id = "independent-endpoint";
    pattern.limbs = pattern.limbs.slice(0, 1);
    pattern.limbs[0]!.localPoint = { x: 0.005, y: 0, z: 0 };
    if (proximal) pattern.limbs[0]!.contacts = ["lower-0"];
    body.supportTracking = {
      pattern,
      stiffness: 100,
      damping: 10,
      maximumForce: 100,
      iterations: 0,
    };
    for (const target of body.targets)
      target.supportStrength = { "support-0": 1 };
    const input: Simulation.IInput = PhysicalFixtures.input([body], 1 / 120);
    Object.assign(input, {
      floor: 0,
      gravity: { x: 0, y: -9.81, z: 0 },
      substeps: 8,
      internalIterations: 1,
      contactTolerance: 0.0001,
      contactFrequency: 240,
    });
    Simulation.identity(input);
    const world: World = new RAPIER.World(input.gravity);
    try {
      world.timestep = 1 / 960;
      world.numSolverIterations = input.iterations;
      world.numInternalPgsIterations = input.internalIterations!;
      world.integrationParameters.normalizedPredictionDistance = 0;
      world.integrationParameters.normalizedAllowedLinearError =
        input.contactTolerance!;
      world.integrationParameters.contact_natural_frequency =
        input.contactFrequency!;
      const bound: ReturnType<typeof bindPhysicalWorld> = bindPhysicalWorld(
        world,
        input,
        false,
      );
      for (let tick: number = 1; tick <= 7; tick++) world.step();
      const observe: (owner: Pattern) => ReturnType<typeof collect> = (
        owner: Pattern,
      ): ReturnType<typeof collect> =>
        collect({
          world,
          body: body.id,
          profile: body.profile,
          pattern: owner,
          segments: bound.segments.get(body.id)!,
          colliders: bound.colliders,
          contacts: [],
          seconds: 8 / 960,
          dt: 1 / 960,
        });
      const balance: ReturnType<typeof observe> = observe(
        body.balance!.pattern,
      );
      const endpoint: ReturnType<typeof observe> = observe(pattern);
      TestValidator.equals(
        "all native balance patches remain observed",
        balance.length,
        4,
      );
      TestValidator.equals(
        "reaction only sees its own declared patch",
        endpoint.length,
        proximal ? 0 : 1,
      );
      if (!proximal) {
        const rotation: IAutoMovieQuaternion = bound.segments
          .get(body.id)!
          .get(pattern.limbs[0]!.bone)!
          .rotation();
        const reference: IAutoMovieVector3 = body.balance!.pattern.limbs[0]!
          .localPoint ?? { x: 0, y: 0, z: 0 };
        const delta: IAutoMovieVector3 = {
          x: pattern.limbs[0]!.localPoint!.x - reference.x,
          y: pattern.limbs[0]!.localPoint!.y - reference.y,
          z: pattern.limbs[0]!.localPoint!.z - reference.z,
        };
        const { x, y, z, w }: IAutoMovieQuaternion = rotation;
        TestValidator.predicate(
          "same endpoint policies keep different local-point meanings",
          vclose(endpoint[0]!.position, {
            x:
              balance[0]!.position.x +
              (1 - 2 * (y * y + z * z)) * delta.x +
              2 * (x * y - z * w) * delta.y +
              2 * (x * z + y * w) * delta.z,
            y:
              balance[0]!.position.y +
              2 * (x * y + z * w) * delta.x +
              (1 - 2 * (x * x + z * z)) * delta.y +
              2 * (y * z - x * w) * delta.z,
            z:
              balance[0]!.position.z +
              2 * (x * z - y * w) * delta.x +
              2 * (y * z + x * w) * delta.y +
              (1 - 2 * (x * x + y * y)) * delta.z,
          }),
        );
      }
      const recovery: Parameters<typeof trackPhysicalWorld>[6] = {};
      trackPhysicalWorld(
        world,
        input,
        bound,
        1,
        new Map(),
        [],
        recovery,
        [],
        8 / 960,
      );
      TestValidator.equals(
        "balance uses its complete own floor population",
        recovery[body.id]!.last,
        "supported",
      );
      const reaction: (typeof bound.supportWrenches)[number] =
        bound.supportWrenches[0]!;
      TestValidator.equals(
        "explicit reaction owner cannot borrow another policy's carrier points",
        reaction.pointCount,
        endpoint.reduce(
          (sum: number, support: (typeof endpoint)[number]): number =>
            sum + support.samples.length,
          0,
        ),
      );
    } finally {
      world.free();
    }
  }
}
