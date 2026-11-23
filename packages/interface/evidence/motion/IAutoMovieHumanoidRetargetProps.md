# src/motion/IAutoMovieHumanoidRetargetProps.ts#IAutoMovieHumanoidRetargetProps

## @evidence contracts/development/design.md#principled-representation

Requires the source motion and both normalized skeletons, with explicit clinical axes, rest frames and optional semantic bindings for rig differences; rootScale is supplied or derived from their resolved rest heights.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Rig facts, explicit scale and contact policy remain named inputs to one retarget operation rather than being inferred from imported node names or hidden host state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing required bones and invalid scales are runtime refusals; optional maps use the documented humanoid conventions rather than asset-specific repairs.

## @evidence contracts/development/common.md#meaningful-documentation

Gives joint units, translation conversion, unchanged facing, borrowing, default tables, binding roles and the contact-enabled default.
