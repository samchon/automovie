# src/geometry/AutoMovieQuaternionTuple.ts#AutoMovieQuaternionTuple

## @evidence contracts/development/design.md#principled-representation

Four ordered unitless components represent a rotation with a unit-norm premise that TypeScript cannot enforce.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Human skeleton transforms and their numerical helpers share the tuple; the object contract is not replaced by a cast.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No default identity, automatic normalization, fixed bone or implicit frame conversion is promised.

## @evidence contracts/development/common.md#meaningful-documentation

States component order, norm and sign semantics, field-owned frames, mutability and caller validation responsibility.
