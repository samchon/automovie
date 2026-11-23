# src/scene/disposeFadeToBlack.ts#disposeFadeToBlack

## @evidence contracts/development/implementation.md#principled-implementation

Calls the registered fade compositor's one-attempt retirement before WeakMap deletion; a throwing native listener leaves the closed owner/cause registered, so later release cannot report an absent-owner success or reallocate under uncertain lifetime.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns fade registry transfer separately from the class's five-resource release, using the same renderer identity already consumed by the fade draw path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No failure is suppressed, cache entry prematurely erased or physical disposer retried; supported success/no-owner branches depend on actual owner state rather than a fixture renderer.

## @evidence contracts/development/common.md#meaningful-documentation

Gives successful removal, failed-owner closure/retention and later draw refusal instead of promising recovery by discarding an unresolved allocation owner.

## @evidence contracts/development/implementation.md#efficient-algorithms

One renderer lookup and successful delete wrap the class's fixed resource list, constant CPU storage/time apart from those actual native listener operations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the class's memoized disposal outcome for repeats, and success allows later fade to create a separate lifetime; failure never becomes a fresh native retry or a fake quiet-cache completion.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Successful compositor retirement relinquishes this WeakMap owner; failed resource/cause references remain reachable only with the renderer key, and host renderer/context release is still the separate physical lifetime boundary.
