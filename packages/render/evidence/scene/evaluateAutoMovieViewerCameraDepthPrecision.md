# src/index.ts#evaluateAutoMovieViewerCameraDepthPrecision

## @evidence contracts/development/implementation.md#principled-implementation

Queries WebGL DEPTH_BITS on the current draw target and accepts integer capability at least the declared fixed-point minimum only with exact near/far parity and standard renderer mode; validates finite positive source distances/budget, but does not re-evaluate the engine's maximum-step bound or inspect a stale/custom projection matrix.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns one portable report with ordered refusal statuses; framebuffer observation and admission stay together, while the throwing wrapper only renders that result as a caller error.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses actual WebGL state and renderer capabilities with no host-name whitelist or fallback 24-bit value; unavailable bits remain null and nonstandard projection is refused rather than compensated.

## @evidence contracts/development/common.md#meaningful-documentation

Documents the current draw-target query, standard fixed-point comparison, nonstandard modes and the distinction between property/capability parity and measured scene/projection correctness.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performs one WebGL capability query plus fixed-count scalar checks and report construction; CPU space is constant, though getParameter may synchronize with the driver and is intended as a capability gate rather than per-pixel work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the report with the assertion wrapper; no cache is retained because framebuffer binding, capabilities and camera clips jointly determine the observation and may change between requests.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows renderer/context/camera for one synchronous query and returns scalars; no framebuffer ownership, GPU allocation, retained browser handle or running task is acquired.
