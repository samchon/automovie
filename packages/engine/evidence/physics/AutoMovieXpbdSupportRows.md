# src/physics/AutoMovieXpbdSupportRows.ts#AutoMovieXpbdSupportRows.collect

## @evidence contracts/development/common.md#meaningful-documentation

States what is collected and in which order.

## @evidence contracts/development/implementation.md#principled-implementation

Mirtich 1996 point rows and patch friction; Catto 2006 touching points.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the manifolds: points, then the patch's tangential rows.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A patch with no point touching is skipped; nothing is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The contacts are new every substep.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh rows; retains nothing.

# src/physics/AutoMovieXpbdSupportRows.ts#AutoMovieXpbdSupportRows.impulse

## @evidence contracts/development/common.md#meaningful-documentation

States the impulse and its layout.

## @evidence contracts/development/implementation.md#principled-implementation

A force d at r is (r x d, d).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One spatial impulse.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure computation over its argument.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh array; retains nothing.

# src/physics/AutoMovieXpbdSupportRows.ts#AutoMovieXpbdSupportRows.along

## @evidence contracts/development/common.md#meaningful-documentation

States what is read.

## @evidence contracts/development/implementation.md#principled-implementation

The row's functional is its own unit impulse, so K is symmetric.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One dot product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure computation over its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
