# src/sound/productionPhonemesToVisemes.ts#productionPhonemesToVisemes

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the normalization, the longest-match tokenization through the IPA table, which marks take no share, the refusal and what it names, the equal-share rule with a worked case, and the result's clock.

## @evidence contracts/development/implementation.md#principled-implementation

A chunk reports one interval for its phoneme string, so no phoneme inside it has a measured time; equal shares in spoken order are the least assumption that keeps every phoneme inside its chunk, and finer timing enters only as finer chunks from a forced aligner, as #4054 specifies. Each symbol maps through `AUTOMOVIE_IPA_VISEMES`, which follows place and manner of articulation. Longest match first keeps affricates such as tʃ one phoneme.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Timing and mapping stay in one function because both read the same tokens; film placement belongs to the join, which knows the rates.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No symbol falls back to a default viseme: anything outside the table is refused, naming it. The untimed marks are exactly the stress and length marks #4054 names.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the chunks' code points times the longest table entry (three code points).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its chunks.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It returns fresh records and holds no resource.
