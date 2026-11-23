# src/compose/AutoMovieMotionHumanBendSweep.ts#AutoMovieMotionHumanBendSweep

## @evidence contracts/development/common.md#meaningful-documentation

States what is swept, what each place is read for, the inputs, the two modes and the null case.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's analytic hinged-arm swivel sweep (`hingedArmArticulation`), the upper arm's range sparing swivels it refuses (`boxExcludedSwivels`), each candidate read for the rig's range overshoot, the forearm's clearance and the strain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The fixed bases and ranges, one candidate reader, one engine sweep.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A rig without the lower arm's axes is null, never a guessed place; the returned candidate is read again at the solved rotations, so its overshoot is the true one.

## @evidence contracts/development/implementation.md#efficient-algorithms

The bases and ranges are admitted once a sweep, the lower joint's overshoot once a branch's shared lower rotation, and the clearance prepared once a sweep over the chain's placed shapes. With a hand rotation a candidate's strain is read at most once and only on demand, its shoulder's share standing as a certified lower bound (`AutoMovieMotionHumanBendStrain.least`), so a ranking that defers it (`AutoMovieMotionHumanBendSearch.strained`) reads the hand's split and decomposition only for comparisons the overshoot and the bound leave open. A cold sweep under the strain's own ranking passes the engine the strain's certified bound over each bracket of swivels (`AutoMovieMotionHumanBendBound`), and the engine's branch and bound (`hingedSwivelBounded`, Land and Doig 1960) scores only the steps whose bound does not already exceed a legal place's exact strain, with the full sweep's choice.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares `AutoMovieMotionHumanBendStrain` and `HumanArmOvershoot` with every search of the arm.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Readers and candidate closures end with the call; only the chosen candidate and its seed escape.
