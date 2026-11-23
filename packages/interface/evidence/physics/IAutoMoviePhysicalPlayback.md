# src/physics/IAutoMoviePhysicalPlayback.ts#IAutoMoviePhysicalPlayback

## @evidence contracts/development/common.md#meaningful-documentation

Solver-free random-access playback of an admitted complete physical performance.

## @evidence contracts/development/design.md#principled-representation

duration is local film seconds and rate cached intervals/s; poses and velocities retain the world-space SI meaning of PhysicsCache frames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMoviePhysicalPlayback retains an owned archive byte copy and recursively frozen metadata for its lifetime. Sampling allocates detached frames and never advances or initializes a native solver.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Archive decoding rejects incompatible identity, protocol, corruption or allocation limits. This reader contains no restart checkpoints; callers need the producer cache to resume native simulation.

# src/physics/IAutoMoviePhysicalPlayback.ts#IAutoMoviePhysicalPlayback.IHeader

## @evidence contracts/development/common.md#meaningful-documentation

Validated archive metadata accompanying a fixed-order sequence of binary segment records.

## @evidence contracts/development/design.md#principled-representation

format is the literal binary layout version; duration times integer rate plus one gives the frame count, and segments lists unique [body,bone] keys in record order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

encodePhysicalPlayback writes metadata from a complete cache; decodePhysicalPlayback validates and freezes it before a reader exposes its arrays and records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The header preserves actual ownership/contact/recovery history and requested support predictions separately. It contains no native checkpoint bytes and cannot resume simulation.
