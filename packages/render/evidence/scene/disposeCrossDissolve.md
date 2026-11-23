# src/scene/disposeCrossDissolve.ts#disposeCrossDissolve

## @evidence contracts/development/implementation.md#principled-implementation

Retires the actual renderer-keyed compositor before removing ownership; successful release permits a fresh later owner, while failed release retains its closed resource references and original disposal cause rather than producing false success on repetition.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The WeakMap joins existing dissolve draw/release paths to one compositor; this boundary owns registry transfer and the class owns independent resource release/completion sharing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No native disposer is replaced, retried or treated as successful after throwing; absence means no registered owner, while real failed ownership remains observable to subsequent draw/release calls.

## @evidence contracts/development/common.md#meaningful-documentation

States successful-entry removal, fresh later acquisition and failed closed-owner retention/refusal, distinguishing public completion from physical GPU retirement.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performs one WeakMap lookup, one fixed five-resource owner retirement and successful deletion, constant adapter work/storage independent of frames or raster dimensions.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Repeated failed releases reuse the compositor's stored cause without native calls; repeated successful releases see no entry, and a later supported draw creates an independent fresh owner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Renderer-keyed WeakMap retains the failed compositor/resources only while the renderer key is reachable; successful release removes the entry after all public operations fulfill. This primitive neither disposes the renderer nor certifies its physical context lifetime.
