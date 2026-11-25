import { createAutoMovieResourceRetirement } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { rejects } from "node:assert/strict";

/**
 * Resource retirement asks each owner once and waits for all attempts before
 * reporting their original causes in order.
 *
 * Scenarios:
 *
 * 1. A pending owner and a synchronous failure do not prevent a later owner from
 *    starting. Reentrant and later calls share the original completion.
 * 2. The pending owner's failure arrives after a later failure. The report still
 *    lists the primary failure followed by the owners' declared order.
 */
export async function test_render_scene_create_resource_retirement(): Promise<void> {
  const primary: Error = new Error("primary render failure");
  const first: Error = new Error("resource still borrowed");
  const second: Error = new Error("native disposal failed");
  const events: string[] = [];
  const finish: ((error: Error) => void)[] = [];
  const pending: Promise<never> = new Promise<never>((_resolve, reject) => {
    finish.push(reject);
  });
  const retire: () => Promise<never> = createAutoMovieResourceRetirement(
    [
      (): Promise<void> => {
        events.push("first");
        if (events.length === 1)
          TestValidator.predicate(
            "reentrant calls share completion",
            retire() === completion,
          );
        return pending;
      },
      (): never => {
        events.push("second");
        throw second;
      },
      (): void => {
        events.push("third");
      },
    ],
    { error: primary },
  );
  const completion: Promise<never> = retire();
  const reported: Promise<void> = rejects(
    completion,
    (error: unknown): boolean =>
      error instanceof AggregateError &&
      error.errors.length === 3 &&
      error.errors[0] === primary &&
      error.errors[1] === first &&
      error.errors[2] === second,
  );
  await Promise.resolve();
  const started: string[] = [...events];
  finish[0]!(first);
  await reported;
  TestValidator.equals("all owners start before the first settles", started, [
    "first",
    "second",
    "third",
  ]);
  TestValidator.predicate(
    "later calls share completion",
    retire() === completion,
  );
  TestValidator.equals("each owner starts once", events, [
    "first",
    "second",
    "third",
  ]);
}
