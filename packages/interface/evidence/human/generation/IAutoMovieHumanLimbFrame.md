# src/human/generation/IAutoMovieHumanLimbFrame.ts#IAutoMovieHumanLimbFrame

## @evidence contracts/development/common.md#meaningful-documentation

Describes sampled limb section frames and corresponding spline/lift coefficient arrays; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Sampled limb section frames and corresponding spline/lift coefficient arrays. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanLimbFrame; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing LimbFrame contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

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
