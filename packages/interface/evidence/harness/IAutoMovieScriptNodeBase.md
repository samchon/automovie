# src/harness/IAutoMovieScriptNodeBase.ts#IAutoMovieScriptNodeBase

## @evidence contracts/development/design.md#principled-representation

A parent-pointer tree and id cross references share the validator's first-declaration index; iterative path coloring refuses refinement cycles. Admitted parents lead to the intent root, while temporal/interaction edges are checked only for existence and non-self references, not cycles or chronology.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shared fields live once here and each node kind adds only its `kind` and payload, so the validator and the walkers read the edges without per-kind code.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Self cross references refuse, while repeated interaction ids and cross-edge cycles are not rejected or given runtime meaning. The low-level graph validator assumes declared record/array shapes and can skip sparse forEach slots or throw on malformed nested values; project shape admission remains a separate boundary, and prose meaning is not graded.

## @evidence contracts/development/common.md#meaningful-documentation

States every validator rule on the shared fields, which edge has consumers and who they are, and that the cross edges are only checked; members give each edge's direction and what `null` means.
