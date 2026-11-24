# src/physics/physicalQuadrupedWrenchFootSwitch.ts#physicalQuadrupedWrenchFootSwitch

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, its relative threshold, that it is unfiltered, and why the simulation's default touchdown-detector switch is not used.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `QuadrupedWrenchBasedFootSwitch.hasFootHitGround` (l.48-54) with its threshold of 4 % of the robot's weight (l.36), the switch the factory builds for `WrenchBased` from simulated contact (QuadrupedFootSwitchFactory l.114-138). The default `TouchdownBased` switch (QuadrupedSimulationFactory l.480) is left out by decision: its 40 N force and 20 N m knee thresholds (ForceBasedTouchDownDetection l.31, QuadrupedSimulationFactory l.482) are absolute, and on a 78 N body a foot carries about 19.5 N in four-leg stance and 39 N in two-leg support.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None; the share is the reference's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalQuadrupedWrenchFootSwitch.ts#physicalQuadrupedWrenchFootSwitch

## @evidence contracts/development/common.md#meaningful-documentation

Documents the threshold's share.

## @evidence contracts/development/design.md#principled-representation

The reference's share of the weight.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the switch and the integrator's touchdown decision.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
