# src/validation/appendGraphCycles.ts#appendGraphCycles

## @evidence contracts/development/implementation.md#principled-implementation

Three-color depth-first search, where a back edge to a node still on the path is exactly the witness of a directed cycle; the explicit stack reproduces the recursive visiting order, so the same back edges are reported in the same order, without the recursion depth limit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One cycle walk shared by the lineage graphs and the building's element and space hierarchies, which previously kept a recursive `appendCycles` and a recursive `appendHierarchyCycles`; callers supply the path, value and message their record owns.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No graph or id is special-cased; dangling links are skipped by the stated rule because another check owns them, not to hide a cycle.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the visiting order, where and with what a cycle is reported, how dangling links and duplicate ids are treated, and why the walk is iterative.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(V + E) time for V nodes and E links, each node entered once and each link followed once, with O(V) space for the id index, the color map and the stack.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One walk over one graph per call; each validator calls it once per graph it owns.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The id index, color map and stack are local and released on return, each bounded by the node count; one violation per back edge is appended to the caller's collector.
