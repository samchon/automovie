# src/human/generation/IAutoMovieHumanLimbFrame.ts#IAutoMovieHumanLimbFrame.ISample

## @evidence contracts/development/common.md#meaningful-documentation

One section sampled at a station: its frame and its ring of world points.

## @evidence contracts/development/design.md#principled-representation `station`: Station along the chain, mm, increasing toward the parent. `frame`: The section's plane. `ring`: One world point per control point, in phase order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootReflection.sample. Read by AutoMovieHumanLimbFrame.controls, AutoMovieHumanLimbFrame.layer, AutoMovieHumanLimbFrame.layers. Also types AutoMovieHumanFootBodyChain.here, AutoMovieHumanFootToeChain.here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `station`, `frame`, `ring`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanLimbFrame.ts#IAutoMovieHumanLimbFrame.IControlsResult

## @evidence contracts/development/common.md#meaningful-documentation

Closed section coefficients and corresponding lift coefficients recovered from a ring in its own frame. The two arrays retain their source phase correspondence and physical chart units.

## @evidence contracts/development/design.md#principled-representation

Closed section coefficients and corresponding lift coefficients recovered from a ring in its own frame. The two arrays retain their source phase correspondence and physical chart units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLimbFrame.IControlsResult is the canonical exchange used by AutoMovieHumanLimbFrame.controls.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanLimbFrame input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
