import { bindProfileGaits } from "@automovie/engine";
import { IAutoMovieProfile, IAutoMovieMotion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

const horse: IAutoMovieProfile = {
  id: "equine",
  name: "horse",
  drivers: [],
  limits: [],
  gaits: [
    {
      name: "walk",
      period: 1,
      limbs: [{ bone: "leftUpperArm", phase: 0, duty: 0.5, amplitude: 25 }],
    },
    {
      name: "trot",
      period: 0.6,
      limbs: [{ bone: "leftUpperArm", phase: 0, duty: 0.4, amplitude: 35 }],
    },
  ],
};

const doorlike: IAutoMovieProfile = {
  id: "hinge",
  name: "door",
  drivers: [],
  limits: [],
};

/**
 * `bindProfileGaits`: synthesise a profile's declarative gait set onto a
 * concrete skeleton. The same profile bound to two different bodies yields each
 * its own clips: one gait set, many bodies.
 *
 * Scenarios:
 *
 * 1. The horse profile bound to a rig produces a clip per named gait, keyed by
 *    name, each targeting that skeleton with its own period and a
 *    profile-scoped id.
 * 2. The same profile bound to a _different_ skeleton retargets every clip onto
 *    the new body: the point of a binding.
 * 3. A profile that declares no gaits (a door) binds to nothing.
 * 4. Duplicate gait names are rejected before one clip overwrites another under
 *    the same profile binding key.
 * 5. Exact gait names that also occur on Object.prototype remain enumerable own clip keys without changing the result's prototype.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls profile binding and asserts clip count, exact keys, skeleton identity, periods and duplicate rejection; reserved property names cannot disappear or change the result prototype.
 * @evidence contracts/testing.md#independent-expectations Declared walk/trot periods1/0.6 and requested skeleton ids determine the output metadata independently; exact unique gait names must index their own generated clips even when JavaScript objects reserve a setter.
 * @evidence contracts/testing.md#distinguishing-cases Two gaits, a second skeleton, no gait, duplicate name and __proto__/constructor/toString names distinguish valid exact-name indexing from overwrite and prototype mutation; gait sampling/clinical formulas belong to gait suites.
 * @evidence contracts/testing.md#execution-ownership Portable unit test discovered as test_motion_profile_gaits; this function owns its cases and directly invokes the binding seam without building or hosting a consumer.
 */
export function test_motion_profile_gaits(): void {
  // 1. bind onto one body
  const onHorse: Record<string, IAutoMovieMotion> = bindProfileGaits(horse, "horse-rig", 4);
  TestValidator.equals(
    "a clip per named gait",
    Object.keys(onHorse).sort((a: string, b: string): number => a.localeCompare(b)),
    ["trot", "walk"],
  );
  TestValidator.equals(
    "clip targets the bound skeleton",
    onHorse.walk!.skeleton,
    "horse-rig",
  );
  TestValidator.predicate(
    "walk keeps its period",
    nclose(onHorse.walk!.duration, 1),
  );
  TestValidator.predicate(
    "trot keeps its period",
    nclose(onHorse.trot!.duration, 0.6),
  );
  TestValidator.equals(
    "clip id is profile-scoped",
    onHorse.trot!.id,
    "equine:trot",
  );

  // 2. same profile, a different body
  const onPony: Record<string, IAutoMovieMotion> = bindProfileGaits(horse, "pony-rig", 4);
  TestValidator.equals(
    "the same profile retargets onto another skeleton",
    onPony.walk!.skeleton,
    "pony-rig",
  );

  // 3. a profile with no gaits
  TestValidator.equals(
    "no gaits → no clips",
    Object.keys(bindProfileGaits(doorlike, "door-rig", 4)).length,
    0,
  );

  // 4. gait names are binding keys, so duplicates are authoring errors
  TestValidator.predicate(
    "duplicate profile gait names throw",
    throwsError(
      (): Record<string, IAutoMovieMotion> =>
        bindProfileGaits(
          {
            ...horse,
            gaits: [
              horse.gaits![0]!,
              {
                name: "walk",
                period: 0.75,
                limbs: [
                  {
                    bone: "leftUpperArm",
                    phase: 0.25,
                    duty: 0.45,
                    amplitude: 30,
                  },
                ],
              },
            ],
          },
          "horse-rig",
          4,
        ),
      "duplicate profile gait name walk",
    ),
  );
  for (const name of ["__proto__", "constructor", "toString"]) {
    const clips: Record<string, IAutoMovieMotion> = bindProfileGaits({ ...horse, gaits: [{ ...horse.gaits![0]!, name }] }, "named-rig", 2);
    TestValidator.equals("exact reserved gait name is an enumerable own key", Object.keys(clips), [name]);
    TestValidator.predicate("gait names preserve ordinary object prototype", (): boolean => Object.getPrototypeOf(clips) === Object.prototype);
    TestValidator.equals("reserved name still owns a real clip", clips[name]!.skeleton, "named-rig");
  }
}
