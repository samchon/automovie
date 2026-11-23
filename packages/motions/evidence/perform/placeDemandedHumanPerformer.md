# src/perform/placeDemandedHumanPerformer.ts#placeDemandedHumanPerformer

## @evidence contracts/development/common.md#meaningful-documentation

States what is known without placement, when placement is demanded, the partner within a group placed on demand and held only on a cycle, the cycle across groups and what is left to the caller.

## @evidence contracts/development/implementation.md#principled-implementation

A person's next action cannot begin before its part does, so up to that start the person holds their placed pose; past it the read person's waiting part is placed before the read answers, a depth-first topological order over the reads (lazy, demand-driven placement), a partner of the same group included; only a detected cycle within a group holds the partner at what they had placed, the fixed point of two reads that wait on each other.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One horizon check and one loop over the demand's answers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is read past what is placed except a held pose; an action is placed once, a sequence part resumed only after the leading actions a cycle's demand placed, and a cycle across groups is refused, never broken by a default order.

## @evidence contracts/development/implementation.md#efficient-algorithms

One horizon scan, then at most one demand per waiting part holding the person, each placing that part once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Places through the resolver's own walk.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
