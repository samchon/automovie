# src/physics/IAutoMovieDecodePhysicalPlayback.ts#IAutoMovieDecodePhysicalPlayback.IBudget

## @evidence contracts/development/common.md#meaningful-documentation

Explicit allocation limits for admitting a physical playback archive.

## @evidence contracts/development/design.md#principled-representation

Every limit is a positive safe integer; frame count includes frame zero and segment count is per frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

decodePhysicalPlayback checks bytes before copying, then checks header frame and segment counts before scanning records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Exceeding any bound rejects the decode promise; these are caller limits, not defaults or declared archive sizes.

# src/physics/IAutoMovieDecodePhysicalPlayback.ts#IAutoMovieDecodePhysicalPlayback.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Asynchronous admission result carrying an owned archive and its decoded metadata.

## @evidence contracts/development/design.md#principled-representation

offset addresses the first eight-byte-aligned Float64 record in bytes; header identifies the complete sampled performance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

decodePhysicalPlayback copies source bytes and recursively freezes header records; the returned byte array remains mutable and is transferred to the playback reader.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Malformed records, incompatible identity or protocol, bad digest and exceeded budgets reject the promise; WebCrypto and fatal UTF-8/JSON decoding errors also propagate.
