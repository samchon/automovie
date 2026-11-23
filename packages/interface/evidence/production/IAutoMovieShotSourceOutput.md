# src/production/IAutoMovieShotSourceOutput.ts#IAutoMovieShotSourceOutput

## @evidence contracts/development/design.md#principled-representation

compileDefinedShot returns scene, motions and shot from its stage/performance pipeline and deep-copies authored event samples before realizeShotContract checks their windows and predicates. Optional semantic carriers are host-attached inputs to Engine queries and render adapters; that direct compiler does not automatically preserve or validate every optional field.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separates required engine artifacts and event samples from optional semantic carriers and compact cues, allowing explicit host composition without expanding the direct defineShot compiler into a production orchestrator.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Source event samples are independently checked by realizeShotContract rather than accepted as proof by id alone. Optional cue omission remains undefined in direct source output; a host composing IAutoMovieCompiledShotSource must provide its required cue arrays and run the relevant validators explicitly.

## @evidence contracts/development/common.md#meaningful-documentation

Defines retained ownership and provenance, structured simulation and planting/service bindings, sampled event timing, derived engine artifacts and optional compact cue omission.
