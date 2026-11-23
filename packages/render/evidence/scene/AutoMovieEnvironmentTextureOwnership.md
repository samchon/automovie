# src/scene/AutoMovieEnvironmentTextureOwnership.ts#AutoMovieEnvironmentTextureOwnership

## @evidence contracts/development/design.md#principled-representation

Texture identity establishes exclusive scene ownership, while observed capacity and conversion-input tuples distinguish reuse from replacement; failed disposal leaves authority unknown and prepare-observed capacity drift marks wrapper/Source validity as described above, without intercepting every external property write.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Scene ownership stays separate from cache allocation authority because a scene owns conversion retirement while a cache owns original and issued wrappers; receipts acknowledge only that wrapper's supported transition.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shared LTC textures are refused because RectAreaLightUniformsLib owns them; material aliases are detected through real scene slots, uniforms and plain nested records without replacing SDK methods or inspecting native handles.

## @evidence contracts/development/common.md#meaningful-documentation

Describes exclusive wrapper handoff, immutable capacity, failure uncertainty and the limited same-capacity acknowledgement available to cache-issued clones; public methods state their read or mutation effects.

# src/scene/AutoMovieEnvironmentTextureOwnership.ts#AutoMovieEnvironmentTextureOwnership.material

## @evidence contracts/development/implementation.md#principled-implementation

Refuses a previously scene-claimed texture wrapper before registering it as material-owned, preserving exclusive mutation of conversion inputs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Registration records ownership only; material sampling and scene conversion remain with their respective callers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Wrapper identity decides the refusal, without relying on labels, UUIDs or consumer-specific exemptions.

## @evidence contracts/development/common.md#meaningful-documentation

States the scene-versus-material alias conflict that causes this registration to throw.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One WeakMap membership check and WeakSet insertion require no traversal strategy.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Repeated material registration of the same wrapper shares its WeakSet membership without allocating duplicate records.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The weak material registry does not keep wrappers alive after their actual material or cache owners release them.

# src/scene/AutoMovieEnvironmentTextureOwnership.ts#AutoMovieEnvironmentTextureOwnership.prepare

## @evidence contracts/development/implementation.md#principled-implementation

Checks scene/material aliasing and immutable capacity before retiring cached conversions; only successful same-capacity allocation acknowledgement publishes a known configured tuple, and failure leaves authority unknown.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns conversion lifecycle before applySceneEnvironment changes scene fields, delegating issued-wrapper history to allocation receipts instead of duplicating cache ownership.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses shared LTC tables and current material references because their owners need independent wrappers; changed capacity is rejected rather than laundered through repeated disposal.

## @evidence contracts/development/common.md#meaningful-documentation

Describes the pre-scene-mutation claim; class documentation details immutable capacity, dedicated ownership and failed retirement effects.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans scene materials and nested plain uniform records for actual aliases, then compares fixed-size capacity and conversion tuples; recursive seen sets terminate cyclic records.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Returns without disposal when installed capacity/inputs match and allocation authority confirms stability; the new colorSpace argument is not separately compared on that path. applySceneEnvironment derives it from the unchanged component type, while a direct caller requesting another decoding must not assume that argument alone refreshes the wrapper.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Installs one texture-owned invalidation listener on first claim, uses weak registry keys and disposes previous cube/PMREM storage before changing mapping or decoding.

# src/scene/AutoMovieEnvironmentTextureOwnership.ts#AutoMovieEnvironmentTextureOwnership.current

## @evidence contracts/development/implementation.md#principled-implementation

Owned authority requires a known matching capacity and conversion tuple with no material alias; unowned equirectangular mappings remain unknown because no scene owner certified their conversion history.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A boolean observation lets readAutoMovieTextureSource combine environment and cache authority without exposing mutable ownership records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Sources marked invalid by prepare stay unknown after property restoration; this query only reads current tuples and does not itself remember a mismatch or prove that no intermediate external mutation occurred.

## @evidence contracts/development/common.md#meaningful-documentation

Explicitly promises an observation without metadata writes, texture mutation or GPU lifetime changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Unowned textures need fixed membership/mapping checks; owned textures compare constant-size tuples and scan current scene materials only after those checks succeed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Scene material graphs can change between observations, so alias detection reads current state instead of caching a boolean.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Authority observation acquires no resources and retains no additional texture, scene or tuple after return.
