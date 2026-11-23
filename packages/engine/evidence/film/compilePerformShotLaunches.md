# src/film/compilePerformShotLaunches.ts#compilePerformShotLaunches

## @evidence contracts/development/implementation.md#principled-implementation

The ballistic solve is `compileLaunch`'s; leading a moving target samples the same animated base a `follow` camera reads, and the flight is moved onto the shot clock by a constant time shift, which keeps the clip's own interpolation unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The launch stage of `performShot` in one place, between the input gate and the performance compile; the probe compile reuses `compilePerformance` over the target's own actions instead of a private root sampler.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every launch is solved by the same rules; an unreachable or late flight is refused rather than trimmed, and the recoil's region-overlap exemption is a stated product decision with its reason.

## @evidence contracts/development/common.md#meaningful-documentation

States when it runs and why, the three aim cases, both refusals, how the flight is placed and named, where events and recoils go and why the recoil's path is the `onHit`, and the overlap exemption.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each targeted launch scans the stage actions and their actor lists to select the target's jobs, then delegates a probe compile and the launch solve. Cost includes those full selection scans, synthesized clip sizes and target sampling, rather than only the selected node's action count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The probe compile goes through the shot's memoized synthesizer, so the target's clips it synthesizes are the ones the authoritative compile reuses; its masked report is dropped because that compile reports every drop once at the same paths.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The probe performances are dropped after each solve; the caller owns the returned clips and events, one flight per launch.
