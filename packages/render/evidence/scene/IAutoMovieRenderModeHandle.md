# src/index.ts#IAutoMovieRenderModeHandle

## @evidence contracts/development/design.md#principled-representation

A pass handle pairs the selected guide mode and semantic coverage facts with exact restoration of temporary viewer state, keeping deterministic engine declarations unchanged across captures.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Restoration and semantic accounting travel with the override that produced them, so callers do not reconstruct touched material or visibility state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Borrowed original materials survive restoration; only override-created resources are disposed, and semantic unaddressed/unresolved facts remain visible rather than reported as painted.

## @evidence contracts/development/common.md#meaningful-documentation

Describes reversible material/visibility/background/overlay changes, temporary-resource release, borrowed ownership and idempotent restore.

# src/index.ts#IAutoMovieRenderModeHandle.update

## @evidence contracts/development/implementation.md#principled-implementation

The copy is rewritten from the scene's current transforms, so the override and the surfaces it stands for are drawn from one instant.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One optional callback on the handle that owns the copy; an override without a copy carries none, so its absence says nothing needs refreshing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The override is refreshed in place and not restored and applied again, which would dispose and recompile its materials every frame.

## @evidence contracts/development/common.md#meaningful-documentation

States what it refreshes, which overrides have it, and who calls it when.

## @evidence contracts/development/implementation.md#efficient-algorithms

Work follows the copied population, the bone links or the shells, with no allocation of geometry or material.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The geometries, shells and materials built at application are reused for every frame.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond what application already owns; `restore` still releases all of it.

# src/index.ts#IAutoMovieRenderModeHandle.restore

## @evidence contracts/development/implementation.md#principled-implementation

Restores captured original state and retires resources created by the pass, separating viewer projection changes from immutable engine data.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One callback carries the owning override's restoration plan instead of exposing a mutable undo list to consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Restoration preserves borrowed original material identity and does not rebuild source geometry as a substitute for undoing temporary changes.

## @evidence contracts/development/common.md#meaningful-documentation

States complete undo and limits idempotent success to an actually completed restoration.

## @evidence contracts/development/implementation.md#efficient-algorithms

Restoration work follows the touched material/visibility population and temporary overlay resources rather than rebuilding the entire scene.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A successfully restored handle avoids repeating its owned release effects; failed restoration follows the implementing owner's failure policy.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The applied override owns its temporary state/resources until this callback completes; failures remain the owning handle's responsibility rather than authorizing disposal of borrowed scene originals.
