# src/sound/deriveAutoMovieInteriorAcousticResponse.ts#deriveAutoMovieInteriorAcousticResponse

## @evidence contracts/development/implementation.md#principled-implementation

The shared Sabine analysis supplies fixed metric keys; same-room uses bounded reverberation/room constant and exactly one source/receiver to form direct-to-diffuse ratio, while partition loss maps to 10^(-dB/20). The analyzer's admitted geometry and numerical gap/refusal policy remain prerequisites.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Room response owns path selection and receipt packaging while the shared analyzer owns physical inputs and metrics; outdoor, incomplete binding and unavailable adoption remain distinct outcomes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adopted profiles return not-run because bytes are absent here, and missing/gapped facts remain unsupported rather than becoming dry success; a matching digest string is checked syntactically, not recomputed from geometry.

## @evidence contracts/development/common.md#meaningful-documentation

Documents digest/subject agreement, outdoor/cross-room/same-room branches, numeric gap effects and the exactly-one-emitter/listener requirement; metric lookup relies on the analyzer's fixed-key population.

## @evidence contracts/development/implementation.md#efficient-algorithms

Profile/digest admission is bounded string work, followed by the analyzer's surface/source/receiver/partition scans and its fixed-size metric lookups; no repeated acoustic solve is hidden behind this receipt.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared analysis and the canonical SHA-256 format owner supply one physical/digest policy; changed request/profile/input revision causes fresh derivation, with no completed response cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The analysis and metric objects are call-local; the returned receipt retains only scalar/profile/revision facts or a refusal reason, without room geometry, adopted audio or solver tasks.
