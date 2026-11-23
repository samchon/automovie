# src/motion/speedProfile.ts#speedProfile

## @evidence contracts/development/implementation.md#principled-implementation

Piecewise-constant acceleration integrated in closed form: s = s0 + v0 t + a t squared over 2 and v = v0 + a t. A distance stretch is the trapezoidal profile of motion planning with bounded acceleration and boundary speeds: its peak is the speed at which an accelerating run from the entry and a braking run to the mark together cover the length, the square root of (2 L a b + b v0 squared + a v1 squared) over (a + b), lowered to the cap. Inverting time from distance takes the root that is stable for its sign: the square root of 2 s over a from rest, and 2 s over (v0 + the square root of (v0 squared + 2 a s)) otherwise, which avoids cancellation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the input, lay each stretch's phases end to end, then two samplers that find the phase and evaluate it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unreachable marks and rates are thrown, never clamped; a second or distance outside the profile holds the nearer end.

## @evidence contracts/development/implementation.md#efficient-algorithms

Laying is linear in the stretches; a sample scans at most three phases per stretch, a handful for any real path.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One profile serves every sample of its path.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The profile holds one record per phase and per stretch for as long as its caller keeps it.

## @evidence contracts/development/common.md#meaningful-documentation

States both kinds of stretch, the cap and the peak, flying starts and ends, the start second, the end-anchored braking and every failure.
