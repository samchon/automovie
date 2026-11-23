# src/core/AutoMovieArchetypeBand.ts#AutoMovieArchetypeBand

## @evidence contracts/development/common.md#meaningful-documentation

States what a call records.

## @evidence contracts/development/design.md#principled-representation

A constructor for `IAutoMovieArchetypeBand` that keeps the citation beside the numbers at the place they are written.

## @evidence contracts/development/design.md#minimal-and-owned-surface `of`, its shorthand in metres, and the one source text many producers share.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No default source: a band without a citation cannot be written.

# src/core/AutoMovieArchetypeBand.ts#AutoMovieArchetypeBand.of

## @evidence contracts/development/common.md#meaningful-documentation

States each input and the failure.

## @evidence contracts/development/implementation.md#principled-implementation

A record literal behind one ordering check.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One check, one literal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reversed ends throw instead of being swapped.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeBand.ts#AutoMovieArchetypeBand.metres

## @evidence contracts/development/common.md#meaningful-documentation

States that it is `of` in metres and each input.

## @evidence contracts/development/implementation.md#principled-implementation

One call of `of`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing beyond the owner it calls.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `of`, in place of a helper each producer file used to declare.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
