# src/geometry/construction/AutoMovieConstructionState.ts#AutoMovieConstructionState

## @evidence contracts/development/common.md#meaningful-documentation

States what the walk keeps, what the snapshot records and what the rollback restores.

## @evidence contracts/development/design.md#principled-representation

Represents What a construction's walk builds besides the body (`realizeAutoMovieConstruction`), and its rollback: a snapshot of the body's faces, cycles, mesh and the walk's lists taken before a part is built, restored when the node attaching that part breaks a premise, so the part's whole subtree is left out and its host stands as it was: companion namespace of 6 members (`IState`, `IOverride`, `ISnapshot`, `snap`, `restore`, `copy`); units and frames named in its text: local, second, byte. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieConstructionState` in packages/engine/src/geometry/construction/AutoMovieConstructionState.ts; its surface is the 6 members listed and the text shows 8 other files naming it, mostly packages/engine (7), test (1), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/geometry/construction/AutoMovieConstructionState.ts#AutoMovieConstructionState.snap

## @evidence contracts/development/implementation.md#principled-implementation

Copies mutable cycles and inverted flags while recording append-only population lengths and current face names, matching the realization's actual mutation responsibilities.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One explicit checkpoint constructor keeps all restored fields visible beside restore.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not claim a full state clone: diagnostics, overrides, existing mesh values and immutable surface/station data remain outside this checkpoint.

## @evidence contracts/development/common.md#meaningful-documentation

ISnapshot states saved fields, array-entry units, excluded state and the append/edit premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(F+C) face/name/cycle copying stores only data that may be edited plus scalar array lengths, avoiding an O(V+T) mesh copy at every attaching node.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Existing mesh arrays and realized operator records remain shared; each mutable cycle is copied once for this particular checkpoint.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the new face/cycle/name snapshot until the node succeeds or rolls back; nested checkpoints scale with their captured populations and no process cache is used.

# src/geometry/construction/AutoMovieConstructionState.ts#AutoMovieConstructionState.restore

## @evidence contracts/development/implementation.md#principled-implementation

Truncates appended faces/mesh/owners/blends/output lists, restores saved cycles/inverted flags and deletes post-checkpoint face/chain names under global name uniqueness.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

In-place restoration preserves the host's object identity and existing mesh numbers without reconstructing its geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not rewind diagnostics/overrides or arbitrary changes to preexisting mesh/surface fields; the caller must use the documented append-and-cycle-edit transaction model.

## @evidence contracts/development/common.md#meaningful-documentation

States which state survives, cycle-array transfer and the checkpoint's limited mutation coverage.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits saved faces/current names and truncates appended populations; no surface solve or tessellation is repeated, and array truncation may release a number of entries proportional to discarded output.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the saved cycle arrays and untouched prefix mesh values; saved arrays subsequently become the live mutable face cycles rather than an immutable reusable snapshot.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Discarded array/map entries lose their owning references and saved cycles transfer to the body; the caller then releases the checkpoint when its node settles.
