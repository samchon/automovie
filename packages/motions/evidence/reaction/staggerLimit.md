# src/reaction/staggerLimit.ts#staggerLimit

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the bracket, its premise and the result's precision.

## @evidence contracts/development/implementation.md#principled-implementation

Capture is monotone in the speed for the pendulum: `recover` tries every order of the feet and lands each step as near its target as its region allows, so whatever catches a push catches a slower one along the same course (Koolen et al. 2012); the pendulum's capture is a necessary condition of the whole model's, which shares its dynamics, so it bounds the bracket from above, and the whole model is bisected inside it with its verified band.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two bisections over `recover`: the pendulum's, then the whole model's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The limit is the whole model's, never the pendulum's bound.

## @evidence contracts/development/implementation.md#efficient-algorithms

About log2(above / RESOLUTION) closed-form pendulum probes, then at most as many whole-model probes and VERIFIED / RESOLUTION band probes per refused band speed; a whole-model probe solves no stance course, and admits only the prefixes of orders the pendulum catches.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The entry's fixed geometry (`StaggerPendulum.prepare`) is read once and shared by every probe, as it depends on the body and entry alone; each grid speed's answer is kept per model within the search, since probing it again would run the same deterministic recovery; each probe's pendulum state and admissions are its own speed's.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only scalar bracket/grid state, the fixed geometry and local callbacks until return or failure.
