# src/geometry/construction/AutoMovieSolidClip.ts#AutoMovieSolidClip.rail

## @evidence contracts/development/implementation.md#principled-implementation

Samples the host rail at blend columns and bisects each adjacent face change, retaining one low-side world vertex plus both endpoint chart readings for the placed crossing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One point constructor owns mesh registration and metadata while one ordered column pass owns crossing brackets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Assumes a supported face transition between adjacent columns; finite bisection and the millionth-column null-rail escape do not independently certify coincident chart positions. A failure can leave inserted vertices until the body caller rolls back.

## @evidence contracts/development/common.md#meaningful-documentation

Names atlas-to-body index mapping, column count, rail order, mutation and crossing failure meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

C columns and B face changes use O(C) output plus up to 40 rail queries per change, with linear owner-name lookup for inserted points; rail solving/cache costs belong to that caller as well.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses published column charts/across directions and the join's rail cache for bisection queries; each returned crossing has one mesh vertex for both incident faces.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mesh mutations and O(C+B) returned metadata survive success; on string failure the operation does not undo earlier inserts, while SolidBody.merge's checkpoint restores its arrays/cycles.

# src/geometry/construction/AutoMovieSolidClip.ts#AutoMovieSolidClip.trim

## @evidence contracts/development/implementation.md#principled-implementation

Splits a multi-face rail into crossing-to-crossing runs, inserts crossings in one existing boundary cycle and builds the two replacement arcs, using an available local across probe to choose the kept side. Each rebuilt cycle keeps, per segment, the exact boundary its trim lay on (`AutoMovieSolidCycle.piece`) and the trim's winding curve: a segment between two consecutive vertices of an owner's seam stays that owner's curve on both faces, and only the two pieces beside a placed crossing and the run itself are chords, so a later cutter meets one seam wherever this one did not cut.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single-face loop case is direct; multi-face runs delegate boundary insertion/candidate selection to one local clip operation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rejects unsupported run/cycle/probe outcomes, but missing interior probes default to the first candidate without proving the kept side; previous mutations also remain on a later failure until the body owner rolls back.

## @evidence contracts/development/common.md#meaningful-documentation

States in-place cycle changes, blend-neighbour identity, single-face kind and nullable error; the evidence records the no-probe validation gap.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ordered run extraction is linear in rail size, while each run scans candidate face cycles and builds/tests O(C+R) boundary data; repeated runs can revisit an existing boundary rather than sharing a global clipping index.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses existing rail vertex/chart identities and shared blend-neighbour mappings instead of recomputing a second geometric rail.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The body retains replaced cycles and inserted crossing references; run/candidate scratch is local, and SolidBody.merge owns recovery of partial mutations when a premise string is returned.
