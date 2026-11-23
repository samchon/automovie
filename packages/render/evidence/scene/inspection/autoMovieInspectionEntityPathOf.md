# src/scene/inspection/autoMovieInspectionEntityPathOf.ts#autoMovieInspectionEntityPathOf

## @evidence contracts/development/common.md#meaningful-documentation

States the segment, disambiguator, unnamed-node and root rules, and when the result matches the shared name path.

## @evidence contracts/development/implementation.md#principled-implementation

A segment is unique among the named nodes under the same nearest named ancestor, and unnamed indices are unique in their parent, so by induction from the root the joined path is unique.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One walk to the root collects named segments and unnamed indices, then one join.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No uuid, visit order or film time enters, so the identity is stable across samples and hosts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each named segment needs its ancestor's frontier of named nodes through unnamed wrappers. Without a memo a path costs the sum of those frontiers along its depth; with one shared memo, naming every node of a graph scans each frontier once, linear in the graph.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Keeps the shared name path for unique names, so existing selections and labels still match, and lets callers share frontier scans across one sample.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a string. Only the caller's optional memo retains nodes, for as long as the caller keeps it.
