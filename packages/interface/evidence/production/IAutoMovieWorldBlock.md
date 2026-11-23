# src/production/IAutoMovieWorldBlock.ts#IAutoMovieWorldBlock

## @evidence contracts/development/design.md#principled-representation

An unrotated box is described by its base centre and size, so the axis-aligned bounds are exact and the overlap, support and route checks in `assertWorldPlacements` are interval and polygon tests without rotation error.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Bundles the three artifacts one block produces, the model group, the scene node and the bounds, so a caller registers the model, stages the node and checks the bounds from one value without recomputing any of them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The model is the one box the size describes, built in place because `engine` cannot depend on the archetype catalogue; no block id is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States how the block is built, that it is never rotated, every refusal `assertWorldPlacements` applies, the shared id, the model's box part, material and units, the node's translation, and both bound corners.

# src/production/IAutoMovieWorldBlock.ts#IAutoMovieWorldBlock.IInput

## @evidence contracts/development/design.md#principled-representation

The base is bottom-centre world metres and size is positive X/Y/Z metres; worldBlock admits nonblank id, finite base/size and hexadecimal color before deriving axis-aligned bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

worldBlock creates a model, node and placement bounds for assertWorldPlacements; the input controls only the dimensions, classification and surface color that construction reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Wall/building is semantic classification with identical box geometry. Constructor checks do not prove support or route clearance, which assertWorldPlacements evaluates against the declared world.

## @evidence contracts/development/common.md#meaningful-documentation

Grounded block constructor inputs paired with its generated scene artifacts. The base is bottom-centre world metres and size is positive X/Y/Z metres; worldBlock admits nonblank id, finite base/size and hexadecimal color before deriving axis-aligned bounds.
