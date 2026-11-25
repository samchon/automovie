# src/posture/HumanLinkCertificate.ts#HumanLinkCertificate.certify

## @evidence contracts/development/common.md#meaningful-documentation

States the solids or casts, the probe offset, the floor, the unit and the case where no bound is given.

## @evidence contracts/development/implementation.md#principled-implementation

Two convex solids' signed distance bounds every point depth between them (a point inside the other at depth d needs a translation of at least d to leave), so the least shape distance less the probe offset bounds every probe of the segment: trajopt's and tesseract's link-pair reading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One GJK per solid, the least kept, stopping once it falls below the floor.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bound is GJK's lower bound, never its estimate, and meeting solids give negative infinity, so no probe a reading would find is certified away.

## @evidence contracts/development/implementation.md#efficient-algorithms

One GJK per solid of the segment, each stopping at the floor; the probes it certifies are never read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments; callers keep the solids they read again.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number and retains nothing.

# src/posture/HumanLinkCertificate.ts#HumanLinkCertificate.clearance

## @evidence contracts/development/common.md#meaningful-documentation

States the two segments, the result and when no probe of either can lie inside the other.

## @evidence contracts/development/implementation.md#principled-implementation

The same convex-pair bound both ways: the least distance between the two segments' shapes less the larger probe offset bounds every probe of either from the other, and no probe enters while the two travel less than it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One GJK per pair of shapes, stopping at the first that is not clear.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses GJK's lower bound and the tangle model's probe offsets, measured from its own probes, so a pair the probe reading would find inside is never cleared.

## @evidence contracts/development/implementation.md#efficient-algorithms

Shapes of one segment times shapes of the other, a few GJKs, in place of every probe of both read against the other.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of two placed segments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number; the solids are released with the call.
