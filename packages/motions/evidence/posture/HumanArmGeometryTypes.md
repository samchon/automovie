# src/posture/HumanArmGeometryTypes.ts#HumanArmGeometryTypes

## @evidence contracts/development/common.md#meaningful-documentation

Defines the base's pose and world-placed external colliders and their borrowed ownership.

## @evidence contracts/development/design.md#principled-representation

A canonical pose and world-placed collider segments, types imported from their existing owners.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This base record is the frame builder's and trajectory contexts' shared input; HumanArmGeometry.IBase inherits it and preserves its established declaration-merging surface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No new motion or collider representation is introduced.

# src/posture/HumanArmGeometryTypes.ts#HumanArmGeometryTypes.IBase

## @evidence contracts/development/common.md#meaningful-documentation

States that moving-arm joints are ignored and that the other bodies' colliders are already posed in the world.

## @evidence contracts/development/design.md#principled-representation

A borrowed canonical pose provides unchanged parents and nonmoving body parts, while external placed segments supply the surrounding geometry; the frame builder owns their interpretation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanArmFrame and trajectory contexts consume exactly these two inputs, reusing the pose and placed-collider owners' types.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

External bodies are data instead of fixture-specific fields, and readonly collider membership does not claim deep immutability of borrowed geometry.
