# src/everyday/prepareGestureTransport.ts#prepareGestureTransport

## @evidence contracts/development/common.md#meaningful-documentation

Defines fixed entry-event provenance, varying named/varied goals, demanded FK, world-metre distance and relaxed reference shape.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves the original entry pose with all authored-joint admission, requesting only each actual surface's hand/region frames through HumanHand.frameBones; the same surface frame and Euclidean distance determine transport.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Each probe first obtains its actual hand goals, extends the demanded reference-bone set if needed, then reduces the original per-hand distance in declared side order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses body-declared digital-region bones including custom/fallback metadata, unchanged relaxed shape and actual goal points; no canonical-distal guess, target proxy, tolerance or solved arm is substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each probe scans its H hands and their small frame dependencies; entry FK runs only on first demand or added reference bones, transforming their ancestors instead of unrelated limbs/fingers while retaining every authored joint's admission.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same unchanged body and exact entry pose establish identical reference FK across named/varied probes; current goals are never shared, and additional required surface bones rebuild that same reference through its original owner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The planning reader holds its fixed inputs, one reference map and at most the rig's bone-name set until its owning gesture planning scope releases it; each probe's goals are local and no sampled-time history is retained.
