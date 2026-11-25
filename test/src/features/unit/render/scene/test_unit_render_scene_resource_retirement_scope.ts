import { AutoMovieResourceRetirementScope } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { rejects } from "node:assert/strict";

/**
 * A scope joins retirement requests that arrive while it is waiting and
 * continues to report failed ownership after that attempt.
 *
 * Scenarios:
 *
 * 1. Releasing the same owned object twice starts its retirement once. A failing
 *    operation added during that wait joins the original report.
 * 2. A later settlement reports the same cause without retrying. Repeated close
 *    shares the report and new ownership is refused after close.
 */
export async function test_unit_render_scene_resource_retirement_scope(): Promise<void> {
  const scope: AutoMovieResourceRetirementScope =
    new AutoMovieResourceRetirementScope();
  const resource: object = {};
  const events: string[] = [];
  const finish: (() => void)[] = [];
  const first: Promise<void> = new Promise<void>((resolve) => {
    finish.push(resolve);
  });
  scope.own(resource, (): Promise<void> => {
    events.push("first");
    return first;
  });
  scope.release(resource);
  scope.release(resource);
  const failure: Error = new Error("late resource is still borrowed");
  const joined: Promise<void> = rejects(
    scope.settle(),
    (error: unknown): boolean => error === failure,
  );
  scope.track(async (): Promise<void> => {
    events.push("late");
    throw failure;
  });
  finish[0]!();
  await joined;
  TestValidator.equals("one request per owner", events, ["first", "late"]);

  await rejects(scope.settle(), (error: unknown): boolean => error === failure);
  const closed: Promise<void> = scope.close();
  TestValidator.predicate(
    "close shares one completion",
    scope.close() === closed,
  );
  await rejects(closed, (error: unknown): boolean => error === failure);
  TestValidator.error("closed ownership is refused", (): void =>
    scope.own({}, async (): Promise<void> => {}),
  );
  TestValidator.equals("retained failures were not retried", events, [
    "first",
    "late",
  ]);
}
