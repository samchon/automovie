# src/striking/StrikingStrain.ts#StrikingStrain

## @evidence contracts/development/common.md#meaningful-documentation

States frame/shoulder units, the fixed body/side prerequisites the closure reads once and the distinction between rank and physical acceptance.

## @evidence contracts/development/implementation.md#principled-implementation

A straight wrist puts the elbow one measured forearm length behind the wrist along the canonical hand line; the absolute error from the shoulder's upper-arm sphere ranks candidate poses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One preparation reads the grip socket and the two measured lengths; the closure computes each actual frame/shoulder rigid wrist/elbow residual.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the canonical grip, side convention and measured lengths; no candidate is accepted by this rank and no physical fit or authored limit is changed.

## @evidence contracts/development/implementation.md#efficient-algorithms

One grip offset and two measure reads per preparation, which its callers make once per candidate search; every candidate then takes constant rigid/vector math.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The closure shares its fixed grip, direction and lengths across one search's candidates; nothing is kept between preparations, so no registry beside the body holds derived metadata.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each caller owns its fresh closure over two vectors and two lengths, released with it; no module state, raw posture, shoulder, candidate history or handle is retained.
