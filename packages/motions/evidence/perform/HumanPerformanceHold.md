# src/perform/HumanPerformanceHold.ts#HumanPerformanceHold.prop

## @evidence contracts/development/common.md#meaningful-documentation

Points to the reader's documentation and states the in-hand composition.

## @evidence contracts/development/implementation.md#principled-implementation

The parent constraint's offset stored at closure (inverse(hand) times prop), the latest grip carrying, two hands closing together holding and releasing one rigid body, and a grip's in-hand displacement composed before the offset. A world-frame read preserves the previous carrier at hand or socket closure. A supplied performer pose can read the authored socket chain at closure while fitting its attached prop.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Choose the carrying grip, seat its offset once, compose any in-hand motion, place by the hand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The stored offset is never re-derived while held; an in-hand motion is the window's own pure function; a hand setting the prop on a socket at its offset (`IAutoMovieMotionPropMount.offset`) moves the stored offset to the one that seats it there by the grip's end, on a minimum-jerk share, so the mount takes it without a step.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans each visited prop's grips and reads the final shared grip once more when resting after a hand release. Map and set work per socket hop is constant. The offset is memoized on the grip record.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Seated offsets are kept on the grip records the grip cache holds.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The socket path keeps one entry per active sample and releases entries as each hop returns. Only offsets on grip records persist with the performance.

# src/perform/HumanPerformanceHold.ts#HumanPerformanceHold.mount

## @evidence contracts/development/common.md#meaningful-documentation

Reports a mount carrying the prop on the film clock, with the same closure and precedence as a displayed frame.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the existing grip and mount spans and rules out a later flight before returning the socket identity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shares carrier selection with frame reads and leaves flight precedence to HumanPropFlight.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Neither an inactive mount declaration nor spatial coincidence takes custody.

## @evidence contracts/development/implementation.md#efficient-algorithms

One grip scan and, only for an active mount, a flight selection bounded by the requested time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Borrows the same grip records and flight selection used to display the prop.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a borrowed socket identity without retaining any query.

# src/perform/HumanPerformanceHold.ts#HumanPerformanceHold.holder

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned and when none is.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the frame's own carrier selection and flight precedence, so the holder is the hand that displays the prop.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One custody reading and one flight test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A worn or mounted span is no hand; a prop in flight has no holder.

## @evidence contracts/development/implementation.md#efficient-algorithms

One grip scan and, for a held prop, one bounded flight selection.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Borrows the grip records and flight selection the frame reads.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record and retains nothing.
