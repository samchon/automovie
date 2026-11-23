# src/animals/EquineComfortRows.ts#EquineComfortRows

## @evidence contracts/development/common.md#meaningful-documentation

States each row, the shared support rules and that amplitudes are authored.

## @evidence contracts/development/design.md#principled-representation

Each row is a stance plan: start and end states, a pose by share and, for the paw and the shake, a pose by second of the hold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `EquineStanceRows.plan` for the comfort rows.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No sliding support: a planted hoof keeps its anchor and a moving hoof is lifted or scrapes on the floor plane by intent.

# src/animals/EquineComfortRows.ts#EquineComfortRows.owns

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

A set of the rows' kinds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The kinds are built once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineComfortRows.ts#EquineComfortRows.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the output and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

One branch per row, each moving the weight before any release.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A dispatch over private rows.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reach and floor are left to the stance's admission, never clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the stance's support rules.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds its states and chains.
