# src/sound/sampleAutoMovieDialogueVisemeWeights.ts#sampleAutoMovieDialogueVisemeWeights

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the dominance function and its source, the silent targets before and after the line, the normalized blend and its range, and what a frame number stands for.

## @evidence contracts/development/implementation.md#principled-implementation

Cohen and Massaro's coarticulation model: each segment's target is weighted by a dominance that decays exponentially from its centre at its own rate, as the model gives each segment its own rate parameter, and a parameter at time t is the dominance-weighted mean of the targets. With one-hot viseme targets the mean is each viseme's share of the total dominance, a closed form evaluated at any frame. The silences before and after the line are semi-infinite targets, so the mouth rests outside the line instead of holding its last shape.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The parameters live in `AUTOMOVIE_COARTICULATION`; the join supplies placed ranges and the consumers map weights onto their own mouths.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No viseme is special-cased in code; `PP` and `FF` differ only by their documented magnitude and time constant. Each time constant's bound on the step between frames, and the shortest bilabial reach the one-half rule admits, are derived in the constant's comment, not tuned to a test.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the line's ranges per frame; a line holds tens to hundreds of phonemes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the timeline and the frame.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It returns a fresh record and holds no resource.
