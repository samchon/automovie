# src/model/IAutoMovieCapsuleShape.ts#IAutoMovieCapsuleShape

## @evidence contracts/development/design.md#principled-representation

A cylinder and two hemispheres are determined by their common radius and cylindrical length, so bounds span plus or minus radius horizontally and half height plus radius vertically; runtime extent validation requires both dimensions positive and finite.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two dimensions express the rounded shape without exposing cap centres or tessellation resolution; the enclosing part supplies its placement transform.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The declared capsule is rounded for every consumer; tessellation joins two same-radius hemispheres across the cylindrical body length without redefining either parameter.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes cylindrical body length from total height, states the local Y alignment and midpoint origin, and gives metre units and strict positive finite bounds.
