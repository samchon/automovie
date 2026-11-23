# src/internal/collectExternalResources.ts#collectExternalResources

## @evidence contracts/development/implementation.md#principled-implementation

Buffers preserve declared byte lengths; images carry null lengths, while repeated URIs must agree on role and buffer extent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One URI-keyed map owns conflict detection and deterministic resource ordering shared by every ingest profile.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Data URIs are excluded, conflicting roles/lengths throw, and URI spelling is preserved rather than normalized into aliases.

## @evidence contracts/development/common.md#meaningful-documentation

Prose identifies exact URI ownership, buffer/image length meaning, conflict behavior and code-unit ordering.

## @evidence contracts/development/implementation.md#efficient-algorithms

B buffers and I images cause B+I expected map operations over exact URI strings; U distinct resources require O(U log U) comparisons, each scanning at most the compared shared prefix, with string identity/hash work dependent on URI text.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One map coordinates exact URI conflict checks and the final unique inventory; repeated declarations replace their scalar row, while byte resolution remains a separate effectful payload owner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only U scalar resource records survive in the result; the temporary map retains no resident sidecar bytes.
