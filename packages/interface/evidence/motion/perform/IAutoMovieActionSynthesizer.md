# src/motion/perform/IAutoMovieActionSynthesizer.ts#IAutoMovieActionSynthesizer

## @evidence contracts/development/design.md#principled-representation

Separates per-action rig-specific content generation from compilePerformance's repeat, placement, masking and layering; returned clips must be admitted and compatible with the actor skeleton.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One callable seam supplies content without embedding an asset loader, physics host or timeline policy in the compiler.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null explicitly means no clip; the interface does not invent content for an unsupported verb or promise that every declared verb has a reference implementation.

## @evidence contracts/development/common.md#meaningful-documentation

Documents cycle-local seconds, actor identity, prior-state optionality, null and exception effects.
