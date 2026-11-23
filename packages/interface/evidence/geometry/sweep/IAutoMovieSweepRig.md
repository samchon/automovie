# src/geometry/sweep/IAutoMovieSweepRig.ts#IAutoMovieSweepRig

## @evidence contracts/development/design.md#principled-representation

A compiled evaluator over a fixed set of parameters, the standard split of a deformable surface into pose-invariant sampling and per-pose evaluation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three slot kinds cover what a cage needs: section planes, scale factors and the normal and spine derivative at a point.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Registering after `seal` is refused, so every slot has storage.

## @evidence contracts/development/common.md#meaningful-documentation

States the two phases, the slot kinds and the array layouts.
