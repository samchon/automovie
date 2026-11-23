# src/sound/productionSoundSpectrogram.ts#productionSoundSpectrogram

## @evidence contracts/development/implementation.md#principled-implementation

Each column centres one zero-padded stereo-mean window and direct DFT bins 1..127, scales magnitude by128, then maps the declared -100dB display range to RGB. PCM is finite and unchanged during the call; this fixed-bin visualization is not a frequency-estimation or provenance certificate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The drawer owns its window/bin/palette law, and shared admission owns stereo/dimensions/finiteness; identical row bins reuse their column result without introducing an FFT or cross-request cache.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-finite PCM throws, out-of-source window samples are declared zero padding, and the 1e-7 floor belongs to display contrast; no pixel or PCM is adjusted for a fixture. Repository production raster consumption remains unwired.

## @evidence contracts/development/common.md#meaningful-documentation

States 256 samples, Hann denominator255, stereo mean, positive bins and logarithmic palette; sample-rate interpretation belongs to the caller and transcendental rounding is not a cross-host byte guarantee.

## @evidence contracts/development/implementation.md#efficient-algorithms

N input samples and W by H pixels cost O(N+W*256*min(H,127)+WH), with 4WH result bytes and at most min(H,127) scalar levels live for one column; each distinct bin keeps the original summation order.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One computed log level is shared by rows with the same bin and centre, under the fixed PCM generation premise; the map resets for each column and disappears after the call, so changed PCM cannot reuse an earlier request.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the fresh RGBA buffer; per-column maps retain at most127 numeric entries, and allocation/error exit retains no audio, GPU, encoder or host task.
