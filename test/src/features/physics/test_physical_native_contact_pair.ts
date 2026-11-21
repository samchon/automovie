import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePhysicalProfile,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { nclose } from "../internal/nclose";

/**
 * Attribute a rigid contact to the surface that actually received it.
 *
 * Scenarios:
 * 1. A centered sphere reaches the target, producing one ordered episode with
 *    the target's surface, arrival time, normal and transferred momentum.
 * 2. A nearer fixed sphere receives the contact instead and the target stays
 *    still.
 * 3. A transverse gap creates neither a receipt nor target motion.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public fixed-step simulation and checks actual contact receipts and receiver velocities. Wrong attribution, geometry-only receipts, missing samples and excess or missing transferred impulse are observable in those results.
 * @evidence contracts/development/testing.md#independent-expectations Straight motion before contact gives arrival from the starting center gap less the two radii divided by speed. A unit-mass receiver gives its impulse from the observed velocity change. The time allowance spans two cached intervals, and the momentum allowance covers native float32 rounding. The test measures a central frictionless encounter and makes no continuous-contact claim.
 * @evidence contracts/development/testing.md#distinguishing-cases Moves only the receiver's transverse offset or adds a fixed near obstacle. The first contact pair changes from the target to the obstacle or disappears. The compliant speed sweep belongs to test_physical_compliance.
 * @evidence contracts/development/testing.md#execution-ownership The portable unit test test_physical_native_contact_pair runs the public engine on three in-memory scenes, with native WASM initialized by that entry.
 * @evidence contracts/development/common.md#meaningful-documentation Names the accepted pair, timing, normal and momentum observations, the adjacent blocked and missed cases, and the scope of the timing tolerance.
 */
export async function test_physical_native_contact_pair(): Promise<void> {
  const radius: number = 1 / 8;
  const speed: number = 2;
  const start: number = -3 / 8;
  const end: number = 3 / 8;
  const obstacle: number = -1 / 16;
  const duration: number = 1 / 2;
  const profile: IAutoMoviePhysicalProfile = PhysicalFixtures.sphere(radius);
  const identity: typeof profile.segments[number]["neutral"]["rotation"] = {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
  };
  for (const scenario of ["hit", "blocked", "miss"] as const) {
    const traveler: IAutoMoviePhysicalSimulationInput.IBody =
      PhysicalFixtures.body("a-traveler", profile, duration, {
        position: { x: start, y: 1, z: 0 },
        rotation: identity,
      });
    const target: IAutoMoviePhysicalSimulationInput.IBody =
      PhysicalFixtures.body("b-target", profile, duration, {
        position: { x: end, y: 1, z: scenario === "miss" ? 3 / 8 : 0 },
        rotation: identity,
      });
    const bodies: IAutoMoviePhysicalSimulationInput.IBody[] = [traveler, target];
    if (scenario === "blocked") {
      const stop: IAutoMoviePhysicalSimulationInput.IBody =
        PhysicalFixtures.body("c-stop", profile, duration, {
          position: { x: obstacle, y: 1, z: 0 },
          rotation: identity,
        });
      stop.mode = { kind: "kinematic" };
      bodies.push(stop);
    }
    const input: IAutoMoviePhysicalSimulationInput.IInput =
      PhysicalFixtures.input(bodies, duration);
    input.impulses.push({
      step: 1,
      body: traveler.id,
      bone: "root",
      point: { x: start, y: 1, z: 0 },
      impulse: { x: profile.mass * speed, y: 0, z: 0 },
    });
    const result: IAutoMoviePhysicalSimulation = await Simulation.compute(input);
    const contacts: readonly IAutoMovieContactReceipt[] = result.cache.contacts;
    const targetVelocity: number =
      result.cache.at(duration).bodies[target.id]!.root!.velocity.x;
    if (scenario === "miss") {
      TestValidator.predicate(
        "transverse gap keeps both receipt and target motion absent",
        contacts.length === 0 && nclose(targetVelocity, 0, 1e-6),
      );
      continue;
    }

    const receiver: string = scenario === "blocked" ? "c-stop" : target.id;
    const receiverX: number = scenario === "blocked" ? obstacle : end;
    const arrival: number = (receiverX - start - 2 * radius) / speed;
    TestValidator.equals(`${scenario} has one contact episode`, contacts.length, 1);
    const receipt: IAutoMovieContactReceipt = contacts[0]!;
    TestValidator.predicate(
      `${scenario} reports the actual surface and direction at arrival`,
      receipt.a.body === traveler.id &&
        receipt.a.shape === "surface" &&
        receipt.b.body === receiver &&
        receipt.b.shape === "surface" &&
        receipt.source === "solver" &&
        (receipt.impulse ?? 0) > 0 &&
        receipt.separation <= 0 &&
        nclose(receipt.seconds, arrival, 2 / input.rate) &&
        nclose(receipt.normal.x, 1, 1e-6) &&
        nclose(receipt.normal.y, 0, 1e-6) &&
        nclose(receipt.normal.z, 0, 1e-6) &&
        receipt.samples !== undefined &&
        receipt.samples.length > 0,
    );
    TestValidator.predicate(
      `${scenario} leaves the expected target momentum`,
      scenario === "blocked"
        ? nclose(targetVelocity, 0, 1e-6)
        : targetVelocity > 0 &&
            nclose(profile.mass * targetVelocity, receipt.impulse ?? 0, 1e-4),
    );
  }
}
