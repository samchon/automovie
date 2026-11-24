# src/film/compileCameraMove.ts#compileCameraMove

## @evidence contracts/development/implementation.md#principled-implementation

The distance is the pinhole fit on each axis with the binding axis winning, and the aim and path are look-at rotations along the staged bearing. Eased and follow paths are keyed at every delivery frame `k × denominator / numerator`, the render frame sampler's expression, so linear interpolation leaves each delivered frame on the eased path and the clearance sampler's linear premise stands. An abutting entry starts from the reached pose by taking its bearing and distance from it, and a moving one eases from there to its own framing's end distance, so a move reverses only when a gap or a farther authored framing writes it, and every entry's framing is realized. A static entry under a new framing steps to it at its start, the reached pose kept as its own key 1e-6 s earlier so no ramp spreads over the previous entry. The premises are a valid positive vertical field of view, which scene validation guarantees, and sorted non-overlapping entries, which `performShot` gates. The limits are that the orbit arc is a chord between frames, a render at another rate reads chords between keys, and a re-frame or re-aim at an abutting boundary changes in one instant.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One compiler owns the whole framing grammar, every move's path and the continuity between entries, keyed into one two-track clip; `frameKeyTimes` owns the key grid; resolving subjects belongs to `performShot` and the grammar tables to their constants, and coverage takes reuse this function with their own camera.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no subject or camera; +Z bearing and world -X screen-left are stated geometric-degeneracy fallbacks. The 24 fps fallback rate is a named constant whose origin, the theatrical sound-film rate, its comment states. Unknown framing/move, an invalid rate and a frame index outside safe-integer representation throw; the index gate prevents nonprogressing enumeration without an arbitrary workload cap.

## @evidence contracts/development/common.md#meaningful-documentation

States the distance and aim solve, the bearing rule and its fallback, each move's path with its constants, the frame key grid, the hold and continuation between entries, span and auto-duration rules, key merging, the input preconditions, the null and error returns, and each parameter's role, units and default.

## @evidence contracts/development/implementation.md#efficient-algorithms

Local construction is linear in the emitted keys: push-in, orbit, truck and follow emit one key per delivery frame of their span plus its ends, and static and whip at most three; a step adds one key. Measured against the former eight-segment sampling, a two-second push-in at 30 fps grows from 9 to 61 keys; when the clearance clock runs at the delivery rate those key times equal its fixed instants bit for bit, so clearance gains no sample, while the former quarter-second keys added off-grid instants. Each key adds a look rotation, while truck and follow invoke the subject's at callback and lookahead can add one forward sample per key. Callback work is additional. Both output tracks are built from the same key list.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one camera's entries, called once per take; the hero and coverage takes have different cameras and entries, so nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the key list is a local bounded by the keys above, and the returned clip is a fresh value owned by the caller.
