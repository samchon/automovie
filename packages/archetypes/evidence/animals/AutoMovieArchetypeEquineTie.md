# src/animals/AutoMovieArchetypeEquineTie.ts#AutoMovieArchetypeEquineTie.IPhase

## @evidence contracts/development/common.md#meaningful-documentation

Film seconds, seconds and a whole count.

## @evidence contracts/development/design.md#principled-representation

A start, a carry, a count and a turn's time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The tie's and the untie's phases.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineTie.ts#AutoMovieArchetypeEquineTie.ITie

## @evidence contracts/development/common.md#meaningful-documentation

World metres and the phases.

## @evidence contracts/development/design.md#principled-representation

The ring's centre, its bar's axis and radius, the tether and the phases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `layer` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineTie.ts#AutoMovieArchetypeEquineTie.layer

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the output and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The held point by phase: the live hanging place, the carry's share between it and the bar's top, a turn round the bar's axis per wrap, the knot; the line laid to it; the tether measured on the laid span while tied.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A held-point function and one check.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped to the tether.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per sample beyond the line's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `EquineLine`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the ride and the tie.

# src/animals/AutoMovieArchetypeEquineTie.ts#AutoMovieArchetypeEquineTie.end

## @evidence contracts/development/common.md#meaningful-documentation

States the sum.

## @evidence contracts/development/implementation.md#principled-implementation

The carry and the wraps run one after the other.

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
