# Editing Handbook

Editing authors time and relation. The EDL is not a dump of every rendered shot; it is a deliberate selection of source intervals whose order, duration, transitions, and sound offsets create the film.

## Choose the cut

Choose each cut and hold from its authored dramatic change.

Use Walter Murch's priority order when criteria conflict:

1. emotion;
2. story;
3. rhythm;
4. eye trace;
5. the two-dimensional screen plane;
6. three-dimensional spatial continuity.

Protect higher priorities first. This does not license arbitrary discontinuity: identify what a lower-rule break buys, ensure the viewer can still follow what matters, and declare it in style intent when the shot contract requires.

## Coverage and rhythm

Select source intervals that carry the authored beat and preserve its action, pose, eyeline, prop, light and ambience continuity. Timing and transition choices must retain required information and consequences.

Evaluate cuts at the exact reduced rational delivery frame rate and snap edits to that production frame grid. A decimal `fps` is only a display projection and must never be used to reconstruct a fractional clock. Map destination audio samples, WebVTT milliseconds, and MP4 ticks from the same integer frame boundaries with the shared nearest-half-up rule. Check source interval bounds, exact output frames, and transition overlap. A transition consumes time from both sides and must not erase the action or line it is meant to connect.

## EDL discipline

Each edit decision names the source shot, source offset, source duration, destination interval, transition, and audiovisual intent. Preserve source offsets for L-cuts, J-cuts, dialogue overlap, ambience continuity, and action matching. Do not retime a semantic event without updating acceptance and sound consequences.

Preserve sound source ownership and exact timeline offsets across J-cuts, L-cuts and overlaps.

## Measure the boundary

Watching a cut tells you whether it reads. It does not tell you that the actor stands where the previous beat left them, because half a metre of drift at a wide angle is invisible and half a metre in the next close-up is the shot.

`validateFilmContinuity` walks a film's beats in playback order and compares each beat's opening state against the previous beat's end state, per actor: world position drift past `positionTolerance` metres, facing drift past `facingToleranceDeg` degrees, a persistent mount that was dropped or changed, and an actor missing entirely from the incoming opening. `validateContinuity` is the same comparison for one boundary you already hold both sides of.

Drift is advisory, never a gate. A hard cut may legitimately jump an actor to a new mark for a time skip or new blocking, so the finding names the actor, the offset, and the tolerance and leaves the decision with you. It rides `warnings` on a validation whose `success` is `true`, the same tier [Motion](motion.md) describes.

Order the beats by the timeline rather than by whatever order the compiled shots happen to enumerate in. A continuity check run over the wrong order reports drift between shots that never touch.

Pass the current producer's shot results to `validateFilmContinuity` in actual timeline order. Preserve repeated occurrences and their source-time intervals. A missing shot is a missing input to repair, not an empty array to skip. Read warnings as well as failures before recording a continuity observation.

## Review pass

Watch once without stopping for story and emotion, once with the frame ruler for continuity and event timing, and once listening without looking for dialogue, ambience, rhythm, and accidental silence. Inspect every boundary in both directions. Sequence review owns local cut logic; film review owns the accumulated pace and narrative completion.

## Look at the cut

Follow [Capture](../review-verification/capture.md) and [Production review](../review-verification/review.md). Inspect each cut's outgoing and incoming exact frames plus an adjacent frame on each side. Judge local cut logic and accumulated whole-film pace at their respective scopes.
