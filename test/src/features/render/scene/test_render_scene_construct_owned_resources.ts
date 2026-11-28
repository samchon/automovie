import { AutoMovieRenderSceneResource } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { throws } from "node:assert/strict";

/**
 * Synchronous construction owns each allocated resource until transfer.
 *
 * Scenarios:
 *
 * 1. A successful construction returns its resource by identity and leaves it live
 *    for the caller.
 * 2. A refusal visits two resources in allocation order even when the first
 *    disposal fails. Repeated registration does not duplicate disposal, and the
 *    construction and disposal failures retain their original identity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names successful transfer and retirement after construction and disposal failures.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the resource construction owner with controlled objects and callbacks. Checks the returned identity and collected disposal attempts, then captures the original construction and retirement causes.
 * @evidence contracts/development/testing.md#independent-expectations A successful transfer retains the exact allocated object and no recorded disposal. A repeated registration adds no second release. On failure both distinct resources are tried in allocation order even though the first disposer throws.
 */
export function test_render_scene_construct_owned_resources(): void {
  const released: string[] = [];
  const cleanupFailure: Error = new Error("cannot release a");
  const constructionFailure: Error = new Error("cannot build");
  const first: { dispose(): void } = {
    dispose(): void {
      released.push("first");
      throw cleanupFailure;
    },
  };
  const second: { dispose(): void } = {
    dispose(): void {
      released.push("second");
    },
  };
  const adopted: { dispose(): void } = AutoMovieRenderSceneResource.constructOwnedResources((own) =>
    own(second),
  );
  TestValidator.predicate(
    "transfer keeps the allocated resource",
    adopted === second,
  );
  TestValidator.equals("transfer keeps the resource live", released, []);

  throws(
    (): void => {
      AutoMovieRenderSceneResource.constructOwnedResources((own): never => {
        own(first);
        own(second);
        own(first);
        throw constructionFailure;
      });
    },
    (error: unknown): boolean =>
      error instanceof AggregateError &&
      error.errors.length === 2 &&
      error.errors[0] === constructionFailure &&
      error.errors[1] === cleanupFailure,
  );
  TestValidator.equals("every owned resource is tried once", released, [
    "first",
    "second",
  ]);
}
