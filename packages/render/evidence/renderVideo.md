# src/index.ts#renderVideo

## @evidence contracts/development/implementation.md#principled-implementation

Frame times are the half-open schedule i/fps from frameTimes; awaiting each capture before encoding preserves capture order and propagates the first host failure. The encoder owns pixel and container correctness, which this orchestration cannot prove.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The clip loop coordinates the capture and encode seams only; naming, scheduling and ffmpeg arguments remain their existing shared functions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An empty schedule refuses before host I/O, and capture or encoding failures escape unchanged; no frame, path or adapter is replaced to satisfy a consumer.

## @evidence contracts/development/common.md#meaningful-documentation

The comment names seconds, capture order and host ownership; result members specify paths, sample times and the argument vector. Frame files belong to the host even after failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

For F frames, scheduling, sequential capture and metadata assembly each traverse F records; retaining paths and timestamps costs O(F), in addition to host capture and encoder work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Captures are effectful operations and cannot be shared solely because two timestamps match; this call captures its requested sequence once and returns metadata for caller reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The host owns frame files, encoder tasks and their cleanup on success or failure; this function retains O(F) paths and times until the result is discarded and acquires no native handle itself.
