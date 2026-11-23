# src/posture/HumanArmGeometryTypes.ts#HumanArmGeometryTypes.IBase

## @evidence contracts/development/common.md#meaningful-documentation

States that moving-arm joints are ignored, that the other bodies' colliders are already posed in the world, and that each planned arm may read its own view of the base.

## @evidence contracts/development/design.md#principled-representation

A borrowed canonical pose provides unchanged parents and nonmoving body parts, while external placed segments supply the surrounding geometry; the frame builder owns their interpretation. `arms` holds each planned arm's own view, the same pose and obstacles with only its own goal's rests, so one hand's rest is never another arm's.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanArmFrame and trajectory contexts consume exactly these two inputs, reusing the pose and placed-collider owners' types.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

External bodies are data instead of fixture-specific fields, and readonly collider membership does not claim deep immutability of borrowed geometry.
