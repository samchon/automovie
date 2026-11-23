# src/composition/resolveAutoMovieContactEvents.ts#resolveAutoMovieContactEvents

## @evidence contracts/development/common.md#meaningful-documentation

States the method, its determinism, its tie rule, the rigid-part group rule and what it does not model.

## @evidence contracts/development/implementation.md#principled-implementation

The time-ordered event loop of impulse-based simulation over continuous first-impact times.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop orders events; firstAutoMovieContactImpact owns the single first-impact scan, pair distances and departure admission, and each round reads the weapons' scans in step. sampleAutoMovieContactWeapon owns optional combined endpoint production for the scan and mutual-contact queries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid spans, steps and repeated ids throw, and a capsule weapon is never reduced to its end points when a body cannot measure a segment: that throws. Initial overlap remains a contact unless explicit physical departure is certified; a witness must have finite positive actual clearance. No clock nudge or permanent collider exclusion is used.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each event re-scans the remaining weapons, each over samples inside its own live span, all a grid step at a time, so that no weapon is sampled past the step in which the round's earliest impact is found; the other weapons of a stopped group are not scanned again. Each initially contacting pair may additionally invoke its physical departure model once and validate one witness. Sequential strikes avoid scanning every weapon over the whole performance after every event.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All sphere/capsule/tapered pair measurements and first-impact scans share firstAutoMovieContactImpact; stop-dependent certificates are rebuilt for each search rather than reused after the pose changes. Combined endpoints share only one actual producer invocation within a query, with no time or stop-state cache. Legacy mutual-contact tail demand remains conditional on a carried query.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
