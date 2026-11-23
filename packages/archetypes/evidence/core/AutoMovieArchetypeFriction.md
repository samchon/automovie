# src/core/AutoMovieArchetypeFriction.ts#AutoMovieArchetypeFriction.Material

## @evidence contracts/development/common.md#meaningful-documentation

States each material.

## @evidence contracts/development/design.md#principled-representation

A closed union of the materials the measured pairs name.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; what a part's surface and a body's rest and ground name.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Closed literals, not free text.

# src/core/AutoMovieArchetypeFriction.ts#AutoMovieArchetypeFriction.ICoefficients

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's meaning.

## @evidence contracts/development/design.md#principled-representation

The static and kinetic coefficients as the measurement gives them, a value or a range.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Aliases the shared material catalogue's one friction-record shape, used by builder and part queries.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unsupported pairs and missing kinetic measurements remain explicit; this alias adds no duplicate coefficients.

# src/core/AutoMovieArchetypeFriction.ts#AutoMovieArchetypeFriction.pair

## @evidence contracts/development/common.md#meaningful-documentation

States the order-free lookup and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Coulomb friction between two surfaces is a property of the pair, not of either alone, so the key is the unordered pair.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates to the shared physical material catalogue's unordered lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unmeasured pair is refused rather than given a mean of its materials' other pairs.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function over a constant table.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeFriction.ts#AutoMovieArchetypeFriction.value

## @evidence contracts/development/common.md#meaningful-documentation

States what a range becomes.

## @evidence contracts/development/implementation.md#principled-implementation

A measured range's middle stands for it where one number is carried, as the body's coefficient is.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
