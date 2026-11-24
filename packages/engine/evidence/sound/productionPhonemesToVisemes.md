# src/sound/productionPhonemesToVisemes.ts#productionPhonemesToVisemes

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the decomposition, the longest-match tokenization through the IPA table, which marks take no share, which modifiers join the phoneme before them, the refusals and what they name, the equal-share rule with a worked case, and the form each phoneme is reported in.

## @evidence contracts/development/implementation.md#principled-implementation

A chunk reports one interval for its phoneme string, so no phoneme inside it has a measured time; equal shares in spoken order are the least assumption that keeps every phoneme inside its chunk, and finer timing enters only as finer chunks from a forced aligner, as #4054 specifies. Each symbol maps through `AUTOMOVIE_IPA_VISEMES`, which follows place and manner of articulation. The IPA writes aspiration, palatalization, nasalization, syllabicity and similar features as diacritics and modifier letters on a base letter (Handbook of the International Phonetic Association, 1999, section 2), so a code point of Unicode category M, Lm or Sk joins the phoneme before it and keeps its viseme. Decomposing to NFD first separates precomposed letters such as ä and ĩ, which espeak-ng's Japanese table emits, into their base and diacritic. Longest match first keeps affricates such as tʃ and t͡s one phoneme.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Timing and mapping stay in one function because both read the same tokens; film placement belongs to the join, which knows the rates.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No symbol falls back to a default viseme: a symbol outside the table, a modifier with no phoneme before it and a tie bar outside a table entry are refused, naming the symbol. The untimed marks are the stress and length marks #4054 names, the half-length mark and the IPA tone letters, which are suprasegmental and articulate nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the chunks' code points times the longest table entry (three code points); the NFD table is built once at module load.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its chunks.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It returns fresh records and holds no resource.
