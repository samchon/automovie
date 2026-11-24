# src/audio/admitProductionTtsReceipt.ts#admitProductionTtsReceipt

## @evidence contracts/development/common.md#meaningful-documentation

The comment lists every refusal and the field it names, the refusal message shape, why ingest owns the admission, and the parameter and result.

## @evidence contracts/development/implementation.md#principled-implementation

A receipt is admitted only when the bytes prove it: the WAVE file is decoded at its own rate, so its samples are its bytes; their little-endian Float32 serialization, which is the mono float `data` chunk, is digested with SHA-256 and compared with `pcmDigest`; the sample count, format and rate come from the decoder's own facts; chunk order and range are checked on the native clock; and the cache key is recomputed with the documented canonical JSON and digest. Parsed JSON is typed only after every field admission reads has been checked, which is the one cast in the function.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Parsing and field typing live in one private helper; WAVE parsing stays with `decodeProductionAudioAsset` and rate conversion with `resampleProductionAudio`, so admission adds only the comparisons the receipt defines.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No receipt, model or rate is special-cased and nothing is defaulted: a missing or mistyped field is refused by name. Only version 7 is admitted, because a version 6 receipt lacks the text and arguments the cache key needs.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the file's samples: one decode, one serialization and one digest pass, plus the conversion when the rates differ; the chunk check is linear in the chunks.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call admits one line from its own bytes; the render route calls it once per line and shares nothing between lines.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The native samples, their serialization and the converted samples are call-owned; the converted samples and the parsed receipt transfer to the caller, and nothing else is retained.
