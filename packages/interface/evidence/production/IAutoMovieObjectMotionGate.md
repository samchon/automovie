# src/production/IAutoMovieObjectMotionGate.ts#IAutoMovieObjectMotionGate

## @evidence contracts/development/design.md#principled-representation

Names the four facts an authored clip is judged by, which nodes and joints exist, which a rig already drives, which channels and clip ids a baked clip already owns, and the shot clock, so each refusal is a membership test against data the caller already computed rather than a second derivation of it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One input record instead of seven positional parameters, because the gate is called from one place and every field is required context for the same decision; `path` keeps violation paths rooted where the author wrote the clips.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No node, prop or channel is special-cased by name: drivable nodes are the staged placements minus `performed` plus the lowered joints of forged props, and a prop spec the forge refuses contributes no joints rather than being partially trusted.

## @evidence contracts/development/common.md#meaningful-documentation

States the consumer and producer, when the producer fills it, for each field what it contributes to the gate, the seconds unit of `duration`, and that nothing is retained.
