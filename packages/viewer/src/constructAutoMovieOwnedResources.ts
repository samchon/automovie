import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Own resources from their first successful allocation until a synchronous
 * producer transfers its complete result. The producer registers each object
 * immediately, including objects not yet attached to its returned scene graph.
 * A refusal attempts every registered resource once by object identity and
 * reports the original construction cause before independent cleanup failures.
 *
 * Only resources created by this producer belong here. Texture resolvers and
 * shared shader producers retain their own wrappers and tables. Completion of
 * a public disposal call does not certify physical GPU retirement. Nested
 * constructors register a child's resources only after that child succeeds;
 * the child owns its own refusal, preventing duplicate retirement by its parent.
 */
export function constructAutoMovieOwnedResources<Value>(
  construct: (own: <Resource extends { dispose(): void }>(resource: Resource) => Resource) => Value,
): Value {
  const owned = new Set<{ dispose(): void }>();
  try {
    return construct((resource) => {
      owned.add(resource);
      return resource;
    });
  } catch (error) {
    return restoreAutoMovieRenderModeState(
      [...owned].map((resource) => () => resource.dispose()),
      { error },
    );
  }
}
