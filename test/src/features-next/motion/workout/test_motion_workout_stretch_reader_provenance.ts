import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { createHumanBody } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * Native reader admission inspects body and method identity.
 *
 * Scenarios:
 * 1. A factory body is admitted, and a descriptor copy and a proxy are declined.
 * 2. Each substituted reader declines the body without invoking the getter.
 * 3. Restoring the original reader restores admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the native reader identity premise and the expected behavior for changed descriptors.
 * @evidence contracts/development/testing.md#behavioral-verification Observes the factory's actual ownership predicate for issued bodies, copied descriptors, a proxy and an issued body with a replaced reader.
 * @evidence contracts/development/testing.md#independent-expectations Checks exact identity from the factory and counts whether the supplied accessor runs during detection.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates copied objects, outer reader changes and nested resolver and limb reader changes.
 * @evidence contracts/development/testing.md#execution-ownership Creates a private body and restores each tested descriptor in finally without modifying the shared body fixture.
 */
export function test_motion_workout_stretch_reader_provenance(): void {
  const source: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const body: IAutoMovieMotionHumanBody = createHumanBody(
    source.skeleton,
    source.profile,
  );
  const copy: IAutoMovieMotionHumanBody = Object.create(
    Object.getPrototypeOf(body),
    Object.getOwnPropertyDescriptors(body),
  );
  TestValidator.equals("original actor", createHumanBody.owns(body), true);
  TestValidator.equals("copied descriptors", createHumanBody.owns(copy), false);
  TestValidator.equals(
    "transparent proxy",
    createHumanBody.owns(new Proxy(body, {})),
    false,
  );

  // These are the private actor's overridable public readers. Restore the exact descriptor after each check.
  const check = (owner: object, key: string): void => {
    const before: PropertyDescriptor = Object.getOwnPropertyDescriptor(
      owner,
      key,
    )!;
    let observed: number = 0;
    Object.defineProperty(owner, key, {
      configurable: true,
      get: (): unknown => {
        ++observed;
        return before.value;
      },
    });
    try {
      TestValidator.equals(
        `externally supplied ${key}`,
        createHumanBody.owns(body),
        false,
      );
      TestValidator.equals(`provenance does not evaluate ${key}`, observed, 0);
    } finally {
      Object.defineProperty(owner, key, before);
    }
    TestValidator.equals(`restored ${key}`, createHumanBody.owns(body), true);
  };
  check(body, "poseResolution");
  check(body, "projection");
  check(body, "hanging");
  check(body.poseResolution, "prepareBones");
  check(body.poseResolution, "resolveMap");
  check(body.projection, "joints");
  check(body.projection, "values");
  check(body, "reads");
  check(body.reads, "leftLeg");
  check(body.reads.leftLeg, "1");
  check(body.reads.leftLeg[1], "bones");
  check(body.reads.leftLeg[1], "demand");
  check(body.reads.leftLeg[1].demand, "map");
}
