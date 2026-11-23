# src/audio/decodeProductionAudioAsset.ts#decodeProductionAudioAsset

## @evidence contracts/development/implementation.md#principled-implementation

Chunks are found by id in RIFF order with the even-byte pad rule, the format fields are checked against WAVEFORMATEXTENSIBLE's own consistency rules and the KSDATAFORMAT GUID template, samples scale by 1/32768 or read as IEEE floats, and a rate change is delegated to the band-limited windowed-sinc converter `resampleProductionAudio`, whose low-pass cuts below the lower Nyquist frequency at either direction of conversion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One linear pass validates the container, a second folds frames to mono, and the converter runs only when the rates differ; private refusal, chunk and hex helpers keep WAVE parsing local, while production speech probes consume the public decoder's format facts and mono samples.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No file, path or rate is special-cased: every unsupported declaration throws with a field-named reason instead of decoding as the nearest supported layout, and the only constants are the WAVE format tags, speaker masks and GUID tail the Microsoft contract defines.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation cites the WAVEFORMATEXTENSIBLE rules it enforces, lists the supported subset, gives the PCM scale, stereo fold, resampled length and the band-limited conversion, and states the refusal message shape and parameter units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Time follows RIFF chunk headers, source frames times channels and output samples; storage follows source and output frames, each encoded sample is read once through one DataView, and the mono buffer becomes the result when rates match.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The decoder is a pure function of one call's bytes and rate and coordinates no work across requests; any caching of decoded assets would belong to its caller.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The call owns source-frame mono storage and, on resampling, rate-ratio-sized output storage; no product memory budget bounds a requested allocation. Temporary buffers become collectable on return/throw, the returned buffer transfers to its caller, and no raw bytes, handles or tasks are retained.
