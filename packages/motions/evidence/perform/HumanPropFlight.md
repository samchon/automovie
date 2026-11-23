# src/perform/HumanPropFlight.ts#HumanPropFlight.flights

## @evidence contracts/development/common.md#meaningful-documentation

Defines film ordering, action-window launch filtering, the placed horizon during scheduling, borrowed cached output and predecessor flights exposed during recursive construction.

## @evidence contracts/development/implementation.md#principled-implementation

Collects the prop's published launches inside their surviving action windows and stably sorts them by film time. While scheduling, point-in-time reads include only launches and collisions through the requested second, while hit scans cover the placed horizon. Once placed, the final schedule provides the horizon. Later grips or launches limit each flight, and final capture checks require the selected flight to agree with the staged grip before caching; a capture that disagrees is refused in the name of the action that took the staged hold.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Collection/order, flight construction and per-performance retention stay distinct; sweep and continuation laws remain with their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Existing 1e-9-second action-window and 1e-6-second grip-close margins remain explicit planning policies; no CCD time shift or producer-specific flight equation is added. Final-state cache identity does not independently detect caller mutation of performance inputs.

## @evidence contracts/development/implementation.md#efficient-algorithms

A cache hit is O(1); uncached collection computes the provisional horizon during the existing segment/launch traversal, sorts L matching launches in O(L log L), and then adds each flight's sweep/continuation cost and output. Final capture admission walks the sorted grip and flight lists once and samples one flight per staged grip. Missing or unlaunched props are not memoized, so those reads repeat collection work where applicable.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Placed non-resolving performances reuse results by performance identity and prop subject, relying on their plans/placements/props remaining fixed. The flying map shares predecessor output only during one recursive construction; resolving performances do not publish final cache results.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The flying map removes the subject in finally on success or refusal; the flight map retain at most the queried launched props and their launch/contact/trajectory output until the performance is released. Returned records remain borrowed and mutable, and no host task is acquired.

# src/perform/HumanPropFlight.ts#HumanPropFlight.active

## @evidence contracts/development/common.md#meaningful-documentation

Uses film seconds and allows the outgoing flight to supply the exact grip boundary frame.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the latest launch in stable film order, excluding any flight whose custody ended before the query or that precedes the caller's grip cutoff. During scheduling it asks for collision evidence up to the query second so a later contact cannot invalidate an earlier frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shares flight selection between frame sampling and catch admission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses placed records and compares their clocks without shifting the boundary.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans at most the prop's launch count after acquiring its flight records.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the existing flight cache and returns a borrowed record.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains no query or frame.

# src/perform/HumanPropFlight.ts#HumanPropFlight.approach

## @evidence contracts/development/common.md#meaningful-documentation

Selects at the interception film second and reads it and the earlier film second on that same launch.

## @evidence contracts/development/implementation.md#principled-implementation

The later instant bounds the collision horizon during placement. Earlier choices along the selected flight read its already-built trajectory and continuations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Flight selection and frame projection stay at their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The earlier sample may not precede the selected launch or follow the interception.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bounded flight acquisition and two leg and frame reads, with a reused frame for coincident samples.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both frames use the same flight and sweep evidence.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the original launch identity and two frames without retaining a callback or new cache.

# src/perform/HumanPropFlight.ts#HumanPropFlight.frame

## @evidence contracts/development/common.md#meaningful-documentation

States latest qualifying launch selection, film seconds, the grip cutoff, undefined absence and carrier-relative rest after contact.

## @evidence contracts/development/implementation.md#principled-implementation

Selects the latest launch inside the requested grip interval, samples its engine trajectory or launch-relative continuation leg, then composes a settled offset with the current struck carrier. Finite query clocks and coherent generated flight records are caller premises.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One temporal selection separates first-flight, continuation and settled-carrier frame paths, reusing the existing motion and frame owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not restart a flight at query time, clamp a bad clock or invent a rebound; no qualifying launch stays undefined, and delegated admission/refusal propagates.

## @evidence contracts/development/implementation.md#efficient-algorithms

After flight acquisition, selection scans L launches and up to K continuation legs, plus the chosen trajectory sample or carrier/FK read; it allocates no sampled-frame history.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the placed performance's flight records and engine trajectory readers; caller time alone selects a frame without replaying previous output frames.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains no query or frame locally; active paths return a small frame wrapper, and an uncarried settled path borrows the cached contact offset.
