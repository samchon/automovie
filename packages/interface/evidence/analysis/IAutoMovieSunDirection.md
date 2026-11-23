# src/analysis/IAutoMovieSunDirection.ts#IAutoMovieSunDirection

## @evidence contracts/development/common.md#meaningful-documentation

Names the operation it serves; its member documents which context fields are read and why.

## @evidence contracts/development/design.md#principled-representation

A namespace holding the input of `autoMovieSunDirection`, whose result is a plain world vector.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns it for `autoMovieSunDirection`, its only reader.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No result type is added; the world direction reuses `IAutoMovieVector3`.

# src/analysis/IAutoMovieSunDirection.ts#IAutoMovieSunDirection.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States that only `north` and `ground.up` are read, their admission premises, the parallel refusal, and where the position comes from.

## @evidence contracts/development/design.md#principled-representation

The context is narrowed to `north` and `ground` by `Pick`, so the world frame comes from the same record an analysis study validates, and a production staging a sun without a study supplies only those two fields. The parallel case cannot be typed and is refused at runtime.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both fields are read; taking the context's own field types keeps one definition of north and ground.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The `Pick` narrows rather than widens; no cast or optional field is used.
