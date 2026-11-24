# src/draw/AutoMovieDialogueMouthStage.ts#AutoMovieDialogueMouthStage

## @evidence contracts/development/common.md#meaningful-documentation

States when the page shows the mouths, how an actor's node and figures are found, when a figure is shown a mouth or none, why the last showing wins, which actors record nothing, and when the page clears and reports the record.

## @evidence contracts/development/design.md#principled-representation

The track and the record of what the figures showed live in one object, so a report can only hold values a figure reported drawing; the record keys by actor and keeps each form only when a figure showed it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, each used by `AutoMovieDrawPlacement`: `show` after a placement, `clear` before the drawn second and `drawn` for the draw result. Sampling and the speaking line are engine's; the figures and their binding are render's scene modules.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no actor, figure or film, and reports copies, so neither a figure nor the host can change the record.

# src/draw/AutoMovieDialogueMouthStage.ts#AutoMovieDialogueMouthStage.prototype.show

## @evidence contracts/development/common.md#meaningful-documentation

States what is shown on which figures at which second, and what is recorded.

## @evidence contracts/development/implementation.md#principled-implementation

The speaker binding names the actor's scene node, which `buildScene` names by the node id, so the actor's figures are the bound objects under that node. A mouth is shown only while one of the actor's lines speaks, so the authored mouth stays outside every line, and the value recorded is the one the figure reports drawing, which is what #4055 measures.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass per actor: find the node, collect its figures, sample once, show each.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An actor with no node or no figure records nothing rather than the sampled value, so a mouth no figure drew is never measured as drawn.

## @evidence contracts/development/implementation.md#efficient-algorithms

Per call, O(A × N) for A actors and N objects of the scene, the name lookup and the node traversal, plus one mouth sample per speaking actor; the node is looked up each time because a subject may replace its objects in a placement.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each placement is shown once; nothing is cached across placements.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The record holds at most one entry per actor of the track until `clear`.

# src/draw/AutoMovieDialogueMouthStage.ts#AutoMovieDialogueMouthStage.prototype.clear

## @evidence contracts/development/common.md#meaningful-documentation

States the effect and when the page calls it.

## @evidence contracts/development/implementation.md#principled-implementation

A picture reports only what was shown while its own second was placed, so the record starts empty before that placement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map clear.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is kept across placements as a fallback.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time per entry.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Clearing shares nothing.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The release point of the record's entries.

# src/draw/AutoMovieDialogueMouthStage.ts#AutoMovieDialogueMouthStage.prototype.drawn

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned and its order.

## @evidence contracts/development/implementation.md#principled-implementation

Each entry is the last value of each form the actor's figures showed since the last clear, which after the drawn second's placement is that picture's mouth.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Copy the record's entries in first-shown order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No absent form is filled in, so a jaw-driven figure is never reported as viseme-driven.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the actors shown and their viseme weights.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call copies the current record.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The copies are the caller's; the record keeps one entry per actor shown.
