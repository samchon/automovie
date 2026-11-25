import {
  HumanPerformanceReadMissing,
  HumanRefusal,
} from "@automovie/motions/internal";
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
 */
export function test_motions_perform_read_missing(): void {
  const performer = HumanPerformanceReadMissing("performer", "ghost", [
    "a",
    "b",
  ]);
  TestValidator.predicate(
    "a missing performer",
    performer instanceof HumanRefusal &&
      performer.kind === "participant" &&
      performer.axis === "performer" &&
      performer.value === "ghost" &&
      performer.feasible?.kind === "alternatives" &&
      performer.feasible.values.join() === "a,b",
  );
  const prop = HumanPerformanceReadMissing("prop", "cup", ["mug"]);
  TestValidator.predicate(
    "a missing prop",
    prop instanceof HumanRefusal &&
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
    axis instanceof HumanRefusal &&
      axis.axis === "target.subject" &&
      axis.kind === "affordance",
  );
}
