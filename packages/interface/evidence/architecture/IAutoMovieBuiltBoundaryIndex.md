# src/architecture/IAutoMovieBuiltBoundaryIndex.ts#IAutoMovieBuiltBoundaryIndex

## @evidence contracts/development/common.md#meaningful-documentation

Defines partial admission, duplicate identity handling, borrowed face ownership and missing-face behavior.

## @evidence contracts/development/design.md#principled-representation

Readonly collections expose the same boundary-id namespace with a partial face map; they do not imply complete building admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Boundary production and opening consumption share this index with an explicit mutable producer view.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing faces remain missing, and collection readonlyness does not freeze authored face objects.

# src/architecture/IAutoMovieBuiltBoundaryIndex.ts#IAutoMovieBuiltBoundaryIndex.IMutable

## @evidence contracts/development/common.md#meaningful-documentation

States producer ownership while preserving the base's borrowed face records.

## @evidence contracts/development/design.md#principled-representation

Mutable Set and Map refine the base lookup capabilities without changing admission meaning.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Preserves existing producer mutation while opening validation consumes only the base view.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Mutability describes collection operations and does not certify an admitted building.
