# src/physics/ResolvePhysicalContactPose.ts#ResolvePhysicalContactPose

## @evidence contracts/development/common.md#meaningful-documentation

Accepts admitted body and bone identities and returns their world pose reference.

## @evidence contracts/development/design.md#principled-representation

The two identities distinguish coincident local bone names across participants.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One callback resolves the two actual endpoint reads at row setup.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The resolver determines candidate membership from the fit rather than from shape or body naming conventions.
