# src/sound/createAutoMovieLoudnessMeter.ts#createAutoMovieLoudnessMeter

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the K-weighting stages and their source, the 400 ms block with 75% overlap, unit channel weights and the 3.01 LU mono offset, both gates, the single block for a signal under 400 ms, the true-peak interpolator and the zero flush at `measure`, and the accepted channel counts.

## @evidence contracts/development/implementation.md#principled-implementation

ITU-R BS.1770-5: the Annex 1 48 kHz K-weighting coefficients in direct form I per channel, 100 ms sub-blocks summed into 400 ms blocks on a 100 ms hop, the −70 LUFS absolute and −10 LU relative gates, and `−0.691 + 10 log10` of the mean block energy. True peak follows Annex 2 by 4× polyphase interpolation of every sample interval. The coefficients hold only at 48 kHz, the rate every caller supplies: the mixer, the master and the delivered AAC decode at 48 kHz. Samples after the last whole sub-block of a long signal belong to no block, as the gating definition places them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One streaming meter serves the line leveller, the master stage, the analysis and the delivery host, so all four read loudness by one definition. The interpolation is the shared `autoMovieTruePeakBetween`, which the limiter also uses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every coefficient is taken from BS.1770-5 or derived in `AUTOMOVIE_TRUE_PEAK_PHASES`; nothing is tuned to a test signal. The meter claims no external conformance certification beyond the EBU Tech 3341 cases its test checks.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the samples pushed: per sample, two biquads and 72 multiply-adds for the three interpolator phases, with constant state per channel; memory grows by one number per 100 ms for the gating blocks. The ring buffer stores each sample twice so the interpolation window is contiguous and no history is copied per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Sub-block energies are computed once and shared by the four overlapping blocks that contain them.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the meter; it holds filter state, a 48-sample ring per channel and one energy per 100 ms of signal, released with the meter. It holds no input buffer.
