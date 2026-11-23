# src/production/IAutoMovieCompilePracticalLightMotion.ts#IAutoMovieCompilePracticalLightMotion

## @evidence contracts/development/design.md#principled-representation

The staged node and object clips own world placement. The named affordance supplies the emitter frame, the staged light supplies photometry, and an optional half-open shot interval supplies switching.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses scene node, object clips, affordance and light contracts without new trajectory, renderer handle, or physical-light model.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Placement times ask when to sample the prop, and never carry a second authored path. Switch times affect emission only.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies each borrowed source, the affine placement and beam conventions, supplied times, and boundary behavior for switching.
