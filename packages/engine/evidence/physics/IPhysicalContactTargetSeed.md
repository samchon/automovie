# src/physics/IPhysicalContactTargetSeed.ts#IPhysicalContactTargetSeed

## @evidence contracts/development/common.md#meaningful-documentation

Names the three world-pose maps a fitted interval needs.

## @evidence contracts/development/design.md#principled-representation

All maps hold world transforms keyed by bone for the same body and interval.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Individual and coupled tracking read exactly these three maps.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The seed carries no fitted goals; only the planner produces them.
