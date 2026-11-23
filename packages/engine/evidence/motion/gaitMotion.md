# src/motion/gaitMotion.ts#gaitMotion

## @evidence contracts/development/implementation.md#principled-implementation

Samples the same wrapped phase for all limb rows and optional sinusoidal root bob; bone/axis rows aggregate into one joint per bone, and the closing sample wraps to the same phase for a looping clip.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The synthesizer owns the sample clock, row aggregation and gaitCycle metadata; gaitLimbFlexion owns per-row stance/swing interpolation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rejects invalid sample count, period, phase, root-bob scalars and duplicate bone/axis rows; all creatures use the same data-driven law rather than name-specific code.

## @evidence contracts/development/common.md#meaningful-documentation

States sample population, cycle closure, phase units, clinical output and the remaining rig-ROM gate.

## @evidence contracts/development/implementation.md#efficient-algorithms

For S sample intervals and L limb rows, synthesis uses O((S+1)L) work and stores O((S+1)B) joints for B distinct bones; per-sample maps combine multiple axes without scanning prior joints.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All rows at a frame share its sampleTime and each bone's joint record; identity root values are copied into caller-owned records, while no generated clip is memoized across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned clip owns sampled joints, roots and keyframes including nested rotation/scale; temporary per-frame maps are released, and module identity constants contain no growing population or handles.
