# src/film/index.ts#planProductionRenderJob

## @evidence contracts/development/implementation.md#principled-implementation

Chunk ids hash canonical JSON of the declared edit, effects, tier, formats, range, pass, runtime identity and range source digests. Engine population and production-owner checks admit effect runtimes, and exact rational frame-to-tick rounding checks cue source lengths against asset samples. Supplied identity records remain caller claims; hashing them does not authenticate renderer bytes or prove equal pixels.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission rules live in their helpers (`normalizeRenderTier`, `normalizeAudioAssets`, `assertSingleGuidePass`, `validDigest`) and the engine (`verifyProductionFilmEffectPopulation`, `sampleProductionRenderFrame`); this function orders them, builds each range once, and joins ranges with deliverables. The range walk repeats `planChunkedSequenceRender`'s arithmetic on purpose, because there the range index orders reassembly and here it is one field of a content-addressed slot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The `pose` default is the interface's documented legacy rule for a guide deliverable without a pass, the protocol and version literals are schema identities, and every refusal throws rather than skipping a deliverable, cue or shot.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states the tier default and decimation, the range partition and chunk order, which pass each deliverable renders including the legacy default, what a chunk id digests, every refusal with the effect error type, and that inputs are left unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

For F tier output frames and S ordered segments, engine sampling costs O(F log(S+1)) plus rate reduction per frame. Range construction visits their at-most-two layers, sorts each range's distinct shot ids and shares ranges across D moving deliverables. Audio asset sorting/copying, effect verification/cloning, caption sorting/serialization and each chunk's canonical JSON/hash work depend on their complete populations and byte lengths; large runtime identities are serialized again per chunk.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each range's frame array and sorted source identities are built once and shared across the moving deliverables of this call. There is no cross-call cache or maintained scheduler consuming these ids to reuse completed encodes; any such effect reuse would require a host's currentness and byte checks.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All F samples are allocated even with no moving deliverable, then become collectable if no range retains them. With moving deliverables the result shares F frame records through D times ceil(F/chunkFrames) chunk records and retains copied audio/effect tracks, asset identities and caption text. Input arrays and output populations have no quota here; local indexes and digest strings become collectable after completion or refusal, with no acquired host handle or task.
