# src/physics/planPhysicalSimulationSteps.ts#planPhysicalSimulationSteps

## @evidence contracts/development/common.md#meaningful-documentation

Gives the run's performed steps and its snapshot steps, the resumed step and film length they are counted from, the cadence's unit and admission owner, that step 0's snapshot is not among them, and the empty list when the run resumes at the film's end.

## @evidence contracts/development/implementation.md#principled-implementation

A resumed run performs the steps after `start` through `count`, so it performs `count - start` of them. Its snapshot steps are the multiples of the cadence in that range: with `every` a positive safe integer, which `admitPhysicalSimulation` enforces, and `start` and `count` non-negative integers, the first multiple after `start` is `(floor(start / every) + 1) * every` and the rest follow every `every`. These are the steps the former `step % checkpointEvery === 0` test kept. All values are integer step counts below 2^53, so the arithmetic is exact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the run's step plan, which `AutoMoviePhysicalSimulation.compute` reads for its loop's snapshots and its `recomputedSteps`. Choosing the resume step stays with `checkpointPhysicalSimulation`, and taking the snapshots stays with the loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body uses only the closed form above: no assertion, no `any` and no special case. Its only literal is the structural 1 of "the next multiple".

## @evidence contracts/development/implementation.md#efficient-algorithms

Time and space are proportional to the snapshot count, (count - start) / every. The function visits each snapshot step once and never scans the steps between them.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The function holds no cache and coordinates no consumers. Each call computes its plan from its three integers, and the result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer or task and keeps no state between calls. Its one array becomes the returned plan.
