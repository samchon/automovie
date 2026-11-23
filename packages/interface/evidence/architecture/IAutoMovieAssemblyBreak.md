# src/architecture/IAutoMovieAssemblyBreak.ts#IAutoMovieAssemblyBreak

## @evidence contracts/development/design.md#principled-representation

A plain record of a one-sided role: `matchAutoMovieAssemblyJunction` emits one for every role name found in one build-up's layers and absent from the other's, comparing names by exact string equality and summing `thickness` over every layer of that role on the carrying side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three fields, the role, the carrying side and its summed depth, which is what a caller needs to say which barrier stops at the junction and how much of it; no span is kept because a one-sided role has nothing to line up against.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Role names are neither trimmed, case-folded nor aliased, so `Insulation` and `insulation` are two roles, and the matcher applies no role-specific rule or fixture exception when it fills this record.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, that roles are compared exactly as authored, that `side` names the build-up carrying the role, and that `thickness` is in metres and sums every layer of the role on that side.
