# src/architecture/createWindow.ts#createWindow

## @evidence contracts/development/implementation.md#principled-implementation

A wall panel below the sill, two jambs and a head surround two full-height stiles and two rails between them, with a nonoverlapping pane in their clear opening. Named authored rail width, sash depth and pane thickness determine those solids. A casement's downward hinge axis on `+X` swings it toward `-Z`; sliders run up or toward `-X`. The parent articulation binds all sash geometry, and fracture retains its surviving rails and handle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, build the surround and the sash, place the handle, then the articulation and the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

One sash, no glazing bars or fixed sliding half. Rail construction and equal-density volume-based mass allocation are authored approximations. The pane leaves whole, without an invented shard pattern. No bag-impact reference or universal glass threshold is substituted for the author's specimen calibration.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ten primitive parts and four affordances; work and storage are constant per window.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the window's plane, which side the room is on and what moves.
