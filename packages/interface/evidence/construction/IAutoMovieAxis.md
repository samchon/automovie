# src/construction/IAutoMovieAxis.ts#IAutoMovieAxis

## @evidence contracts/development/design.md#principled-representation

The axis is the view part's physical-station frame reader, queried in millimetres, with optional qualified analytic derivatives.

## @evidence contracts/development/design.md#minimal-and-owned-surface

ViewPart owns the axis capability; LoftViewWorldJet and axis projection reuse its indexed type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias preserves optional jet availability instead of asserting that every frame reader supplies derivatives.

## @evidence contracts/development/common.md#meaningful-documentation

Names the frame owner, station units and derivative boundary.
