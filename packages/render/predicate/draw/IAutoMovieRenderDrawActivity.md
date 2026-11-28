# src/draw/IAutoMovieRenderDrawActivity.ts#IAutoMovieRenderDrawActivity

## @evidence contracts/development/common.md#meaningful-documentation

The alias distinguishes a pending host request from an acknowledged operation. The operation supplies only the context its owner knows.

## @evidence contracts/development/design.md#principled-representation

The two variants use literal `type` values. A completed operation requires elapsed milliseconds. A requested operation carries its known deadline without implying completion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The draw session emits individual RPC receipts. The video composer supplies native schedule indices and its frame count. The CLI records the latest pair and uses the optional context without another draw.

# src/draw/IAutoMovieRenderDrawActivity.ts#IAutoMovieRenderDrawActivity.IRequested

## @evidence contracts/development/common.md#meaningful-documentation

The host emits this discriminant before the named operation starts.

## @evidence contracts/development/design.md#principled-representation

The `requested` discriminant identifies a pending operation and draws its clock or pass context from the producer.

## @evidence contracts/development/design.md#minimal-and-owned-surface

It identifies which operation was attempted, including when there is no acknowledgment.

# src/draw/IAutoMovieRenderDrawActivity.ts#IAutoMovieRenderDrawActivity.IAcknowledged

## @evidence contracts/development/common.md#meaningful-documentation

The acknowledgment carries the operation's elapsed host time in milliseconds.

## @evidence contracts/development/design.md#principled-representation

The completion variant adds a required duration to the requested stage and context. The observing operation measures elapsed time from a monotonic clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The render report uses the acknowledgment to identify the last successful host operation independently of the subsequent request.

# src/draw/IAutoMovieRenderDrawActivity.ts#IAutoMovieRenderDrawActivity.IOperation

## @evidence contracts/development/common.md#meaningful-documentation

Each optional field names a known scope or unit. A report lacking a frame, pass or deadline leaves that part of the operation unobserved.

## @evidence contracts/development/design.md#principled-representation

Stage is a closed set of host operations. Native frame indices and counts come from the schedule owner, seconds from the request and milliseconds from the host's timer.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A shared operation scope carries exactly the stage and optional clock, pass and deadline facts that the Draw, Render and CLI producers can provide.
