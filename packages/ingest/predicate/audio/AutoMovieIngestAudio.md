# src/audio/AutoMovieIngestAudio.ts#AutoMovieIngestAudio.decodeAsset

## @evidence contracts/development/common.md#meaningful-documentation

The method documents the supported WAVE encodings and speaker layouts, the stereo mean, source duration in seconds, the output sample count and rate in Hz, and the admission failures.

## @evidence contracts/development/implementation.md#principled-implementation

The decoder requires the RIFF length and each padded chunk extent to match the resident file. Format fields determine alignment and the admitted speaker order. PCM signed integers scale by 32768 and float samples must be finite. Averaging stereo then resampling with its windowed low-pass kernel produces the selected mono rate. Duration uses the original frame count divided by the original rate.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chunk traversal identifies format and data. One frame pass produces mono samples, and a fixed module-level kernel table supplies the windowed-sinc weights. Only differing rates allocate and fill a separate output. Work follows declared chunks, source samples and interpolation support falling inside the input. The method owns its decoded samples and keeps no source handle or input data.

# src/audio/AutoMovieIngestAudio.ts#AutoMovieIngestAudio.admitReceipt

## @evidence contracts/development/common.md#meaningful-documentation

The method documents the receipt version, required mono float WAVE, line and digest checks, source-indexed phoneme intervals and required output rate.

## @evidence contracts/development/implementation.md#principled-implementation

The verifier checks the positive safe-integer output rate before reading metadata. It parses one version 7 receipt, matches line identity and decodes WAVE at its source rate so frame count and digest describe the original PCM. It checks ordered nonempty phoneme intervals against the source frame extent and recomputes the request digest from the recorded settings. Only then does it copy or resample the admitted audio.

## @evidence contracts/development/implementation.md#efficient-algorithms

The verifier decodes the source once. One pass writes its canonical little-endian float sample bytes for hashing and one pass checks optional phoneme chunks. A different rate adds the cost of resampling. Receipt and output audio belong to the returned result, and other arrays and digest data stay within the call.
