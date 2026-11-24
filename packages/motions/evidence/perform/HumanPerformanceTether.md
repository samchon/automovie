# src/perform/HumanPerformanceTether.ts#HumanPerformanceTether.span

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

The ends are the props' displayed points; a slack line is the catenary of its length, its parameter by Newton's method.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Ends, length, then the hang.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing point or a nonpositive length refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two frame reads, one articulation read and at most a few Newton steps.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each read is independent.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/perform/HumanPerformanceTether.ts#HumanPerformanceTether.pull

## @evidence contracts/development/common.md#meaningful-documentation

States when the pull applies and what it keeps.

## @evidence contracts/development/implementation.md#principled-implementation

The far point is moved horizontally toward the near end until the line's length reaches it, its height kept.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Lines read from the state's prepared map (`tethered`), the rest test, one translation per line.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A prop a hand or a wear carries is returned as given.

## @evidence contracts/development/implementation.md#efficient-algorithms

A prop with no line costs one map lookup.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads the map the state prepared once from its props (`HumanPerformanceTether.index`) and keeps nothing between reads.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the map is a member of the state.

# src/perform/HumanPerformanceTether.ts#HumanPerformanceTether.stretch

## @evidence contracts/development/common.md#meaningful-documentation

States the reading and its unit.

## @evidence contracts/development/implementation.md#principled-implementation

The ends' distance less the line out, clamped at zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One difference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/perform/HumanPerformanceTether.ts#HumanPerformanceTether.index

## @evidence contracts/development/common.md#meaningful-documentation

States what it groups, by what key, and in which order.

## @evidence contracts/development/implementation.md#principled-implementation

Each declared line belongs to the prop it runs to (`tether.to.prop`), so grouping the props' own lines by that key is the whole index.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the props and their lines; the state calls it once in its constructor, after the props are admitted.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: every declared line is listed, none is filtered.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the number of props plus lines.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the props; its caller keeps the result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned map is the caller's.
