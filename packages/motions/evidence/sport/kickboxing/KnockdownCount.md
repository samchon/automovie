# src/sport/kickboxing/KnockdownCount.ts#KnockdownCount.number

## @evidence contracts/development/common.md#meaningful-documentation

States the timebase, the domain and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

One number per elapsed second from the count's start, the research's reading of the ten-count.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One check and one sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A number outside one to ten throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/sport/kickboxing/KnockdownCount.ts#KnockdownCount.corner

## @evidence contracts/development/common.md#meaningful-documentation

States the choice, the margin and the units.

## @evidence contracts/development/implementation.md#principled-implementation

The farther of the two neutral corners by horizontal distance from the fallen fighter, ties to the first.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two ring corner queries and one comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
