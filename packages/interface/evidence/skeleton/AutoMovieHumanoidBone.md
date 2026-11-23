# src/skeleton/AutoMovieHumanoidBone.ts#AutoMovieHumanoidBone

## @evidence contracts/development/design.md#principled-representation

The closed 55-slot vocabulary follows VRM 1.0 humanoid names so normalized poses and ingest mappings share semantic bone identity; actual rig membership and rest-basis compatibility still require runtime admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One named bone union serves pose, ROM, attachment and ingest contracts instead of free strings or duplicated per-avatar names.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A valid bone name does not imply that every avatar declares it or that copying angles alone retargets arbitrary rest bases; absent optional bones and differing target constraints remain explicit conversion concerns.

## @evidence contracts/development/common.md#meaningful-documentation

Defines semantic names, VRM specification reference, 15 required slots versus optional chest and articulation population and runtime membership limits.
