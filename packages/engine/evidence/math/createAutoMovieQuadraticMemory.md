# src/math/createAutoMovieQuadraticMemory.ts#createAutoMovieQuadraticMemory

## @evidence contracts/development/implementation.md#principled-implementation

A fresh aligned ArrayBuffer supplies Float64/Int32 views during one synchronous callback. Positive bounded integer requests admit before allocation; active-borrow guards and finally release the owner's references on every completion path.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the numerical iterate's borrowed storage only, while the kernel owns its dimension and the interior solver owns its vector layout and result extraction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses ordinary TypeScript typed arrays without native/WebAssembly imports, ambient services or hidden reuse; invalid requests and recursive borrows refuse before invoking their body.

## @evidence contracts/development/common.md#meaningful-documentation

States request units/range, zero address and initialization, alignment, reentry refusal, exception behavior, getter lifetime and the limits of ordinary retained JS views.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each borrow allocates and initializes O(bytes) storage once, with constant-time getters and no encoded-kernel decoding or module compilation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A borrow intentionally owns fresh state, because no preceding problem may seed the cold solver; no high-water pool is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The owner retains one active borrow at most and releases its own buffer references in finally; result copies or retained callback views are caller-owned and actual reclamation belongs to host GC.
