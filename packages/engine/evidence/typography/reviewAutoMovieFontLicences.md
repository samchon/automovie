# src/typography/reviewAutoMovieFontLicences.ts#reviewAutoMovieFontLicences

## @evidence contracts/development/common.md#meaningful-documentation

States what is paired, where the decoded records come from, which sources give rows and in what order, the null pairing and the refusal of a source with no decoded record.

## @evidence contracts/development/implementation.md#principled-implementation

A join of the decoded records render produces with the ledger by the source's asset path, the identity the ledger uses; an embedded source has no ledger row, so it gives none.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Engine owns the pure join; render owns decoding and validateTextureAssets owns the licence refusal, so this function only describes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No licence is inferred from the name records and no source is skipped silently; a missing decoded record throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

One map of the ledger by path and one pass over the sources.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure join per call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns new rows with copied names and licences; the inputs are only borrowed.