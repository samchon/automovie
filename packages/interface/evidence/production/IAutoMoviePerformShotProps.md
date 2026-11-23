# src/production/IAutoMoviePerformShotProps.ts#IAutoMoviePerformShotProps

## @evidence contracts/development/design.md#principled-representation

Separates what the shot is made of (script, stage, performance) from the capabilities that realize it (synthesizer, rig, axes, rest frames, live targets) and the evidence that gates it (blocking, gaits, actor context), each a plain value or lookup the caller owns.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMoviePerformShotProps owns performShot's canonical inputs; caller registry callbacks avoid copying rig authorities, and optional framing/coupling context is read by the corresponding compilation stage, and the delivery frame format carries the raster and clock the camera stage keys paths with.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No field exists for a test or a fixture; every optional field is a real capability or piece of evidence a production caller supplies.

## @evidence contracts/development/common.md#meaningful-documentation

Each field states its meaning, its units or frame where it has one, and what omitting it does. Inputs and registry answers must remain stable for the synchronous compile. Callback exceptions propagate without rollback of caller side effects; the engine retains no callback after returning. Authored object/light clip records can be shared with the returned shot, so callers must not treat the result as a deep copy of every input.
