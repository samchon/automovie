# src/actions/preparePairedFloorSupport.ts#preparePairedFloorSupport

## @evidence contracts/development/implementation.md#principled-implementation

The feet and hands must share their respective authored placements and reflected axes. Every paired material target is checked for a common sagittal plane at the original fit resolution before one side's angles are copied to its homologue.

## @evidence contracts/development/implementation.md#efficient-algorithms

The unilateral solve omits free-side articulation, coronal trunk angles and roll. The original fit runs on failure. Nothing is retained between keys.
