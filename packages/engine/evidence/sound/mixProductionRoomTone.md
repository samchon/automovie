# src/sound/mixProductionRoomTone.ts#mixProductionRoomTone

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the noise source and its purpose key, the filter bank with its centres, Q and source, the band gain law and why it yields the tilt, the analytic level scale, the warm-up, the edge and crossfade rules, the tick rule and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Uniform noise from a counter-based stream is white with variance 1/3. A bank of cookbook band-pass sections with one-octave bandwidth at base-two octave centres, with gains forming a geometric series, has a response self-similar in log frequency, so octave-band energies step by the same ratio each octave; the per-band gain subtracts white noise's 3.01 dB per octave so that ratio is the authored tilt. The output variance of a linear filter under white input is the input variance times the mean of |H|² over frequency, evaluated on a fine grid, so the level is set in closed form and does not depend on the realization. Sine and cosine fades sum to unit power at every crossfade sample. Bilinear warping near 16 kHz bends the top band, outside the 125 Hz to 8 kHz span the tilt is specified on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The mixer calls it once per plan beside the cues; it owns bed validation, generation and edges, and its settings live in `AUTOMOVIE_ROOM_TONE`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Band centres follow IEC 61260-1; Q follows from one octave of bandwidth; the crossfade and warm-up lengths are stated design choices in `AUTOMOVIE_ROOM_TONE`, not fitted to a test. The level is computed, not measured and corrected.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in each bed's samples: one Philox block and ten biquad sections per sample, plus a fixed 8192-point response evaluation per bed and 200 ms of warm-up.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each bed is generated once, by its own stream.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each bed holds ten filter states and its stream while it is generated, released before the next; samples go straight into the caller's mix.
