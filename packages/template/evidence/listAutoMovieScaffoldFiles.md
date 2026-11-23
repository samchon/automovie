# src/listAutoMovieScaffoldFiles.ts#listAutoMovieScaffoldFiles

## @evidence contracts/development/implementation.md#principled-implementation

A depth-first walk over `readdirSync` with file types visits each entry once without a stat per entry; names are compared with relational operators, which order by code unit independent of the host locale, unlike `localeCompare`; skipping symbolic links relies on the premise that the authored scaffold contains none, so a link is never shipped as a copy of its target.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The two exclusion constants are the whole shipping policy and sit beside the walk, so `createAutoMovieScaffold` and the prepare script receive the population without deciding it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exclusions are by directory name and output-file shape only, with no exception for any particular file or fixture.

## @evidence contracts/development/common.md#meaningful-documentation

The comment lists every excluded directory and file shape, states that links are skipped, and states the path form and the order of the result.

## @evidence contracts/development/implementation.md#efficient-algorithms

The walk is linear in the number of entries under `root` plus a per-directory sort of its entries, never descending into an excluded directory, so a populated `node_modules` costs one skipped entry.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call lists the directory as it is on disk now, and each caller lists once per scaffold layer or shared item.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources `readdirSync` opens and closes each directory before returning, the recursion depth equals the scaffold's directory depth, and only the result array is retained, holding one string per shipped file.
