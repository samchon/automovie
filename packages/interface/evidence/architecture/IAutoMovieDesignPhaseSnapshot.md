# src/architecture/IAutoMovieDesignPhaseSnapshot.ts#IAutoMovieDesignPhaseSnapshot

## @evidence contracts/development/design.md#principled-representation `designLineagePhaseSnapshot` validates the lineage, maps each lifecycle to one state against the asked phase plus its transitive prerequisites, and sorts the states with `compareCodeUnits`, so the output depends on the plan and not on array order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The snapshot is the asked phase plus one flat state list; the role and presence rules live in their own union types, and filtering records is left to `designLineageProject` rather than embedded here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Absent subjects are listed with their presence rather than dropped, and the documentation says plainly that no scene, drawing, schedule, or render consumes the snapshot yet instead of implying they agree.

## @evidence contracts/development/common.md#meaningful-documentation

States that every declared subject appears once in code-unit order, who calls the producer today and who does not, and what a null phase means.
