# src/scene/resolve/IAutoMovieShotLightingInput.ts#IAutoMovieShotLightingInput

## @evidence contracts/development/design.md#principled-representation

Provide staged lights, shot light-motion clips and shot-local seconds; resolveShotLighting samples pointer channels and reconstructs only touched lights.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input keeps lighting evaluation independent of node world composition and renderer object allocation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Omitted animation is represented by an empty clip list, retaining staged light identities; unknown light ids/properties are errors, not discarded tracks.

## @evidence contracts/development/common.md#meaningful-documentation

Members identify borrowed staging order, shot light-motion population and seconds rather than host clock time.
