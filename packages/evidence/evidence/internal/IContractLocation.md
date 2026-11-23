# src/internal/IContractLocation.ts#IContractLocation

## @evidence contracts/development/design.md#principled-representation

Two absolute directories represent the two owners a contract can have, the production and the shared bundle; the optional member encodes the standalone layout, where the shared bundle sits under the production's own `.agents/skills`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the two directories that decide where a contract resolves; route, stages and claims stay with the configuration types that carry this shape.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No flag says "workspace": the owner is the directory itself, and an omitted `skills` is the standalone default rather than a guessed location.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states which families each directory owns and the omitted default; the members state they are absolute.
