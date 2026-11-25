# src/posture/HumanQuadraticInteriorSession.ts#HumanQuadraticInteriorSession.ISession

## @evidence contracts/development/common.md#meaningful-documentation

States each member, who sets it and when the caller clears the point.

## @evidence contracts/development/design.md#principled-representation

The first solve's variable and cost scales, the last preparation of the session's data, the solver's n- and m-sized scratch, and the last converged point of a program of the same rows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Set by the solve; the caller clears `point` when its next programs have other rows (a new linearisation).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A point whose sizes are not the next program's is not used; a preparation is reused only on equal data and scaling (`HumanQuadraticPreparation.scaled`).

# src/posture/HumanQuadraticInteriorSession.ts#HumanQuadraticInteriorSession.IPoint

## @evidence contracts/development/common.md#meaningful-documentation

States each member's units and indexing.

## @evidence contracts/development/design.md#principled-representation

The equilibration's inverse applied to every component, so the point reads alike on any scaling.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Saved and read by `save` and `warm` alone.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Sizes are carried so a point of another program is refused.

# src/posture/HumanQuadraticInteriorSession.ts#HumanQuadraticInteriorSession.save

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs' scaling and the result's units.

## @evidence contracts/development/implementation.md#principled-implementation

The equilibration's inverse: `x = D x-bar`, a row's slack and excess over its scale, its multipliers times its scale over the cost's, the relations the scaled conditions hold under.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the variables and one over the ends.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every component is converted; none is rounded or dropped.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n + m).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A conversion.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fresh arrays the session holds until the next save or its caller drops it.

# src/posture/HumanQuadraticInteriorSession.ts#HumanQuadraticInteriorSession.warm

## @evidence contracts/development/common.md#meaningful-documentation

States the conversion, the slack's reading, the shift with its source and when no start is made.

## @evidence contracts/development/implementation.md#principled-implementation

Mehrotra's starting-point shift, which keeps the iterate at least the products' mean away from every bound, applied to a point of the same program's earlier bounds; the rows' equations hold at the start by the slacks' reading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The conversion, the slacks, the shift, the positivity test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The shift's constants are the source's (1.5 and one half); a start that is not interior is refused, never repaired otherwise.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n + Z + m) for Z stored row coefficients.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A starting point only; the solve decides everything from it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Writes only the solve's own arrays.

# src/posture/HumanQuadraticInteriorSession.ts#HumanQuadraticInteriorSession.unscaled

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unscaling.

## @evidence contracts/development/implementation.md#principled-implementation

The equilibration's inverse, a hard row's value held within its interval as the OSQP solve holds it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the variables and one over the rows.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only a hard row's value is held, by its own interval.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n + m).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A conversion.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fresh arrays, the caller's.
