# src/lexicon/HumanCarriedCouplingLoad.ts#HumanCarriedCouplingLoad.load

## @evidence contracts/development/common.md#meaningful-documentation

States what is read and the frame of the distance.

## @evidence contracts/development/implementation.md#principled-implementation

The combined centre of the pair moves `m d / (M + m)` ahead of the bearer's own; the lean that balances it is #3431's moment balance, so this returns exactly its inputs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One mass model, one centre, one difference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The distance is the borne centre's in the bearer's own standing frame, not a constant of the carry.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fitted stance resolution gives the anchor, the centre of mass and the feet; the mass model is the body's own.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the registered key bones when given by the same coupling solve. Other callers resolve the equivalent stance and reuse the body's fixed mass model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function.

# src/lexicon/HumanCarriedCouplingLoad.ts#HumanCarriedCouplingLoad.lean

## @evidence contracts/development/common.md#meaningful-documentation

States the balance, who rides and the angles' senses.

## @evidence contracts/development/implementation.md#principled-implementation

Static balance of a rigid inverted pendulum: the borne body rides the bearer's anchor bone, so the whole pair turns about the feet, and the combined centre `(M c + m s) / (M + m)`, `s` the share-weighted point the bearer's contacts press it at, lies over the pivot once turned by `-atan2(z, y)` forward and `atan2(x, y)` toward the right, its offsets ahead and to the left over its height above the pivot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One standing read, one combined centre, two angles.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The angles are the balance's, never bounded here; a mass no lean of the bearer holds is `bearable`'s refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fitted stance resolution gives the anchor, the centre of mass and the feet; the mass model is the body's own.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The standing read is the one `load` takes; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function.

# src/lexicon/HumanCarriedCouplingLoad.ts#HumanCarriedCouplingLoad.bearable

## @evidence contracts/development/common.md#meaningful-documentation

States the bound and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation `HumanLoad.lean` is null exactly when `m d > M h` for this bearer's share `m` of the borne mass; the feasible borne mass is `M h / |d|` over that share.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One load, one test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The mass is refused, never clamped to the bound.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work after `load`.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `load` and `HumanLoad.lean`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure check.

# src/lexicon/HumanCarriedCouplingLoad.ts#HumanCarriedCouplingLoad.shares

## @evidence contracts/development/common.md#meaningful-documentation

States the law, its degenerate cases, the sign rule and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The vertical reactions of a body at rest on point supports satisfy the force sum and the two horizontal moment balances; among redundant supports the least-norm solution spreads the weight evenly. About the supports' mean the force row is orthogonal to the moment rows, so each share is `1/n` plus the moment part, solved on the two-by-two moment matrix, or on the supports' principal line when that matrix is singular (the pseudo-inverse: a centre off a line of supports cannot be balanced across it, and only its place along the line is). A resting contact pushes only, so the most negative share's support is dropped and the rest solved again, a greedy active set.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The active set and its loop, over one least-norm solve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No share is clamped and renormalised: a support that would pull bears nothing and the rest carry the weight in balance. With the centre outside every subset of the supports the loop ends on fewer supports, down to one that bears it all.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each round is linear in the supports and drops one, so at most n rounds and O(n^2) work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its points.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function; it holds O(n) numbers during the call.
