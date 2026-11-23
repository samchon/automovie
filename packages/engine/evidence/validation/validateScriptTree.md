# src/validation/validateScriptTree.ts#validateScriptTree

## @evidence contracts/development/implementation.md#principled-implementation

Indexes the first declaration of each node id, admits parent-kind pairs through the closed refinement table and joins beat ids one to one. Parent edges form a functional graph; iterative path coloring detects cycles and memoizes their first repeated node for each ancestor, preserving one diagnostic per cyclic chain without repeated walks. Intent metadata compares exact strings because renderScreenplay prints them verbatim.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns graph and payload consistency at the script commit seam; the private cycle pass shares the same id index and collector. Flat logline and theme are explicit inputs rather than inferred from the tree being checked, so the duplicate representation has an independent authority.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Duplicate nodes keep their first diagnostic location, every beat must join exactly one node, and dangling or cyclic references are reported rather than repaired. No payload is trimmed or rewritten; trim only decides whether text is blank, while differing nonblank headers still fail.

## @evidence contracts/development/common.md#meaningful-documentation

Lists graph, beat, anchor and editorial payload gates, states the flat-header authority and the later ownership of cross-edge feedback. Inputs identify their source and all refusals are accumulated in the returned validation.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N nodes, B beats, X cross edges and D dialogue lines, indexing, graph traversal and joins take O(N+B+X+D) operations plus inspected text lengths, with O(N+B) index space. Cycle paths are iterative and completed once, avoiding quadratic ancestor walks and a depth-dependent call stack.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares one first-declaration node index across roots, parent edges, cross references and cycles, and memoizes completed parent chains only during this synchronous validation; no result is reused after mutable script inputs can change.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns indexes, cycle paths and collector until return; transient state is bounded by node and beat counts, with violations growing by the failing authored fields. Only the validation and its violations transfer to the caller, with no retained cache or handles.
