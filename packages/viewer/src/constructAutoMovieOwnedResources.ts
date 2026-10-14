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
 * @evidence contracts/common.md#principled-implementation Registers each successfully allocated disposable by identity and transfers the producer result only on success; refusal independently attempts every registered disposer and preserves the primary cause with cleanup failures. Registration must be immediate, and nested child constructors must clean their own pre-return acquisitions.
 * @evidence contracts/common.md#clear-and-simple-design A synchronous construction scope owns rollback only; successful public runtime owners govern later retirement, and external texture/cache resources are not silently enrolled.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not retry disposers, replace native methods or infer resources from final scene attachment; a child or caller that fails to register an acquisition remains an explicit ownership gap rather than being masked by this wrapper.
 * @evidence contracts/common.md#meaningful-documentation States first-acquisition registration, result transfer, independent rollback, external-owner exclusions, nested-constructor responsibility and public versus physical-retirement distinction.
 * @evidence contracts/performance.md#efficient-algorithms Set registration is expected constant per unique resource and failed rollback visits R owned resources once, using O(R) references; successful construction runs no disposal traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Identity registration reuses a single retirement entry for the same object within this scope; effectful construction results are not cached across different producer calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds registered resources through synchronous construction and rollback; successful result transfer drops the scope's registry, while failure attempts all release operations. Failed rollback ownership is not retained in a returned recovery handle, so native failure boundaries remain the child/host responsibility.
 */
export function constructAutoMovieOwnedResources<Value>(
  construct: (own: <Resource extends { dispose(): void }>(resource: Resource) => Resource) => Value,
): Value {
  const owned: Set<{ dispose(): void; }> = new Set<{ dispose(): void }>();
  try {
    return construct(<Resource extends { dispose(): void }>(resource: Resource): Resource => {
      owned.add(resource);
      return resource;
    });
  } catch (error) {
    return restoreAutoMovieRenderModeState(
      [...owned].map((resource: { dispose(): void; }): () => void => (): void => resource.dispose()),
      { error },
    );
  }
}
