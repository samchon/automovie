# src/frameTimes.ts#frameTimes

## @evidence contracts/development/implementation.md#principled-implementation

IEEE 754 division is correctly rounded, so `i / fps` is a pure function of its operands on every conforming host, while accumulating `1 / fps` would compound rounding error per frame; the frame count rounds to the nearest whole frame because a render can only deliver whole frames.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single render, the sequence render plan, the caption plan, and the pose-keypoint plan all sample through this one schedule, so captions, keypoints and pixels address the same frames.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid clocks return an empty schedule rather than a guessed one, and no rate or duration is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states the frame count and instant formulas with their units, why the instants are reproducible, and which inputs yield no frames.

## @evidence contracts/development/implementation.md#efficient-algorithms

Time and space are O(N) in the frame count, one division per frame, which is the size of the schedule returned.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each plan builds its schedule once per call, and the arithmetic is cheaper than keying a cache by rate and duration.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned array of N numbers is the caller's and nothing else is retained; N is bounded only by the caller's duration and rate, and a count past the engine's array limit throws a `RangeError`.
