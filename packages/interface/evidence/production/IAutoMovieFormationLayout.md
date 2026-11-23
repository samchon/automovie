# src/production/IAutoMovieFormationLayout.ts#IAutoMovieFormationLayout

## @evidence contracts/development/design.md#principled-representation

Closed layout arms encode row-major line, column-major column, square-row wedge, evenly sampled arc or uniform-area seeded scatter; formationSlotPosition places local points under heading and terrain relief. Finite positive dimensions, bounded dressing and representable arithmetic are caller premises, not enforced by the placement function or this type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each algorithm owns the parameters it reads; formed layouts alone accept bounded seeded dressing, while scatter carries its own radius and seed without unused grid spacing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Count capacity is required for line, column and wedge; one-member arcs use their middle angle and zero dressing means exact geometry rather than fixture-specific placement.

## @evidence contracts/development/common.md#meaningful-documentation

Defines algorithm-specific dimensions, local lateral and depth units, capacity rules, dressing omission and deterministic seed ranges.
