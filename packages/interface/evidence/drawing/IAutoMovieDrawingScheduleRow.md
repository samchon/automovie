# src/drawing/IAutoMovieDrawingScheduleRow.ts#IAutoMovieDrawingScheduleRow

## @evidence contracts/development/design.md#principled-representation `deriveAutoMovieDrawingSchedule` keys occurrences by a JSON array of kind, model, width, height and basis, sorts each group by its comparator ending in id, numbers rows per kind in row order for the mark, and keeps the first `AUTOMOVIE_DRAWING_SCHEDULE_MAX_MEMBERS` ids of the ascending member list.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shared type columns, a bounded member sample with its remainder, the measurement basis and one place make a row self-sufficient for reading a schedule, while the full per-member data stays in the design.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unmeasured sizes are `null` with basis `unmeasured` instead of zero, and grouping includes the basis so a void-measured type never merges with a leaf-measured one; `place` is always derived, with no reserved absent state.

## @evidence contracts/development/common.md#meaningful-documentation

States the grouping columns and which fields vary per member; members give the mark's derivation and stability, when `model` is `null`, the metre unit and per-subject meaning of the sizes, the member bound and remainder, what each basis measured, and whose place a type row carries.
