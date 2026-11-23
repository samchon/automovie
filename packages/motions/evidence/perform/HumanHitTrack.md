# src/perform/HumanHitTrack.ts#HumanHitTrack.name

## @evidence contracts/development/common.md#meaningful-documentation

States exact generated track forms and optional producer suffix.

## @evidence contracts/development/implementation.md#principled-implementation

Concatenates the declared target and optional producer in the hit-track address convention.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One optional-producer branch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves plain authored ids without guessing an actor or prop.

## @evidence contracts/development/implementation.md#efficient-algorithms

Work and output space scale with address string length.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Pure address formatting.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/perform/HumanHitTrack.ts#HumanHitTrack.instants

## @evidence contracts/development/common.md#meaningful-documentation

States unknown-prefix behavior and the namespace documents provisional versus committed sources.

## @evidence contracts/development/implementation.md#principled-implementation

During placement actual per-limb sweeps supply provisional melee contacts, each limb's capsules stopping together at the first contact; the common hit record supplies blasts/flights and committed contacts, filtered by target/producer and ordered by time.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Parses one hit-track address, selects current producers, then filters/maps/sorts cue records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every provisional live window, the engine's STEP scan, crossing search and taper, and the actual struck-body distance; no event is fabricated or skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Provisional work sweeps each striking limb's capsules together, so a limb costs one scan that ends at its first contact instead of one full-window scan per capsule; registered head/tail reads share one exact chain evaluation, and the struck body is read once per exact second for every sweep of the call. H selected records cost O(H log H) sorting and O(H) temporary space, with no measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The common record owns committed reuse. Within one provisional call nothing is placed, so the struck body's bones at an exact second are one pure value shared by every limb's sweep; the call's map ends with it. A limb's capsules form one engine group, so its part stops at its first contact and gives one provisional hit, as the committed resolution and the striking laws' first-contact stop do.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Per-call sweep inputs/events, cue arrays, at most one fixed-name struck-actor query producer and one bones map per exact second read end on return or throw. Each actual query owns its own FK/projector/pose scope; returned cues keep only names/seconds and retain no callbacks, bodies, readers or sampled poses.
