# src/core/math/IAutoMovieQuadraticHeap.ts#IAutoMovieQuadraticHeap

## @evidence contracts/development/design.md#principled-representation

Aligned views address one ordinary ArrayBuffer during a synchronous borrow; the owning getters enforce their lifetime and result extraction copies retained numerical values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two element views expose workspace storage without an allocator, runtime instance or numerical transport method.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No native export, WASM memory or hidden solver is exposed; retained ordinary views are documented rather than falsely claimed to be revoked.

## @evidence contracts/development/common.md#meaningful-documentation

States byte/element units, borrow/getter lifetime, retained-view limitation and retirement of the old solve ABI.
