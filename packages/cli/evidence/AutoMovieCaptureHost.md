# src/AutoMovieCaptureHost.ts#AutoMovieCaptureHost

## @evidence contracts/development/common.md#meaningful-documentation

States what open loads, builds and launches, every step of a capture, what close releases, and both users, and shows the order.

## @evidence contracts/development/design.md#principled-representation

A host keeps the three long-lived resources a capture needs and their render module. A capture takes a request, module props and a folder, with optional destination admission and storage supplied by the caller.

## @evidence contracts/development/design.md#minimal-and-owned-surface `open`, `capture`, `close`, and the `backend` the command reports; planning, drawing, files and records are the render package's.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No subject kind is named; the module and its props say what is drawn.

# src/AutoMovieCaptureHost.ts#AutoMovieCaptureHost.open

## @evidence contracts/development/common.md#meaningful-documentation

States the three steps, the refusals and the cleanup.

## @evidence contracts/development/implementation.md#principled-implementation

Every package comes from the production, so the page draws with the renderer the production installed, and the browser is Playwright's pinned build with the stated backend.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Load, serve, launch; building and launching belong to their own functions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A failure is reported, never answered by another backend or a development server.

## @evidence contracts/development/implementation.md#efficient-algorithms

One build and one launch for every capture of the host.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The built page and the browser serve every capture until `close`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The host owns the server, its scratch folder and the browser until `close`; a failed launch stops the server first.

# src/AutoMovieCaptureHost.ts#AutoMovieCaptureHost.prototype.session

## @evidence contracts/development/common.md#meaningful-documentation

States what is opened and injected, who closes it, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Every picture of a capture or a render comes through one such session, so both hosts draw through the same function.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Observe the browser, race opening against a script failure, and close the page on rejection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A failed open is reported, never retried.

## @evidence contracts/development/implementation.md#efficient-algorithms

One page per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call is a fresh page, because props differ between subjects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The page passes to the returned session, or is closed here when opening fails.

# src/AutoMovieCaptureHost.ts#AutoMovieCaptureHost.prototype.capture

## @evidence contracts/development/common.md#meaningful-documentation

States the steps, when the output address is admitted, how a subject with a sound list is handed its dialogue mouths and on which clock, the revision and the page's lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

The capture core plans, writes, records and compares; this host only supplies the subject, the draw and the storage, as law 6 of the campaign asks. A film's mouths are planned by render's own admission and plan on the rate `autoMovieVideoFrameRate` gives, the rate the delivery render places the lines on, so a still and the delivered frame at one second show the same mouth.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Open the session, resolve and admit the destination, hand a film with a sound list its mouths, plan, open the folder, run and close the page.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Storage defaults to `node:fs/promises`. A caller can supply the capture core's storage port to observe its own writes. A destination refusal occurs before opening or replacing the capture folder.

## @evidence contracts/development/implementation.md#efficient-algorithms

One page per capture; drawing is the capture core's loop. A film's lines are read and decoded once, linear in their bytes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each capture draws afresh, because the subject or the request differs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The page opened here is closed here; the capture core holds one still at a time. The admitted lines live until their mouth track is planned, and the page holds the track.

# src/AutoMovieCaptureHost.ts#AutoMovieCaptureHost.prototype.close

## @evidence contracts/development/common.md#meaningful-documentation

States what is released.

## @evidence contracts/development/implementation.md#principled-implementation

The browser ends before the server it loads pages from.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two releases in order, the second attempted even when the first fails.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A release failure propagates after both are attempted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two calls.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Closing happens once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The release point of the browser, the server and the scratch folder.
