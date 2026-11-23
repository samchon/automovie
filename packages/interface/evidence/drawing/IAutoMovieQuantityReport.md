# src/drawing/IAutoMovieQuantityReport.ts#IAutoMovieQuantityReport

## @evidence contracts/development/design.md#principled-representation

The producer sums footprint areas net of holes, shell/cell formulas, arc-corrected void areas and route lengths, plus element/opening/model-reference counts. Overlapping support patches and cells are added rather than unioned; fixed subject coverage does not establish complete authored geometry. Canonical JSON hashing identifies produced metadata without a source/execution-authenticity guarantee.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The report holds one finding per subject plus the gap list and identity fields; units, bounds and approximations stay on the findings that own them, and gaps reuse the drawing's gap record so one reader handles all three derivations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every subject is present, including zero totals when no owner contributes; known unavailable inputs and unsupported work use named gaps. The fixed gap list is not an exhaustive discovery of every quantity, modelling defect or numerical failure, and canonical encoding can refuse non-finite computed output.

## @evidence contracts/development/common.md#meaningful-documentation

States where quantities come from, the refusals, and why unmeasurable quantities are gaps; members give the fixed subject order and completeness, the gap order, and the digest's coverage.
