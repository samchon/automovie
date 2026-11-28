import { AutoMovieArchetypeBoat } from "@automovie/archetypes";
import { AutoMovieEngineRigidCarrierSample } from "@automovie/engine";
import { AutoMovieMotionHumanObject } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A rowboat's explicitly bound hull and articulated contacts share its film
 * clock.
 *
 * The test checks both still-water holds and continuing swell. It also checks
 * the clock and socket at a finite negative start, refusal of nonfinite
 * starts and external plans, and loss of holds when a callback is wrapped.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment names both hold cases, the finite negative start, the refused inputs and the wrapped callback.
 * @evidence contracts/development/testing.md#behavioral-verification Builds a stock rowboat and calls the public bind operation on its native and external rides. Both positive-start variants pass the bound callbacks to the performance adapter to read the actual stationary domains.
 * @evidence contracts/development/testing.md#independent-expectations At film second -2 the native course is at zero and one second later it is at course second one. NaN, both infinities and an externally planned ride each refuse with RangeError. The positive-start controls use the explicit start and duration for hold boundaries and require the original callback pair.
 */
export function test_motions_perform_object_rowboat_binding(): void {
  const boat: ReturnType<typeof AutoMovieArchetypeBoat.create> = AutoMovieArchetypeBoat.create(
    { kind: "rowboat" },
    2,
  );
  const course: Parameters<typeof AutoMovieArchetypeBoat.row>[1] = {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 20 }],
    cruise: 1.5,
    acceleration: 0.5,
    deceleration: 0.5,
  };
  const native = AutoMovieArchetypeBoat.row(boat, course);
  const external = AutoMovieArchetypeBoat.row(boat, native.plan);
  for (const [ride, invalid] of [
    [native, NaN],
    [native, Infinity],
    [native, -Infinity],
    [external, 0],
  ] as const)
    TestValidator.predicate(`invalid rowboat binding at ${invalid}`, () => {
      try {
        AutoMovieArchetypeBoat.bind(ride, invalid);
      } catch (error) {
        return error instanceof RangeError;
      }
      return false;
    });

  const earlier = AutoMovieArchetypeBoat.bind(native, -2);
  const atZero = native.at(0).placement;
  TestValidator.equals("a negative start reads the initial placement", earlier.motion(-2), {
    position: atZero.translation,
    rotation: atZero.rotation,
  });
  TestValidator.equals(
    "before a negative start the oar is held at course zero",
    earlier.point("leftHandle", -3),
    native.frame("leftHandle", 0),
  );
  TestValidator.equals(
    "the bound oar advances from the negative start",
    earlier.point("leftHandle", -1),
    native.frame("leftHandle", 1),
  );

  const start: number = 6;
  for (const sea of [undefined, { height: 1, seed: 7 }] as const) {
    const ride: ReturnType<typeof AutoMovieArchetypeBoat.row> = AutoMovieArchetypeBoat.row(boat, course, { sea });
    const binding: ReturnType<typeof AutoMovieArchetypeBoat.bind> = AutoMovieArchetypeBoat.bind(ride, start);
    const actual: ReturnType<typeof AutoMovieMotionHumanObject.prop> = AutoMovieMotionHumanObject.prop(
      "boat",
      boat,
      binding.motion(0),
      binding.motion,
      binding.point,
    );
    const domains: readonly AutoMovieEngineRigidCarrierSample.IHold[] =
      AutoMovieEngineRigidCarrierSample.holds(actual)!;
    const end: number = start + ride.duration;
    TestValidator.predicate(
      "departure is still the initial clock sample",
      () => domains[0]!.contains(start) && !domains[0]!.contains(start + 0.01),
    );
    TestValidator.predicate(
      "the exact course endpoint is a live sample",
      () =>
        !domains.some((domain: AutoMovieEngineRigidCarrierSample.IHold): boolean =>
          domain.contains(end),
        ),
    );
    TestValidator.predicate(
      "only still water has a terminal hold",
      () =>
        domains.some((domain: AutoMovieEngineRigidCarrierSample.IHold): boolean =>
          domain.contains(end + 1),
        ) ===
        (sea === undefined),
    );

    const wrapped: ReturnType<typeof AutoMovieMotionHumanObject.prop> = AutoMovieMotionHumanObject.prop(
      "other",
      boat,
      binding.motion(0),
      binding.motion,
      (id: string, seconds: number): ReturnType<typeof binding.point> =>
        binding.point(id, seconds),
    );
    TestValidator.predicate(
      "an opaque reader does not inherit a stationary domain",
      () => AutoMovieEngineRigidCarrierSample.holds(wrapped) === undefined,
    );
  }
}
