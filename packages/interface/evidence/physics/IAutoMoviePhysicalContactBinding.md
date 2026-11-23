# src/physics/IAutoMoviePhysicalContactBinding.ts#IAutoMoviePhysicalContactBinding

## @evidence contracts/development/design.md#principled-representation

Source and target collider identities specify contact or separation in actual placement, with bounded iteration count and a metre residual tolerance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The geometric target solver reads one relationship record for arbitrary articulated bodies; the physical profile owns collider shape and material data.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The binding supplies motor intent rather than teleporting a body or declaring a solved contact impulse; failed reach remains a residual.

## @evidence contracts/development/common.md#meaningful-documentation

Names the admission path, reference resolution, compression rule, optional normal and bounded fitting behavior.
