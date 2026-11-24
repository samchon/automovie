import { createBoat, rowBoat } from "@automovie/archetypes";
import { RigidCarrierSample } from "@automovie/engine";
import { HumanObject } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A rowboat's explicitly bound hull and articulated contacts share its film clock.
 *
 * Scenarios:
 * 1. Still water has holds through departure and strictly after course completion.
 * 2. A swell continues beyond course completion.
 * 3. A wrapped socket callback cannot inherit the source's stationary domain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the owned callbacks and both actual stationary boundaries.
 * @evidence contracts/development/testing.md#behavioral-verification Passes the actual readers to the prop adapter and observes the domains available to the ride.
 * @evidence contracts/development/testing.md#independent-expectations The supplied start and public course duration determine the expected film boundaries independently of the binding.
 * @evidence contracts/development/testing.md#distinguishing-cases Tests both sides of the stopped boundaries, the exact endpoints, moving waves and one opaque wrapper.
 * @evidence contracts/development/testing.md#execution-ownership Builds two small courses and three props in memory.
 */
export function test_motion_ride_rowboat_native_binding(): void {
  const boat: ReturnType<typeof createBoat> = createBoat(
    { kind: "rowboat" },
    2,
  );
  const course: Parameters<typeof rowBoat>[1] = {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 20 }],
    cruise: 1.5,
    acceleration: 0.5,
    deceleration: 0.5,
  };
  const start: number = 6;
  for (const sea of [undefined, { height: 1, seed: 7 }] as const) {
    const ride: ReturnType<typeof rowBoat> = rowBoat(boat, course, { sea });
    const binding: ReturnType<typeof rowBoat.bind> = rowBoat.bind(ride, start);
    const actual: ReturnType<typeof HumanObject.prop> = HumanObject.prop(
      "boat",
      boat,
      binding.motion(0),
      binding.motion,
      binding.point,
    );
    const domains: readonly RigidCarrierSample.IHold[] =
      RigidCarrierSample.holds(actual)!;
    const end: number = start + ride.duration;
    TestValidator.predicate(
      "departure is still the initial clock sample",
      () => domains[0]!.contains(start) && !domains[0]!.contains(start + 0.01),
    );
    TestValidator.predicate(
      "the exact course endpoint is a live sample",
      () =>
        !domains.some((domain: RigidCarrierSample.IHold): boolean =>
          domain.contains(end),
        ),
    );
    TestValidator.predicate(
      "only still water has a terminal hold",
      () =>
        domains.some((domain: RigidCarrierSample.IHold): boolean =>
          domain.contains(end + 1),
        ) ===
        (sea === undefined),
    );

    const wrapped: ReturnType<typeof HumanObject.prop> = HumanObject.prop(
      "other",
      boat,
      binding.motion(0),
      binding.motion,
      (id: string, seconds: number): ReturnType<typeof binding.point> =>
        binding.point(id, seconds),
    );
    TestValidator.predicate(
      "an opaque reader does not inherit a stationary domain",
      () => RigidCarrierSample.holds(wrapped) === undefined,
    );
  }
}
