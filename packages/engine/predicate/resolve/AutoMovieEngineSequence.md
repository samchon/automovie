# src/resolve/AutoMovieEngineSequence.ts#AutoMovieEngineSequence.sampleClip

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies finite clip-local seconds, looping, clamping, zero duration and the interpolation modes. It names malformed data and duplicate channels as refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Duration and finite query time are admitted before sampling. The shared clock wraps or clamps, and track-shape admission establishes strides and ascending times before segment selection. Step changes at the interior key, and rotation channels keep their interpolation and normalization. Linear scalar components retain their ordinary subtraction and blend, with endpoint weights used when opposite finite endpoints overflow on subtraction.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass keys and validates each track before reading its neighbouring keys by binary search. Interpolation builds one value vector per channel. The returned map is caller-owned, and the sampler retains no inter-call arrays or track index.
