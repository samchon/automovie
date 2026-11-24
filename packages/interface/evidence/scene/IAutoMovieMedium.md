# src/scene/IAutoMovieMedium.ts#IAutoMovieMedium

## @evidence contracts/development/design.md#principled-representation

The scattering and absorption coefficients per metre and the Henyey-Greenstein parameter, the three quantities single scattering in a homogeneous medium needs; ranges are runtime checks in staging and in engine's validateSceneMedium, which buildScene runs, because TypeScript cannot bound numbers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns it; staging admits it on a stage and validateSceneMedium on a scene, the scene carries it, render's `applySceneMedium` attaches it and the film response stage marches it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No colour or density shortcut is offered: a tint would contradict the lights it scatters, and extinction follows from the two coefficients.

## @evidence contracts/development/common.md#meaningful-documentation

States the physical model with its source, each coefficient's unit and range, the phase parameter's meaning and source, the fog exclusion, the optics requirement and the structural passes' behaviour.