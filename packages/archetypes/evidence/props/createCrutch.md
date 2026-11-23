# src/props/createCrutch.ts#createCrutch

## @evidence contracts/development/implementation.md#principled-implementation

Put the floor contact on the lower cap and derive the grip axis and aperture from the same handle rod. The upper extension meets the rear of a coarse open cuff.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the single free dimension, then place the tip, shaft, grip and cuff in the local frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The maker supplies grip and cuff dimensions and per-unit mass. The shaft, pad and setback are fixed illustrative estimates.

## @evidence contracts/development/implementation.md#efficient-algorithms

Eight rods and two contacts in a fixed-size model.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call returns independently dimensioned geometry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the new model retains its parts and data.

## @evidence contracts/development/common.md#meaningful-documentation

Describes the single forearm prop, its axes and contacts, the varied height and the explicit refusal.
