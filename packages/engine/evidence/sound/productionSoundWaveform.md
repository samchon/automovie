# src/sound/productionSoundWaveform.ts#productionSoundWaveform

## @evidence contracts/development/implementation.md#principled-implementation

Each horizontal bin uses the maximum absolute stereo sample, mapped to a centre-symmetric radius by the original display scale. Tiny canvases use zero available half-height and row endpoints clip to the admitted viewport; PCM itself is unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared raster admission owns finite stereo/dimensions, while this drawer owns peak bins, background and bounded pixel writes; its repository consumers remain tests rather than a PNG or film-runtime host.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-finite samples throw instead of becoming silent evidence. Large finite peaks saturate only the pixel viewport, and empty PCM draws the existing centreline rather than inventing audio samples.

## @evidence contracts/development/common.md#meaningful-documentation

States interleaved stereo, arbitrary finite amplitude, positive pixel dimensions, tiny-height centreline and fresh RGBA ownership; byte drawing is not PCM provenance or delivered evidence adoption.

## @evidence contracts/development/implementation.md#efficient-algorithms

N PCM values plus W by H pixels take O(N+WH) admission/bin/background/bounded-bar work and 4WH output bytes; no peak can induce traversal outside those H rows.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One peak and radius serve each column, while the shared admission owner prevents divergent dimension/shape policies; changed PCM or dimensions are redrawn without a retained result cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the fresh raster buffer, temporaries are scalar and allocation failure propagates; no audio, encoder, GPU or host resource is retained.
