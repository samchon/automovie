# src/production/sound/IAutoMovieApplyInteriorAcousticResponse.ts#IAutoMovieApplyInteriorAcousticResponse.IProps

## @evidence contracts/development/design.md#principled-representation

samples is finite interleaved Float32 PCM; channels and sampleRate are positive safe integers and complete nonempty sample frames are required. The consumer checks these before response dispatch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

applyAutoMovieInteriorAcousticResponse serves production sound mixing with an existing IAutoMovieProductionAcousticResponse receipt, returning a fresh PCM generation without modifying input.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unavailable responses throw; outdoor copies dry PCM, different-room applies [0,1] transmission gain, and same-room requires positive reverberation time/direct-to-diffuse ratio before its bounded sparse tail.

## @evidence contracts/development/common.md#meaningful-documentation

Interleaved PCM and an admitted room-path response for deterministic mixing. samples is finite interleaved Float32 PCM; channels and sampleRate are positive safe integers and complete nonempty sample frames are required. The consumer checks these before response dispatch.
