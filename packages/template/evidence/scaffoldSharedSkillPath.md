# src/scaffoldSharedSkillPath.ts#scaffoldSharedSkillPath

## @evidence contracts/development/implementation.md#principled-implementation

The path is split on the host separator that the listing uses, and the item path keeps every directory between `.agents/skills` and the placeholder, so a placeholder at any depth names the item at the same depth; the name must be one portable segment other than `.` or `..`, so the result cannot leave `.agents/skills`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One predicate owns the placeholder rule for both the build step that copies the named items and the reader that ships them, so the two cannot disagree on which files are placeholders.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The rule depends only on the `$` prefix and the location under `.agents/skills`, with no list of particular skills or files.

## @evidence contracts/development/common.md#meaningful-documentation

The comment defines a placeholder, gives both the folder and file forms, states what the build and the reader do with it, and describes the parameter's separator and the result's form.

## @evidence contracts/development/implementation.md#efficient-algorithms

Splitting the path and testing one name is linear in the path length.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call classifies one path from its text alone; there is no shared work to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only call-local component arrays are allocated; no filesystem resource is acquired.
