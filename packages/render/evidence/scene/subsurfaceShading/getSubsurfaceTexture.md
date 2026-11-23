# src/scene/subsurfaceShading/getSubsurfaceTexture.ts#getSubsurfaceTexture

## @evidence contracts/development/implementation.md#principled-implementation

Builds numerical quadrature once, packs each entry through Three toHalfFloat and configures linear/clamped red sampling; material ownership registration prevents reuse as an exclusive environment wrapper.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lazy texture owner publishes the lookup consumed by material uniforms without a per-material table allocation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the supported DataTexture interface and real role registration; half-float packing is approximate and sharing does not prove renderer upload or physical native lifetime.

## @evidence contracts/development/common.md#meaningful-documentation

Documents dimensions, storage representation, immutable borrowing and missing module-retirement protocol.

## @evidence contracts/development/implementation.md#efficient-algorithms

First call incurs table quadrature and O(C*B) half packing; later calls return the same wrapper in constant work, retaining C*B half components.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed cosine/blur grid and shader sampling make completed lookup data equivalent across materials; mutating the shared wrapper violates this premise and there is no invalidation/rebuild owner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The module strongly retains one wrapper and its 4096-byte Uint16 data array; renderer-specific native uploads may be multiple and are not bounded or retired by this accessor.
