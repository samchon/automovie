# src/typography/decodeAutoMovieFontSources.ts#decodeAutoMovieFontSources

## @evidence contracts/development/implementation.md#principled-implementation

Decodes embedded base64, hashes the bytes with Web Crypto SHA-256 and compares the `sha256:` spelling with the recorded digest, reads asset bytes through the host's reader, then runs the ingest TrueType decoder and rethrows its refusal with the source id. Web Crypto is present in Node and in a secure-context page, which the draw and Viewer pages are.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Render owns this step because it depends on ingest while engine cannot; one function serves render's shot preparation and any host that decodes fonts itself.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A digest mismatch, malformed base64, a missing reader, a duplicate id and a decoder refusal each reject; no source is skipped and no font substituted.

## @evidence contracts/development/common.md#meaningful-documentation

States both kinds' paths, the ordering and first-refusal rule, which earlier checks cover ids, fields and licences and that this function checks no licence, the duplicated checks and why, the result's ownership and every rejection.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the sources and their bytes: one base64 decode, one hash and one font decode per source.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call decodes the shot's list once; the caller keeps the map for the shot's frames.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned map is owned by the caller; decoded byte arrays are released when each source finishes.
