import { AutoMovieHumanBodyLaw } from "@automovie/human";
import type { IAutoMovieHumanParameters } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import PEOPLE from "../../internal/MOTION_HUMAN_PEOPLE.json";
import { nclose } from "../../internal/nclose";

/**
 * A public head input with different maximizing posterior basins at the cranial
 * family's endpoints reaches its prescribed original skin tape.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Requests the ordinary production source's closure and checks the retained course and original guides.
 * @evidence contracts/development/testing.md#independent-expectations The public input provides the tape length. The measuring protocol supplies the front-higher direction. The prepared original supplies the protected landmarks and common guides.
 * @evidence contracts/development/testing.md#distinguishing-cases Continuing from the low endpoint alone misses the other posterior basin and fails before selection. The retained source closes without moving the nasion or the four guide curves.
 * @evidence contracts/development/testing.md#execution-ownership Synchronous CPU test over the existing public parameter file. It requires no skin, capture, or private reference.
 * @evidence contracts/development/common.md#meaningful-documentation Describes the change of basin and the preserved source measurements.
 */
export function test_human_head_tape_posterior_basin(): void {
  const input = PEOPLE["f-average"].params as IAutoMovieHumanParameters;
  const canonical =
    AutoMovieHumanBodyLaw.prepareSources(input).headSource().source;
  const original = canonical.tapeInvariant;
  const closure = canonical.attemptClosure();
  if (closure.state === "failed") throw closure.error;
  if (closure.state !== "succeeded")
    throw new Error("The head's original tape closure was not requested");
  const { tape } = closure.result;
  TestValidator.predicate(
    "front-higher tape reaches the authored circumference",
    () =>
      nclose(
        tape.course.lengthMm,
        original.plan.tape,
        1e-8 * Math.max(1, original.plan.scale),
      ) &&
      tape.course.plane.front[1] > tape.course.plane.back[1] &&
      tape.course.plane.front[1] === original.plan.landmarks.glabella[1],
  );
  TestValidator.predicate(
    "the original caliper guides and lower material remain shared",
    () =>
      tape.part.axis === original.part.axis &&
      tape.part.front === original.part.front &&
      tape.part.side === original.part.side &&
      tape.plan.nasion === original.plan.nasion &&
      tape.plan.landmarks === original.plan.landmarks,
  );
}
