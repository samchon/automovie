# src/harness/IAutoMovieScriptNode.ts#IAutoMovieScriptNode

## @evidence contracts/development/design.md#principled-representation

A discriminated union on `kind`, so each consumer narrows to the payload it prints or checks, and `validateScriptTree` judges parent-child pairs against one table of allowed parent kinds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five node records sharing `IAutoMovieScriptNodeBase`, each adding only its `kind` and payload, instead of one node with optional per-level fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No inverted nesting is accepted, such as an act under a scene, and no node kind is skipped by the validator or the walkers.

## @evidence contracts/development/common.md#meaningful-documentation

States what the tree refines, why payloads differ per kind, the full allowed-parent table, that beats are leaves, and how feedback reaches the upper levels.
