# src/audio/resampleProductionAudio.ts#resampleProductionAudio

## @evidence contracts/development/common.md#meaningful-documentation

The comment names the method and its source, the output position of each sample, the cutoff relative to the lower Nyquist frequency, the zero edges, the output length and its units; each constant states its value's origin.

## @evidence contracts/development/implementation.md#principled-implementation

Smith and Gossett's bandlimited interpolation: each output sample is the input convolved with a windowed sinc centred on its exact rational position, scaled by the rate ratio when downsampling so the cutoff follows the lower Nyquist frequency. The Kaiser window's shape follows Kaiser's formula `β = 0.1102 (A − 8.7)` for an 80 dB stopband, and its transition width at 32 zero crossings and a 0.9 rolloff follows `Δω = (A − 8) / (2.285 M)`. Input positions are computed as `i × from / to` from safe integers, so the phase is exact up to one double rounding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The decoder calls this converter only when the rates differ; the kernel table is built once at module load, and the per-sample loop only sums table lookups.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The cutoff, zero-crossing count, stopband target and table density are named design parameters with their derivation; none is tuned to a test, and no rate pair is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

Time is the output length times about `2 × 32 / (0.9 × min(1, to/from))` taps; the kernel is read from a 16 386-entry table rather than evaluating a Bessel function per tap. Storage is the output buffer and the fixed table.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call depends only on its arguments; the one shared value is the immutable kernel table, which depends on no input.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The module retains only the fixed kernel table; each call allocates its output, which transfers to the caller, and holds no handle or task.
