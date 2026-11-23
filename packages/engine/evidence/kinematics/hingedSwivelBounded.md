# src/kinematics/hingedSwivelBounded.ts#hingedSwivelBounded.IScore

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning.

## @evidence contracts/development/design.md#principled-representation

The keys `hingedSwivelAhead` compares.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members the comparator and this search read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None added.

# src/kinematics/hingedSwivelBounded.ts#hingedSwivelBounded.IScore.exact

## @evidence contracts/development/common.md#meaningful-documentation

States what the reader returns and when it is read.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A slot its caller fills; the interface declares it and implements nothing.

# src/kinematics/hingedSwivelBounded.ts#hingedSwivelBounded.IScore.tiebreak

## @evidence contracts/development/common.md#meaningful-documentation

States what the reader returns and when it is read.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A slot its caller fills; the interface declares it and implements nothing.

# src/kinematics/hingedSwivelBounded.ts#hingedSwivelBounded.IBranch

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and owner.

## @evidence contracts/development/design.md#principled-representation

The branch's scorer, its completed work, its refusal and its certified bound.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members, all read by the search.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caches are the articulation's, shared with its full pass.

# src/kinematics/hingedSwivelBounded.ts#hingedSwivelBounded.IBranch.probe

## @evidence contracts/development/common.md#meaningful-documentation

States the argument's unit and the candidate returned.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A slot its caller fills; the interface declares it and implements nothing.

# src/kinematics/hingedSwivelBounded.ts#hingedSwivelBounded.IBranch.bound

## @evidence contracts/development/common.md#meaningful-documentation

States the interval's unit and what the bound is of.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A slot its caller fills; the interface declares it and implements nothing.

# src/kinematics/hingedSwivelBounded.ts#hingedSwivelBounded.sweep

## @evidence contracts/development/common.md#meaningful-documentation

States the order, the stop, why skipped candidates cannot change the choice or a minimum, the fold and the premise.

## @evidence contracts/development/implementation.md#principled-implementation

Branch and bound with a certified lower bound: a candidate whose bound's key (the deviation, or its bucket under a tie width) exceeds an actual legal candidate's exact key is strictly behind it in the lexicographic order (legality first, the deviation's key second), so it is never the sweep's choice and never decides another step's refinement differently. A caller's incumbent stops the visit the same way and is kept only where the choice is legal and no worse than it, so the pruned brackets are strictly behind the choice; otherwise the visit runs without it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Per branch: the refusals, the bounded visit with its exact local-minimum tests, then the sweep-ordered fold.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No step, tolerance, refinement count or score changes; a bound that cannot decide scores the candidate, and a sweep with no legal candidate visits every unrefused step.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bracket-bound read per step admitted by the branch refusal, one more for each neighbour of a visited step, and one sort of at most 360 steps per branch; scoring, refinement and obstruction work run only for the steps the bound cannot exclude. Unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Scored steps and refinements land in the branch's caches, which the articulation's full fallback pass reads again under the same unchanged score.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Per-branch bound and order arrays and one set of minima live until return; candidates go to the caller's caches.
