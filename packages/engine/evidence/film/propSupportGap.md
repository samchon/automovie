# src/film/propSupportGap.ts#propSupportGap

## @evidence contracts/development/implementation.md#principled-implementation

Reads surfaceHeightAt at kept footprint probes and face ring corners under the prop, then takes the minimum sampled rise. Planar height is evaluated at those probes, but unread edge intersections can hide thin overlap or a deeper point; curved relief between probes is also outside this measurement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One measurement for every face kind `IAutoMoviePropSupportFace` carries, read by both the prop placement validator and the built-environment support status, so a patch, a prop top and a built part's top are judged by one rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No prop, face or tolerance is special-cased; deciding whether a gap is acceptable is left to the callers, which hold the contract's tolerance.

## @evidence contracts/development/common.md#meaningful-documentation

States the sign convention, the unit, when `null` answers and why it differs from a wrong height, which probes are taken and why both sides are needed, why the deepest answers, and the unread relief between probes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Five footprint probes tested against the face in O(V) each for a face of V ring vertices, and V corner tests against the rectangle in O(1) each, so O(V) local traversal with one delegated height read per kept probe. Probe filtering, ring flattening and concatenation use O(V) temporary list storage. Height and rise representability is not enforced here; non-finite gaps can propagate to callers' comparisons.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Measures one prop against one face per call and coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the probe arrays are released on return.
