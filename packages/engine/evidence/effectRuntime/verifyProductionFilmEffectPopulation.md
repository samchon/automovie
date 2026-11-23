# src/effectRuntime/verifyProductionFilmEffectPopulation.ts#verifyProductionFilmEffectPopulation

## @evidence contracts/development/implementation.md#principled-implementation

Sorts expected cues through sortProductionFilmEffectCues and compares the supplied runtime entries in their original order. Equal length and positional equality of id, zone, interval and intensity require an already canonical population; sorting the supplied entries would hide the reordered-population fault. Each entry's digests are recomputed before its fields are trusted.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The function owns only the population question; ordering, rate resolution, edit identity and per-entry shape are delegated to the same functions the writer uses, so the reader checks exactly what was written.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No entry is matched by searching for its id, so a reordered, duplicated or extra entry cannot pass, and an empty population is refused unless the track is empty; the unchecked `production` field is a stated gap because the timeline carries no production id.

## @evidence contracts/development/common.md#meaningful-documentation

States why a population check is needed beyond per-entry checks, the one-to-one ordering rule, every field compared and where its expected value comes from, why `production` is not compared, and the two refusal codes.

## @evidence contracts/development/implementation.md#efficient-algorithms

For C cues, one edit fingerprint and C runtime validations traverse their serialized records and sort every object's keys, adding sum(K log K) for each object's K keys; cue ordering adds O(C log C). The length check precedes per-entry digest work, so a truncated population fails cheaply.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The rate, edit fingerprint and sorted cue list are computed once per call and shared by every entry; nothing is cached between calls because the timeline is a mutable caller-owned record.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds one sorted copy of the cue array and the per-entry canonical strings only during the call, and retains nothing afterwards.
