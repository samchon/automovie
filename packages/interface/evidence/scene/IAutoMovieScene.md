# src/scene/IAutoMovieScene.ts#IAutoMovieScene

## @evidence contracts/development/design.md#principled-representation

A scene combines placed reusable models, camera and light state with optional support space, atmosphere and render environment; engine admission checks identities and physical parameters before deterministic composition.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Scene placement stays separate from reusable rigs and structured buildings, whose lowering contributes ordinary scene nodes and support surfaces to the same world frame.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Omitted space, fog, medium and environment preserve documented legacy paths rather than inventing current authored conditions; structural guides bypass appearance fog and tone mapping.

## @evidence contracts/development/common.md#meaningful-documentation

Defines composition ownership, default viewpoint, model placements and optional environment/space/fog/medium state and guide-pass effects, including that a medium excludes fog and needs a film's linear target.
