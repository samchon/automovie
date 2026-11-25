# src/production/IAutoMovieCoupleObjects.ts#IAutoMovieCoupleObjects.IProps

## @evidence contracts/development/design.md#principled-representation

Coupling uses scene-world transforms and shot-local seconds. Inputs require already admitted attach jobs and staged nodes; coupleObjects separately checks mount rigs/bones and coupling cycles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

performShot supplies compiled poses and registry lookups; coupleObjects returns clips/events/violations for that stage's acceptance decision without retaining the callbacks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A cycle or invalid mount reports a violation while other children may still bake; only the caller's stage gate decides whether the partial result is usable.

## @evidence contracts/development/common.md#meaningful-documentation

Inputs and bake outcome for shot attachments and persistent mounts. Coupling uses scene-world transforms and shot-local seconds. Inputs require already admitted attach jobs and staged nodes; coupleObjects separately checks mount rigs/bones and coupling cycles.

# src/production/IAutoMovieCoupleObjects.ts#IAutoMovieCoupleObjects.IResult

## @evidence contracts/development/design.md#principled-representation

Coupling uses scene-world transforms and shot-local seconds. Inputs require already admitted attach jobs and staged nodes; coupleObjects separately checks mount rigs/bones and coupling cycles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

performShot supplies compiled poses and registry lookups; coupleObjects returns clips/events/violations for that stage's acceptance decision without retaining the callbacks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A cycle or invalid mount reports a violation while other children may still bake; only the caller's stage gate decides whether the partial result is usable.

## @evidence contracts/development/common.md#meaningful-documentation

Inputs and bake outcome for shot attachments and persistent mounts. Coupling uses scene-world transforms and shot-local seconds. Inputs require already admitted attach jobs and staged nodes; coupleObjects separately checks mount rigs/bones and coupling cycles.
