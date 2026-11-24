# src/typography/validateAutoMovieFontSources.ts#validateAutoMovieFontSources

## @evidence contracts/development/implementation.md#principled-implementation

Checks only what the records state, as #4097 assigns to engine: a list of records, nonblank unique ids, RFC 4648 padded base64 data, the project's `sha256:` digest pattern and a nonblank origin for embedded sources, and for asset sources a registered ledger path with a licence and an exact `"font"` use for the production and source id.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Engine cannot reach the ingest decoder, so byte decoding and digest matching stay in render; this function appends to the caller's collector like the other shot-record admissions so a shot gate can call it beside them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every malformed field gets its own finding; an unknown kind is refused, and no field is defaulted or repaired.

## @evidence contracts/development/common.md#meaningful-documentation

States each rule per kind, the optional ledger and what its absence checks, and why bytes are not examined here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the sources plus one map of the ledger by path; each asset check is one lookup and a scan of that asset's uses.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure check of one list per call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Appends findings to the caller's collector and retains nothing else.
