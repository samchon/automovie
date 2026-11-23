# src/weapons/cannonRecoil.ts#cannonRecoil

## @evidence contracts/development/common.md#meaningful-documentation

States the start speed, the even slowing and the duration.

## @evidence contracts/development/implementation.md#principled-implementation

Conservation of momentum gives start speed v0 and duration T=2d/v0. Uniform deceleration gives x=d u(2-u), u=t/T, the same quadratic as v0 t-v0²t²/(4d) with exact held endpoints. ArchetypeTrackTime owns the same finite representable film interval and sample admission as swing/ease, selecting held endpoints before an offset.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Refuse, the start speed, the duration, the closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The even slowing is the simplest law that stops the run at its read length; unmeasured gas momentum remains neglected. Invalid film time is refused, never clamped or replaced. Before/after the finite interval the documented held travel is returned exactly, without a numerical bound margin.

## @evidence contracts/development/implementation.md#efficient-algorithms

A closed form per second.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the same scalar clock admission as swing and ease; only the recoil quadratic belongs here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The track closes over four scalar values: run, duration, start and end; it retains no gun, sample history, handle or asynchronous work.
