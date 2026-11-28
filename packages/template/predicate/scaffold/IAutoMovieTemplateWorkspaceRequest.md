# src/scaffold/IAutoMovieTemplateWorkspaceRequest.ts#IAutoMovieTemplateWorkspaceRequest

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the current settings as YAML text and the directory as the relative-link origin. Together they tell the caller how to supply an existing file for catalog completion.

## @evidence contracts/development/design.md#principled-representation

The request keeps source bytes as text so completion can return them unchanged when every entry exists. A separate directory establishes the filesystem origin of each relative link. The parser checks the file syntax and the maps it reads before the updater writes to its in-memory document.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Catalog completion reads the existing source and consults the directory only to resolve linked dependencies. Both serve documented inputs to the existing-workspace operation. The caller keeps responsibility for locating, reading and writing the settings file.

# src/scaffold/IAutoMovieTemplateWorkspaceRequest.ts#IAutoMovieTemplateWorkspaceRequest.directory

## @evidence contracts/development/common.md#meaningful-documentation

The member identifies the path as the origin for relative SDK links in the settings. It describes context rather than a write destination.

# src/scaffold/IAutoMovieTemplateWorkspaceRequest.ts#IAutoMovieTemplateWorkspaceRequest.source

## @evidence contracts/development/common.md#meaningful-documentation

The member identifies the input as the existing workspace file's contents. The operation documents the mapping requirements and the unchanged result when no additions are needed.
