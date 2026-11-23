# src/index.ts#constructAutoMovieOwnedResources

## @evidence contracts/development/implementation.md#principled-implementation

Registers each successfully allocated disposable by identity and transfers the producer result only on success; refusal independently attempts every registered disposer and preserves the primary cause with cleanup failures. Registration must be immediate, and nested child constructors must clean their own pre-return acquisitions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A synchronous construction scope owns rollback only; successful public runtime owners govern later retirement, and external texture/cache resources are not silently enrolled.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not retry disposers, replace native methods or infer resources from final scene attachment; a child or caller that fails to register an acquisition remains an explicit ownership gap rather than being masked by this wrapper.

## @evidence contracts/development/common.md#meaningful-documentation

States first-acquisition registration, result transfer, independent rollback, external-owner exclusions, nested-constructor responsibility and public versus physical-retirement distinction.

## @evidence contracts/development/implementation.md#efficient-algorithms

Set registration is expected constant per unique resource and failed rollback visits R owned resources once, using O(R) references; successful construction runs no disposal traversal.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Identity registration reuses a single retirement entry for the same object within this scope; effectful construction results are not cached across different producer calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds registered resources through synchronous construction and rollback; successful result transfer drops the scope's registry, while failure attempts all release operations. Failed rollback ownership is not retained in a returned recovery handle, so native failure boundaries remain the child/host responsibility.
