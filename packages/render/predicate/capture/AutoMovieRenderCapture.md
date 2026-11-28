# src/capture/AutoMovieRenderCapture.ts#AutoMovieRenderCapture.planFrames

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc distinguishes encoded indices from explicit continuous poses. It states the even sampling and terminal event policy together with the clock, rate and window conditions.

## @evidence contracts/development/implementation.md#principled-implementation

The shared encoded schedule rounds the product of duration and frame rate to a native count. Event and cut seconds stay unchanged. Their ideal nearest index is clamped to the last available native frame before the integer-radius window is built. Continuous explicit times outside the encoded grid have no frame number.

## @evidence contracts/development/implementation.md#efficient-algorithms

The planner keys observations by native frame or exact continuous second. Requests at or above native cadence walk the resulting consecutive indices rather than revisiting duplicates. Slower requests walk their actual interval and planned event windows add their own native ranges.

# src/capture/AutoMovieRenderCapture.ts#AutoMovieRenderCapture.parsePlanRequest

## @evidence contracts/development/common.md#meaningful-documentation

Documents named cues and their optional played entry beside the established numeric sampling keys.

## @evidence contracts/development/implementation.md#principled-implementation

The request parser recognizes the cue and entry pair, refuses entry alone and refuses mixing a named cue with numeric sampling. An entry must be a nonnegative safe integer. The address writer emits the cue pair without numeric sampling keys.

## @evidence contracts/development/implementation.md#efficient-algorithms

The key admission pass walks the supplied values once. Name and entry admission does not load or inspect the subject; the planner resolves the selected source at its owning boundary.

# src/capture/AutoMovieRenderCapture.ts#AutoMovieRenderCapture.plan

## @evidence contracts/development/common.md#meaningful-documentation

Describes the selected source cue, the current subject and the native cell layout.

## @evidence contracts/development/implementation.md#principled-implementation

The played event's exact output second centers the bounded native window. An off-grid event adds a separate pose address and filename. Legacy numeric captures still label instants at their documented millisecond resolution.

## @evidence contracts/development/implementation.md#efficient-algorithms

One selected cue scans its owner's event list, then the normal planner expands only the requested native window. The existing cell product determines sheet storage and drawing work.

# src/capture/AutoMovieRenderCapture.ts#AutoMovieRenderCapture.resolveCue

## @evidence contracts/development/common.md#meaningful-documentation

Defines the source event id, entry, exact clocks and refusal conditions.

## @evidence contracts/development/implementation.md#principled-implementation

Exact id and entry distinguish plays of the same source cue. The subject provides the admitted occurrences; the resolver requires one match with finite nonnegative source time and an output time within the subject. A copy prevents the caller changing the producer's record.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass collects matching source events. Only a selected occurrence is copied and the resolver starts no host, rendering or media work.

# src/capture/AutoMovieRenderCapture.ts#AutoMovieRenderCapture.planVideoFrames

## @evidence contracts/development/common.md#meaningful-documentation

States sequence order, absolute stream selection, output format and optional source PTS.

## @evidence contracts/development/implementation.md#principled-implementation

Nonnegative safe frame indices are sorted and deduplicated before FFmpeg's decoded-frame select expression. The explicit map refers to the same stream throughout capture. Input PTS and a filter after selection keep reported timing tied to actual extract order.

## @evidence contracts/development/implementation.md#efficient-algorithms

One filter merges consecutive requested ordinals into ranges. The process runner is called by the host, and timing logs are requested only when the host can retain them.

# src/capture/AutoMovieRenderCapture.ts#AutoMovieRenderCapture.planVideoSceneCuts

## @evidence contracts/development/common.md#meaningful-documentation

States the FFmpeg scene-change scale, stream selection and how the report is written.

## @evidence contracts/development/implementation.md#principled-implementation

The selected input map applies before scdet so its cuts describe the stream used for stills. FFmpeg reads the report path through both its filter option and graph escaping levels.

## @evidence contracts/development/implementation.md#efficient-algorithms

The planner generates one filter command. The detection host walks the stream once and releases the report after reading selected cuts.

# src/capture/AutoMovieRenderCapture.ts#AutoMovieRenderCapture.runVideo

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the generic sampling clock and exact submitted decoder PTS.

## @evidence contracts/development/implementation.md#principled-implementation

The cut and still extraction plans share a video map. The host can persist exact presentation evidence from the picture extraction; older hosts retain the estimated clock. With no source scene the runner refuses a named cue.

## @evidence contracts/development/implementation.md#efficient-algorithms

The runner extracts all selected frames with one request. The host's timing observations come from that same process. Existing folder ownership bounds the still and report files.

# src/capture/AutoMovieRenderCapture.ts#AutoMovieRenderCapture.run

## @evidence contracts/development/common.md#meaningful-documentation

The run documents storage order, failed cells, audit summaries, comparison and the optional source-backed trail samples a drawn still keeps.

## @evidence contracts/development/implementation.md#principled-implementation

Source-backed trail samples belong to the successful row whose host drew them. Providerless segments and failed cells add no source trail evidence.

## @evidence contracts/development/implementation.md#efficient-algorithms

Consume samples from the existing cell drawing. Their record field requires no additional draw, seek or storage file.
