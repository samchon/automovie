# src/scene/IAutoMovieLightShadow.ts#IAutoMovieLightShadow

## @evidence contracts/development/design.md#principled-representation

Admitted positive map resolution and ordered positive camera clips configure the shared light-space shadow adapter, with finite depth and normal bias retained as authored numeric tuning.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five scalar controls describe common shadow state without exposing renderer camera objects or selecting the scene's master filter policy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shadow tuning cannot enable unsupported area maps or override disabled scene shadows; near/far remain explicit rather than guessed from one fixture.

## @evidence contracts/development/common.md#meaningful-documentation

Defines resolution, depth and normal bias and positive ordered clip distances.
