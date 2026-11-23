# src/architecture/AutoMovieDesignPresence.ts#AutoMovieDesignPresence

## @evidence contracts/development/design.md#principled-representation `designLineagePhaseSnapshot` collects the asked phase and its transitive `requires` by breadth-first walk and applies the removed, present, pending precedence against that set; a null phase marks every removal reached.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three closed literals answer one per-phase question, kept apart from the plan-wide lifecycle role so each union has one meaning.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Incomparable branches are reported as `pending` rather than ordered by declaration position or phase name, and an undeclared phase id throws instead of defaulting to the completed work.

## @evidence contracts/development/common.md#meaningful-documentation

States which phases count as completed, the exact precedence among the three values, how incomparable branches are answered, and what asking for no phase means.
