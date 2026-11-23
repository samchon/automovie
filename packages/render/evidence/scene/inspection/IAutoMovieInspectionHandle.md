# src/scene/inspection/IAutoMovieInspectionHandle.ts#IAutoMovieInspectionHandle

## @evidence contracts/development/design.md#principled-representation

An applied inspection is temporary scene state, so it is held as a handle whose `restore` ends it, the form the render-mode override already has.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The legend and the selected paths a record stores, and the calls a host makes; the undo list, the overlays and the isolated objects stay inside the owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The legend reports what was drawn, so a kind that was asked for and not found is absent instead of listed with a zero that reads as a mark. `legend` and `selected` are the same arrays for the handle's life and are rewritten in place when `update` is given new marks, so a reader holding them reads the current picture.

## @evidence contracts/development/common.md#meaningful-documentation

States what the handle stands for, that its two lists follow the current marks, and when each call is made.

# src/scene/inspection/IAutoMovieInspectionHandle.ts#IAutoMovieInspectionHandle.update

## @evidence contracts/development/common.md#meaningful-documentation

States what moves, what replacing the marks does and how they are selected, when to call it and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The shade is brought up to date, world matrices are refreshed, measured marks are reread from the posed surfaces, then every mark is placed from them, so the shade, the marks and the surfaces are drawn from the same instant.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call covers the shade, the supplied marks and the measured ones.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Defects are not measured again: topology does not change with pose, only positions do. New marks are checked before the old ones are released.

## @evidence contracts/development/implementation.md#efficient-algorithms

One world-matrix pass, then work linear in the marks, the outline's shells and the pose's bone links; new marks add one build linear in their vertices.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Measured marks, built buffers and the shade's shells, segments and materials are reused for every frame of the run.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Replacing the marks releases the previous ones' geometries and materials; otherwise nothing outlives the call.

# src/scene/inspection/IAutoMovieInspectionHandle.ts#IAutoMovieInspectionHandle.resize

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, what the size decides and when three.js sets it itself.

## @evidence contracts/development/implementation.md#principled-implementation

A screen-space line is widened in clip space by its width over its material's resolution.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Forwards the size to every built overlay.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A size that is not two positive finite numbers throws instead of drawing lines of an undefined width.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant per line object.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

An assignment computes nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing.

# src/scene/inspection/IAutoMovieInspectionHandle.ts#IAutoMovieInspectionHandle.labels

## @evidence contracts/development/common.md#meaningful-documentation

States what is labelled, where a label is anchored, what is dropped, the parameters' units and how hosts use the result.

## @evidence contracts/development/implementation.md#principled-implementation

Boxes are measured on the scene as drawn now, objects and marks alike, and placed by the shared placement owner, so a label names what the picture shows at its place.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Measure the labelled paths' boxes, then place them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A label is never moved to make room; it is kept at its anchor or reported as dropped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the labelled objects' drawn vertices and marks' coordinates, plus the placement's pass.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The pose and camera change between calls, so nothing is reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain records and keeps nothing.

# src/scene/inspection/IAutoMovieInspectionHandle.ts#IAutoMovieInspectionHandle.bounds

## @evidence contracts/development/common.md#meaningful-documentation

States what is measured with and without a focus, the null case, the refusal and the use.

## @evidence contracts/development/implementation.md#principled-implementation

The box is measured on the scene as isolated, so a partial view is framed on its part.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call with no argument, answered by the bounds owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An empty selection is null, not a box at the origin.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the drawn vertices, measured only when asked.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The pose changes between calls, so no earlier box is valid to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain numbers and keeps nothing.

# src/scene/inspection/IAutoMovieInspectionHandle.ts#IAutoMovieInspectionHandle.restore

## @evidence contracts/development/common.md#meaningful-documentation

States everything that is put back and the repeated-call behaviour.

## @evidence contracts/development/implementation.md#principled-implementation

Changes are undone in the reverse of the order they were made, so a later step never restores onto an earlier step's temporary state.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call replays one undo list.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every undo step is attempted even when one fails, and the failures are reported together.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in what was changed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A restore computes nothing to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

After the call the scene holds none of the inspection's objects or materials.
