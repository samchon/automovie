# src/core/math/IAutoMovieCreateQuadraticMemory.ts#IAutoMovieCreateQuadraticMemory

## @evidence contracts/development/common.md#meaningful-documentation

Synchronous storage borrowing for the quadratic solver's typed-array workspace. Nested contracts define the relevant units, ownership and failure states.

## @evidence contracts/development/design.md#principled-representation

One byte-addressed borrow operation carries the existing heap views and a caller-chosen synchronous result.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The memory factory owns buffer lifetime while numerical kernels own layout and copied output.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Generic result typing does not revoke retained views or make asynchronous callbacks safe.

# src/core/math/IAutoMovieCreateQuadraticMemory.ts#IAutoMovieCreateQuadraticMemory.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Defines byte addressing, synchronous lifetime, recursive refusal, exception propagation and retained-view limitations.

## @evidence contracts/development/design.md#principled-representation

Requests are positive integer byte counts at most 2^32-1; the memory owner rounds to eight-byte alignment and supplies address zero.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The numerical kernel uses one withWorkspace operation and the existing heap contract; generic T carries the caller's extracted result without imposing a numerical layout.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Heap getters reject post-callback access but retained typed arrays cannot be revoked; the type does not prevent returning a Promise or claim memory isolation.
