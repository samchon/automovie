# src/resolve/sampleClipSequence.ts#sampleClipSequence

## @evidence contracts/development/implementation.md#principled-implementation

Validate/sample all clips and choose each channel's latest started first key, with later producer order breaking ties and future tracks withholding authority.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

sampleClip owns interpolation while this shared frame/baked-placement/query seam owns cross-clip authority.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Future clips remain validated rather than skipped; clip looping and raw sequence start authority are distinct existing rules.

## @evidence contracts/development/common.md#meaningful-documentation

Docs state finite seconds, per-channel started-key choice and ties rather than whole-clip last-wins.

## @evidence contracts/development/implementation.md#efficient-algorithms

All clip key payloads are validated/sampled before track scans; storage includes every clip map plus channel authority and output maps.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Completed clip samples serve all winning channels; repeated object occurrences are currently resampled before object-key deduplication, a reuse limitation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Winning records escape in a new map; losing samples/authority release with the call and no persistent clip cache, handle or task is held.
