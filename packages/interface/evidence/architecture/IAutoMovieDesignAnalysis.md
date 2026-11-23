# src/architecture/IAutoMovieDesignAnalysis.ts#IAutoMovieDesignAnalysis

## @evidence contracts/development/design.md#principled-representation

For candidates claimed by an observed outcome, `validateDesignReference` checks primitive frames against the analysis frame and refuses duplicate claims. Unclaimed candidates remain valid records and are withheld during promotion; the gate verifies authored links, not that an attempt executed or that its claimed marks occur in the asset.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The attempt names its frame and label and delegates what it produced to the outcome union, so the observed, unsupported, and not-run cases need no optional fields here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A candidate built from marks on another frame, or claimed by a second analysis, is refused by name instead of being re-attributed, and cross-sheet correlation is left to authored evidence.

## @evidence contracts/development/common.md#meaningful-documentation

States that failed attempts are recorded too, the one-frame and one-claimant rules for candidates, the id's uniqueness scope, that the frame must resolve in the same document, and that the label is non-blank.
