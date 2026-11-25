# src/render/IAutoMovieRenderSubjectOfShot.ts#IAutoMovieRenderSubjectOfShot.IProps

## @evidence contracts/development/design.md#principled-representation

A compiled shot plus optional water, cloth and planting rows describe the selected drawable world; omitted supplemental arrays mean empty.

## @evidence contracts/development/design.md#minimal-and-owned-surface

autoMovieRenderSubjectOfShot is the shared field projection used by the complete compiled-shot adapter and explicit-subset callers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Omission does not infer simulation rows from the artifact; callers requiring full domain coverage use the compiled-shot adapter.

## @evidence contracts/development/common.md#meaningful-documentation

Documents supplemental-array absence and separate host ownership of texture facts.
