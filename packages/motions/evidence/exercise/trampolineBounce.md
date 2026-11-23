# src/exercise/trampolineBounce.ts#trampolineBounce.deflection

## @evidence contracts/development/common.md#meaningful-documentation

States the balance solved.

## @evidence contracts/development/implementation.md#principled-implementation

Newton's method on the monotone quartic from a linear guess.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Converges to 1e-9 m.

## @evidence contracts/development/implementation.md#efficient-algorithms

A few iterations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

None needed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/exercise/trampolineBounce.ts#trampolineBounce.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The apex sequence from the energy kept and the push; each contact's deflection from the balance; quarter-sine contacts matching the ballistic speeds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bed, apexes, phases, one writer, contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A higher apex than the push sustains is refused, never clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in bounces; constant work per sample after a phase search.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The leg goal and the exercise key.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains its phases.
