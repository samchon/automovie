import { constructAutoMovieOwnedResources } from "@automovie/render";
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
 */
export function test_unit_render_scene_construct_owned_resources(): void {
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
  const adopted: { dispose(): void } = constructAutoMovieOwnedResources((own) =>
    own(second),
  );
  TestValidator.predicate(
    "transfer keeps the allocated resource",
    adopted === second,
  );
  TestValidator.equals("transfer keeps the resource live", released, []);

  throws(
    (): void => {
      constructAutoMovieOwnedResources((own): never => {
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
