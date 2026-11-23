# src/drawing/measureAutoMovieQuantities.ts#measureAutoMovieQuantities

## @evidence contracts/development/implementation.md#principled-implementation

Uses shoelace footprints, signed-tetrahedron shell volume, convex-cell cones, circular arc segments and polyline lengths under their validated geometry premises. Binary64 arithmetic, cell weld tolerances and drawing-grid rounding remain numerical limits; overlapping cells are summed, not unioned. The deterministic canonical JSON digest does not establish collision-free source identity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass per record list fills one owner tally per subject, and one bounded-finding step turns every tally into a finding, so adding a subject means one unit and one tally source.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No design or owner is special-cased; an unbounded cell or a void-less opening is counted into a declared gap rather than measured as zero silently, and the fixed gaps state take-offs this derivation is never handed the records for.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states both refusals, every measured quantity and its owner, the subject coverage, the contributor bound and reconciliation, the approximate basis and why, the gap policy and the digest's coverage.

## @evidence contracts/development/implementation.md#efficient-algorithms

Includes full environment validation, then linear surface/profile/route/element/shell walks, O(p^4) plane-triple admission plus face hulls per convex cell, and O(o log o) owner sorting per subject. Canonical encoding sorts object keys and hashes the complete output text; bounding listed contributors does not bound the preceding tallies or scans.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each record is measured once in its own pass and no measured value is needed twice, so there is no repeated work to share; nothing is cached across calls because the environment is the caller's mutable record.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Call-local owner tallies grow with distinct owners and are released on return. The caller owns the report, whose named contributors are bounded per finding; full gap strings can still name every faceted space and are bounded by authored design size rather than the contributor limit.
