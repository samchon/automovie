# src/internal/index.ts#markdownFiles

## @evidence contracts/development/implementation.md#principled-implementation

Recursively enumerate entries without traversing directory symlinks; include Markdown symlink paths so later safety checks can reject them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Inventory returns slash-normalized names while protectedFileKind owns physical-file validation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeping symlink names prevents unsafe selected paths from disappearing silently.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the traversal rule; returned values are paths rather than contents.

## @evidence contracts/development/implementation.md#efficient-algorithms

Traversal visits entries; nested flatMap copying can repeat path-array work with directory depth.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each root is inventoried independently because its current directory population may differ.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Synchronous readdir leaves no open handles; names and recursion grow with tree size without a fixed cap.
