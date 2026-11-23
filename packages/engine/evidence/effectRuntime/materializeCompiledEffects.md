# src/effectRuntime/materializeCompiledEffects.ts#materializeCompiledEffects

## @evidence contracts/development/implementation.md#principled-implementation

Seeds come from SHA-256 over canonical JSON v2 of a protocol-tagged owner record, so distinct owner fields and protocols have unambiguous serialized inputs; retaining 13 hexadecimal digits gives an exact 52-bit integer but permits output collisions. The full stream digest hashes every field except itself, matching validateProductionFilmEffectRuntime's recomputation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the stream record for both owners, which differ only in the seed protocol chosen by the `contract` or `seedOwner` branch of the argument union; zone and recipe lookups are two maps built once per call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The world and the step are required inputs, so no frame rate or empty-world answer is assumed for a caller that omits them, and a cue with a missing zone or recipe is skipped only because its owner's validator already refuses it with a named code.

## @evidence contracts/development/common.md#meaningful-documentation

States both owners and their seed protocols, how the seed is cut from the digest, the drop rule for unresolved cues and who reports it, the output order, the step source, digest equivalence with the Node builder, and that emitted records do not alias the inputs.

## @evidence contracts/development/implementation.md#efficient-algorithms

For C cues over R recipes and Z zones, maps cost O(R + Z) and cue sorting costs O(C log C). Each cue's canonicalizations traverse its owner and stream records and sort object keys with sum(K log K) work before two linear SHA-256 byte passes; the cue sort preserves the caller's order by copying its array.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call materializes one owner's cues from scratch; the film writer calls it once for all of its cues, and no stream is cached across builds because the world, owner and step are all inputs of the digest.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The two lookup maps live only for the call. Returned streams own copied bounds, recipes and intensities, so retained storage grows with all nested copied records and text, including repeated recipes across cues; the caller owns their release.
