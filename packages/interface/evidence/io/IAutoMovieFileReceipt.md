# src/io/IAutoMovieFileReceipt.ts#IAutoMovieFileReceipt

## @evidence contracts/development/common.md#meaningful-documentation

States path resolution ownership, publication completion and revalidation on acquisition.

## @evidence contracts/development/design.md#principled-representation

Extending the common byte digest keeps path identity distinct from content identity without changing encoding semantics.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Ordinary artifact publication and checkpoint/frontier receipts use this same path-plus-digest identity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The receipt carries neither an open file handle nor geometry/completion claims beyond the stored publication.
