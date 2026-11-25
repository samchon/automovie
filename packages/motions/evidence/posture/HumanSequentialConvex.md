# src/posture/HumanSequentialConvex.ts#HumanSequentialConvex.minimise

## @evidence contracts/development/common.md#meaningful-documentation

States the problem it is given, the start, the parameters, and the result: the last iterate taken, its reading, sco's end status and the merit coefficient reached.

## @evidence contracts/development/implementation.md#principled-implementation

A line-for-line port of trajopt's `sco::BasicTrustRegionSQP::optimize` (github.com/joschu/trajopt src/sco/optimizers.cpp lines 220-400 at commit 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c, BSD-2-Clause, Copyright (c) 2013, John Schulman), the solver of Schulman et al. 2014 (IJRR 33:1251): the start projected onto the hard set; the merit loop over at most `maxMeritCoeffIncreases` coefficients; at each, the SQP loop with one convexification per iteration and the trust-region loop inside it; the exits on `minApproxImprove`, `minApproxImproveFrac`, the box under `minTrustBoxSize`, `maxIter`, a failed convex solve, and the penalty adjustment on `cntTolerance` with the box floored at `minTrustBoxSize / trustShrinkRatio * 1.5`. The order of the tests is sco's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The loop owns acceptance, the box and the coefficient; each caller owns its problem's projection, reading and convex model. The SQP loop at one coefficient is a private function so the merit loop reads as sco's outer loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tuned value: every parameter is sco's member, passed by the caller, sco's defaults in `DEFAULTS`. No retry or fallback: a failed model ends the solve `failed`, a spent iteration count ends it `scoIterationLimit`, and an unmet constraint after the last coefficient ends it `penaltyIterationLimit`, as sco's do; the caller refuses by its own reading.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most `maxMeritCoeffIncreases × maxIter` convexifications, and per convexification one model solve per box tried, the box shrinking by `trustShrinkRatio` from its width to `minTrustBoxSize`; each trial costs one exact evaluation. The dominant cost is the caller's evaluation and convex solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each iterate's exact reading is computed once and kept until a step replaces it; a rejected trial's reading is dropped. One convexification serves every box of its iteration.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one iterate, its reading and one model at a time; nothing outlives the call.
