# src/draw/AutoMovieDrawPlacement.ts#AutoMovieDrawPlacement

## @evidence contracts/development/design.md#principled-representation

One page's placement state: the subject's name, which a refused plan names, the inspection bound to the objects the last placement produced, the framing box per view text, selection and span of seconds on the subject's clock, and the mouth recorder of the handed track.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The draw host, `installAutoMovieDraw`, calls every public member; the subject, the renderer and the inspection core's types are borrowed from their owners, and which shot each second places is `planAutoMovieDrawPicture`'s and `placeAutoMovieDrawLayer`'s.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member names a subject or a pass; the framing key is the request's own fields.

## @evidence contracts/development/common.md#meaningful-documentation

The class comment states which shot every placement places and on which clock, what `inspect`, `frame`, `restore` and `speak` do, in which order a placement clears the mouths and places, and what `mouths` reports.

# src/draw/AutoMovieDrawPlacement.ts#AutoMovieDrawPlacement.prototype.speak

## @evidence contracts/development/common.md#meaningful-documentation

States that only a subject with `speak` is handed the mouths.

## @evidence contracts/development/implementation.md#principled-implementation

Wraps the track in `AutoMovieDialogueMouthRecorder` and hands its mouths to the subject once, so every later read is recorded.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The recorder owns the record; this method only binds it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A subject without `speak` is left untouched and reports no mouths rather than a made-up record.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One binding per page; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The recorder is held for the page's life, replacing any earlier one.

# src/draw/AutoMovieDrawPlacement.ts#AutoMovieDrawPlacement.prototype.mouths

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned and when it is absent.

## @evidence contracts/development/implementation.md#principled-implementation

Returns the recorder's reads since the last clear, which `place` makes right before the drawn second's placement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A read of the recorder it owns.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Undefined without a recorder, so a subject without `speak` reports no mouths.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the actors read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call copies the current record.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing new.

# src/draw/AutoMovieDrawPlacement.ts#AutoMovieDrawPlacement.prototype.restore

## @evidence contracts/development/common.md#meaningful-documentation

States when the host calls it.

## @evidence contracts/development/implementation.md#principled-implementation

Restores and forgets the applied inspection, so a placement the host makes itself, a shutter sample or a transition's outgoing shot, sees the scene without inspection changes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The inspection handle owns what is restored.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Idempotent: a second call finds nothing applied.

## @evidence contracts/development/implementation.md#efficient-algorithms

The handle's own restore cost.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Releases the applied handle.

# src/draw/AutoMovieDrawPlacement.ts#AutoMovieDrawPlacement.prototype.inspect

## @evidence contracts/development/common.md#meaningful-documentation

States what is placed, the refusal, when `onPlaced` runs and what is bound.

## @evidence contracts/development/implementation.md#principled-implementation

Placement goes through `replaceAutoMovieDrawInspection`, which restores the previous handle before placement, so a subject may replace its objects during a seek, and binds the request to the objects the placement left with their current marks and sampled trails; the shot the picture shows, planned by `planAutoMovieDrawPicture`, is placed on its own entry's clock by `placeAutoMovieDrawLayer` at every trail time and then at the drawn second, so trails trace that shot and never the previous one across a cut; the observer reads the settled scene before any inspection change.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Placement and trail sampling are the private `place`; binding is the inspection core's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The applied handle is cleared before the await, so a failed placement leaves no stale handle to restore twice.

## @evidence contracts/development/implementation.md#efficient-algorithms

One plan and one placement plus the request's trail samples, then the inspection's own measurement of the current objects.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Handles are never reused across placements, because a seek may replace geometry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one applied handle at a time.

# src/draw/AutoMovieDrawPlacement.ts#AutoMovieDrawPlacement.prototype.frame

## @evidence contracts/development/common.md#meaningful-documentation

States that the box is a fitted view's over the call's seconds.

## @evidence contracts/development/implementation.md#principled-implementation

Places and inspects each framing second through `inspect`, so as the shot that second's picture shows, and unites the boxes of what the inspection leaves drawn or its focus, so one camera frames a whole run on the shots it shows.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Boxes are the handle's; the union is the private `unite`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The key is every request field that changes what is drawn and the seconds, with no subject special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

One placement and inspection per framing second on the first call for a key, constant afterwards.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Boxes are cached per view text, selection and seconds, the inputs that decide them for one subject.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One box per distinct key for the page's life; no bound beyond the run's distinct views.
