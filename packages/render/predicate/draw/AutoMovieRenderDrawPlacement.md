# src/draw/AutoMovieRenderDrawPlacement.ts#AutoMovieRenderDrawPlacement

## @evidence contracts/development/common.md#meaningful-documentation

The class documentation describes the placement, framing and dialogue states it owns and the source clock used for each picture and sampled path.

## @evidence contracts/development/design.md#principled-representation

This object binds a draw host to one subject and renderer. Film entries own sample clocks, the common trail function owns observations and the inspection handle restores changes before a new pose is placed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The constructor keeps one subject and renderer. The draw request and observer stay scoped to the inspection call. The class exposes the settled handle to the host, which owns presentation and cleanup.

# src/draw/AutoMovieRenderDrawPlacement.ts#AutoMovieRenderDrawPlacement.prototype.inspect

## @evidence contracts/development/common.md#meaningful-documentation

The method identifies the settled pose, world trail marks, the observer called before applying inspection changes, and the callback that receives the trail samples used for the marks.

## @evidence contracts/development/implementation.md#principled-implementation

Restore every temporary inspection mutation before changing the subject. Use the shared played trail sampler for the requested paths, then place the shot actually shown at the drawn second. Read that second's original scene and its marks before applying the new inspection. The optional trail callback receives the same sampled segments.

## @evidence contracts/development/implementation.md#efficient-algorithms

A request without trail paths goes straight to its one drawn pose. A selected request shares each bounded sample placement across paths and requests no extra observation during final draw. The returned inspection holds only the current application and its marks. Restoring it releases those marks.
