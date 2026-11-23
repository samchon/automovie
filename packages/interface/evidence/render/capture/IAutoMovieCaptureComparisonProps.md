# src/render/capture/IAutoMovieCaptureComparisonProps.ts#IAutoMovieCaptureComparisonProps

## @evidence contracts/development/design.md#principled-representation

Different or absent backend identities produce side-by-side records instead of numerical pixel differences.

## @evidence contracts/development/design.md#minimal-and-owned-surface

compareAutoMovieCaptureRounds exchanges folder, round, rows, match, tolerance, budget, raster and this round's reduced diagnostics; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Different or absent backend identities produce side-by-side records instead of numerical pixel differences.

## @evidence contracts/development/common.md#meaningful-documentation

Current rows and an already opened reference round for pixel comparison. compareAutoMovieCaptureRounds requires earlier/reference on the folder, pairs according to match, and writes comparison sheets through claimed names. The prose and members document how compareAutoMovieCaptureRounds interprets and admits these values.
