# src/internal/index.ts#readSettingsFiles

## @evidence contracts/development/implementation.md#principled-implementation

Concrete directory entries select legacy flat Markdown, the scaffold's closed domain folders or numbered subject folders, forbid mixed/nested/symlinked layouts, exclude the shared NUMBERED_FILE grammar from domain filenames, enforce unique three-digit order keys for numbered folders and return deterministic relative reading order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The filesystem reader owns canon layout validation; callers build outline and evidence relationships from the returned order without rewriting existing files.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Legacy flat settings and numbered folders stay supported; absent settings return empty, while unknown domains, malformed names, numbered files inside domains, mixed layouts, duplicate order keys and symlinks fail for every production. Domain admission excludes exactly the existing numbered-file grammar, preserving other digit-bearing lower-kebab-case names.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the scaffold domain layout and its reading order, numbered and legacy retention, and that outline is navigation; errors identify mixed layouts, naming, empty folders, nesting and duplicate order numbers.

## @evidence contracts/development/implementation.md#efficient-algorithms

For e root/subject entries, directory enumeration and name validation scan entry text; sorting folders and entries costs O(e log e) comparisons in the worst distribution, with O(e) output/sets and directory arrays. No canon bytes are read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each directory is listed once per call and duplicate-number sets avoid repeated pairwise comparisons; later calls rerun because current settings topology can change.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Listings and relative file arrays live for one call or in its returned result; synchronous filesystem operations leave no retained handles/tasks and no fixed count bound is imposed.
