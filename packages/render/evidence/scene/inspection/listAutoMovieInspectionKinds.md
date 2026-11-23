# src/scene/inspection/listAutoMovieInspectionKinds.ts#listAutoMovieInspectionKinds

## @evidence contracts/development/common.md#meaningful-documentation

States the order, where each label and colour come from, when the conditional kinds exist, how a name clash is listed, and who reads the list.

## @evidence contracts/development/implementation.md#principled-implementation

A kind exists when something can draw it: a supplied mark, a mesh measurement that needs no input, a sliver measurement that needs its limit, or a trail the request asks for.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the supplied marks, then one over the inspection's own table with its two conditions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The inspection's own kinds are read from their one table, not restated, and no supplied kind is named.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the supplied marks, with one hashed lookup each.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and keeps nothing.
