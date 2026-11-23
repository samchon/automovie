# src/IAutoMovieScaffoldProps.ts#IAutoMovieScaffoldProps

## @evidence contracts/development/design.md#principled-representation

The record holds only what differs between creations: the installation kind and the name. Dependency versions are fixed when the package is built, so a caller cannot pin a scaffold to ranges the package was not built with.

## @evidence contracts/development/design.md#minimal-and-owned-surface `kind` selects the layers and generated files, and `name` fills the one per-project token; the name rule lives in `assertScaffoldProjectName`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No override or raw token field lets a caller bypass the name rule or the built versions.

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its effect on the created files.
