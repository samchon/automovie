# src/sound/productionPhonemesToVisemes.ts#productionPhonemesToVisemes

## @evidence contracts/development/implementation.md#principled-implementation

Chunk sample fractions map to floor/ceil frame spans, normalized Unicode nonspace code points populate at most one bin per available frame, and vowel groups map to the closed mouth targets; this coarse mapping is not speech recognition or a phonetic coarticulation model.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The owner consumes an already produced phoneme/sample receipt and carries every token's text into an interval, while actor binding and final receipt admission remain separate joins.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nonpositive source duration or frame span returns no intervals, empty phoneme text becomes rest and unknown symbols map to rest; fractional/malformed chunk clocks otherwise remain caller admission premises.

## @evidence contracts/development/common.md#meaningful-documentation

Documents source samples versus film frames, normalization, coarse binning, remainder text retention and empty/rest meanings without claiming synthesized audio provenance.

## @evidence contracts/development/implementation.md#efficient-algorithms

T normalized code points require proportional token/bin traversal and retained text storage; Unicode normalization and repeated concatenation of tail chunks also incur their string-processing costs, which are not bounded here by an independent text budget.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One normalized chunk token list and computed frame span are reused for that chunk's bins; changed chunk timing or frame range is recalculated with no retained phoneme cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns fresh scalar/text viseme rows; chunk objects and source audio are not retained, and no tokenizer model, network or decoder resource is acquired.
