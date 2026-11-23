# src/architecture/IAutoMovieSurfacePatternResult.ts#IAutoMovieSurfacePatternResult

## @evidence contracts/development/design.md#principled-representation

Co-locates one run's placements, take-off and findings so consumers can trace quantities and findings to occurrence ids. This mutable structural record does not prevent a caller from replacing fields or mixing runs; consumers must preserve its provenance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members: the pattern id, the placements every consumer cites, the quantities over those placements, and the findings, with no derived view a consumer could compute itself.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Defects of a valid declaration are data in `findings` rather than exceptions, so a consumer decides what to tolerate and nothing is silently dropped to make a run pass.

## @evidence contracts/development/common.md#meaningful-documentation

States the determinism across runs, which consumers cite placements by id, that quantities cover exactly the placements, and the order of placements and findings.
