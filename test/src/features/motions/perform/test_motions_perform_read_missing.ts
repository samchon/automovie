import {
  HumanPerformanceReadMissing
} from "../../../../../packages/motions/src/perform/internal/HumanPerformanceReadMissing";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanPerformanceReadMissing` refuses a read of a performer or prop the
 * performance does not have, offering the ones it has.
 *
 * Scenarios:
 *
 * 1. A missing performer is a `participant` refusal on the axis `performer`, its
 *    value the name and its alternatives the performers.
 * 2. A missing prop is an `affordance` refusal on the axis `prop`.
 * 3. A given axis replaces the default.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names missing performer and prop refusal kinds, their default axes, available alternatives, and the explicit axis override.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the missing-reference owner with three literal requests and inspects the returned `AutoMovieMotionHumanRefusal` instance, kind, axis, value and alternatives where applicable.
 * @evidence contracts/development/testing.md#independent-expectations The missing performer ghost reports participant on performer and offers a and b. The missing cup reports affordance on prop and offers mug. Supplying target.subject changes only the axis fields asserted for that variant.
 */
export function test_motions_perform_read_missing(): void {
  const performer = HumanPerformanceReadMissing("performer", "ghost", [
    "a",
    "b",
  ]);
  TestValidator.predicate(
    "a missing performer",
    performer instanceof AutoMovieMotionHumanRefusal &&
      performer.kind === "participant" &&
      performer.axis === "performer" &&
      performer.value === "ghost" &&
      performer.feasible?.kind === "alternatives" &&
      performer.feasible.values.join() === "a,b",
  );
  const prop = HumanPerformanceReadMissing("prop", "cup", ["mug"]);
  TestValidator.predicate(
    "a missing prop",
    prop instanceof AutoMovieMotionHumanRefusal &&
      prop.kind === "affordance" &&
      prop.axis === "prop" &&
      prop.value === "cup" &&
      prop.feasible?.kind === "alternatives" &&
      prop.feasible.values.join() === "mug",
  );
  const axis = HumanPerformanceReadMissing(
    "prop",
    "cup",
    [],
    "target.subject",
  );
  TestValidator.predicate(
    "a given axis",
    axis instanceof AutoMovieMotionHumanRefusal &&
      axis.axis === "target.subject" &&
      axis.kind === "affordance",
  );
}
