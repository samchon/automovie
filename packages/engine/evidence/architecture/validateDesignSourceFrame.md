# src/architecture/validateDesignSourceFrame.ts#validateDesignSourceFrame

## @evidence contracts/development/implementation.md#principled-implementation

Checks each field against its reader's domain. Axis comparison uses `Math.hypot` lengths, refuses non-finite derived lengths, and divides components only by finite lengths above `1e-12`; this avoids squared-length overflow for representable large axes. Absolute cosine above `1 - 1e-12` is the parallelism policy, not an exact orientation certificate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The frame half of `validateDesignReference`, separated so that validator stays within one file's size, and built from the shared collector rules for blank strings, ranges and directions plus the shared id and transform checks instead of private copies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No view, sheet or scale reading is special-cased, and an unknown scale is accepted as null rather than replaced with a guessed candidate.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation lists every rule by field, how an unknown scale is recorded, the path the findings use, and that nothing throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the frame's scale-candidate count, with a constant amount of vector arithmetic for the axes and no search.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A check of one frame per call; the reference validator calls it once per frame and coordinates no shared work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The candidate id set is local and released on return; findings are appended to the caller's collector, a constant number per field plus four per scale candidate.
