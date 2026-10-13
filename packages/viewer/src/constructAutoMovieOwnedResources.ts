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
 *
 * @evidence contracts/common.md#principled-implementation Registers concrete disposable objects before later initialization can fail and uses identity deduplication for shared owned resources.
 * @evidence contracts/common.md#clear-and-simple-design One synchronous allocation transaction serves geometry, material and model producers without changing their public values or signatures.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retires producer-owned resources through their public operations without altering SDK methods or acquiring borrowed textures.
 * @evidence contracts/common.md#meaningful-documentation States registration timing, successful ownership transfer, nested failure, independent cleanup and the native-retirement limit.
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Preserves ownership of partial allocations until successful transfer or observable cleanup.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Preserves construction failure alongside every independent partial-resource cleanup failure.
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
