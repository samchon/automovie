# src/draw/AutoMovieDrawSession.ts#AutoMovieDrawSession

## @evidence contracts/development/common.md#meaningful-documentation

States what the session holds, which calls make pictures and how, the timeout's effect, the no-overlap rule, and shows the open, plan, draw and close order.

## @evidence contracts/development/design.md#principled-representation

An opened page with a described subject, so a session that exists can always draw; the backend text joins what launched the browser with the renderer the page reported, because the record must name both.

## @evidence contracts/development/design.md#minimal-and-owned-surface `open`, `speak` for a film's dialogue mouths, `drawing` for the capture run, `frame` for a delivery's passes, `draw` beneath both, `close`; the subject, the renderer and the backend are read by hosts to plan and to report.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The page is reached only through the structural page, so a test drives every rule with a recording double.

# src/draw/AutoMovieDrawSession.ts#AutoMovieDrawSession.open

## @evidence contracts/development/common.md#meaningful-documentation

States the four steps, the refusals and who owns the page after a refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The props go in through an init script, the JSON of the props assigned to their global, which runs before the page's own modules, so the subject module reads them at its first line, as Remotion's renderer hands props to its bundle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Inject, load, wait, describe, each one page call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing draw function is an error naming the address, never a fallback to screenshots.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four page calls; describing creates the subject once, which every later picture reuses.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The created subject and the page's renderer serve every call of the session.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned session owns the page until `close`.

# src/draw/AutoMovieDrawSession.ts#AutoMovieDrawSession.prototype.speak

## @evidence contracts/development/common.md#meaningful-documentation

States what is handed, when, what later pictures carry and the two rejections.

## @evidence contracts/development/implementation.md#principled-implementation

The track crosses into the page once as JSON, so every later draw, at any second and in any pass, samples the same mouths the host planned.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bounded page call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A failed or slow hand-over is an error, never skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

One page call linear in the track's size.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per session.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The page holds the track for its life; the session holds nothing.

# src/draw/AutoMovieDrawSession.ts#AutoMovieDrawSession.prototype.draw

## @evidence contracts/development/common.md#meaningful-documentation

States the result and the three rejections.

## @evidence contracts/development/implementation.md#principled-implementation

One page call per picture; the decode checks the size the call asked for.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Call, bound, decode.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A slow or failed picture is an error, never retried.

## @evidence contracts/development/implementation.md#efficient-algorithms

One page call and one decode linear in the picture.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call is a different picture.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one picture's text and bytes at a time.

# src/draw/AutoMovieDrawSession.ts#AutoMovieDrawSession.prototype.drawing

## @evidence contracts/development/common.md#meaningful-documentation

States what is drawn and what each returned member holds.

## @evidence contracts/development/implementation.md#principled-implementation

The cell becomes the page call by the shared planner, so a cell's second, view, pass, request and raster reach the page as planned.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plan the call, draw it, shape the drawing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Failures reach the capture run, which records the cell as not drawn.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each cell is a different picture.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The picture is the caller's.

# src/draw/AutoMovieDrawSession.ts#AutoMovieDrawSession.prototype.frame

## @evidence contracts/development/common.md#meaningful-documentation

States the view, the raster, the order and the one call per pass; each pass carries the page's diagnostics, mask palette and drawn mouths as reported.

## @evidence contracts/development/implementation.md#principled-implementation `.agents/skills/visual-debugging/passes.md`: every pass of a set is drawn from the same evaluated state, so each pass is the same second through the same `film` view with only the shade changed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One draw per pass with the default inspection and the pass as its shade.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No screenshot and no injected style: the page draws each pass itself.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw per pass, which is the minimum since every pass is another picture.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each pass is a different picture.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns every pass's picture of the frame; the caller writes and drops them.

# src/draw/AutoMovieDrawSession.ts#AutoMovieDrawSession.prototype.close

## @evidence contracts/development/common.md#meaningful-documentation

States the effect.

## @evidence contracts/development/implementation.md#principled-implementation

Closing the page releases its scene and renderer with it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One driver call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A close failure propagates.

## @evidence contracts/development/implementation.md#efficient-algorithms

One call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Closing happens once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The release point of the page the session owns.
