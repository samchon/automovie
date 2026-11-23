# src/sound/limitAutoMovieTruePeak.ts#limitAutoMovieTruePeak

## @evidence contracts/development/common.md#meaningful-documentation

The comment defines a frame's peak and required gain, the hold, release and attack, why the attack meets each peak's gain by the peak, the 2^−16 aim under the ceiling and the re-measuring passes, the in-place effect, the refusals and the returned dB.

## @evidence contracts/development/implementation.md#principled-implementation

A look-ahead limiter: the required gain is the ceiling over the frame's 4× oversampled peak (BS.1770-5 Annex 2), held at its minimum over the look-ahead by a sliding minimum, released exponentially and averaged over the look-ahead. Each averaged term's hold window contains the frame, so the gain never exceeds the frame's required gain. Interpolants span 24 samples, so a gain that varies inside that span can leave a small overshoot; the output is re-measured and limited again where one remains, which converges because each pass multiplies only frames still over the aim. Float32 products round by at most 2^−24 relative, inside the 2^−16 aim.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The master stage owns when to limit and with which settings; this function owns only the gain computation, so its lengths and ceiling are parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The ceiling and lengths are the caller's; the 2^−16 aim absorbs Float32 rounding and is far below any audible or measurable level difference. The four-pass bound refuses rather than returning a master over its ceiling.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each pass is linear in frames: one peak scan of 144 multiply-adds per frame and one gain pass with a monotone deque. A pass after the first runs only when the previous output still has a peak over the ceiling, and the loop ends at the first scan that finds none.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each pass reads the output of the last, so nothing is equivalent to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

It allocates a per-frame gain array and a work array of frames plus look-ahead, both released on return or throw; the master buffer belongs to the caller.
