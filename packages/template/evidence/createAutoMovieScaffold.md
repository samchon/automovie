# src/createAutoMovieScaffold.ts#createAutoMovieScaffold

## @evidence contracts/development/implementation.md#principled-implementation

Layers are read from the installed package, so the map always matches the shipped scaffold. Catalog ranges come from the build's record of the repository catalogs and the automovie range from this package's own manifest, so a workspace and its productions resolve the release the package belongs to. A duplicate path throws instead of keeping either source.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the whole map for every kind; the kind decides only which layers are read and which generated files are added, and writing is left to the caller.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No file is named except the generated `pnpm-workspace.yaml` and `evidence.config.ts`, whose content differs by kind, and the root `_gitignore`, whose rename npm pack forces.

## @evidence contracts/development/common.md#meaningful-documentation

The comment lists every kind's layers and generated files, shared skills, source notes, renames, substitutions, line endings, version sources and failures.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each file is listed and read once. Source lines, tokens and line endings take a fixed number of linear scans, plus each directory's sort.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads the scaffold as installed now, once per creation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Files are read with `readFileSync`, which releases its handle before returning; only the returned map, owned by the caller, outlives the call.
