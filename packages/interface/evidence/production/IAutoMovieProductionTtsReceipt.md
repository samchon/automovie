# src/production/IAutoMovieProductionTtsReceipt.ts#IAutoMovieProductionTtsReceipt

## @evidence contracts/development/design.md#principled-representation

The receipt binds one line's text to a generator request (model, immutable revision, conditioning, inference arguments) and to the exact mono Float32 bytes it produced, on the model-native sample clock. The conditioning union separates a named voice from reference audio, so no receipt can claim both or neither. Sample counts and rates are integers on the source clock; phoneme chunks use the same clock. Admission in ingest checks the remaining invariants against the bytes: text and line identity, the WAVE format, the PCM digest, the sample count, chunk order and range, and the recomputed cache key.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the receipt; ingest's admission and render's sound route consume it, and the sound evidence DTO retains it. The aligner record exists because forced-alignment chunks need their own provenance beside the speech model's. Phonemes, chunks and visemes are optional because most speech models return no phonemes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No generator is named in the type: model and revision are strings, so any model the scaffold recommends fits. Source, license and terms date stay optional descriptive metadata, as before.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the schema epoch, why version 6 cannot be converted, the exact cache-key and PCM-digest formulas, the sample clock and units, the chunk invariants, the aligner's role and the conditioning variants.

# src/production/IAutoMovieProductionTtsReceipt.ts#IAutoMovieProductionTtsReceipt.IConditioning

## @evidence contracts/development/common.md#meaningful-documentation

Each variant names what conditioned the voice: the model's voice name, or the reference audio's digest with its optional verified transcript.

## @evidence contracts/development/design.md#principled-representation

A discriminated union on `mode`, so a receipt records exactly one conditioning; the reference digest uses the `sha256:` form of every other byte identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two modes are the ones the scaffold's speech pages use: a named voice and reference-conditioned cloning, which asks for the reference digest, conditioning mode and transcript.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The union keeps voice and reference fields apart instead of optional fields that could combine into a receipt naming both.
