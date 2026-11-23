# src/film/resolveBeatSnapshot.ts#resolveBeatSnapshot

## @evidence contracts/development/implementation.md#principled-implementation

Samples the same functions the compiled shot plays through, `sampleMotion` for a clip, `foldRoot` for the matrix product of placement and pose root, and sampleClipSequence plus bakedTransformFromChannels for object authority, preserving portable playback transforms without claiming native rendered pixels; velocities are backward finite differences over `VELOCITY_DT`, which is first-order accurate and never reads past the instant, the premise being that the next beat continues from the past of this one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One snapshot body with the instant as its only free parameter replaces two identical copies in the opening and end resolvers, so the two boundaries of a beat cannot drift apart; the per-call indexes are gathered into one context the per-node step reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No node, motion or prop is special-cased: baked authority wins only when the shot's own clips write both channels at the instant, and duplicates or missing motions throw instead of picking one.

## @evidence contracts/development/common.md#meaningful-documentation

States the two callers and their instants, the clip-local time rule, when baked authority overrides the folded root, what is carried through, every throw and why, and each parameter's role and unit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds four identity indexes and a translated-node set once, then samples object channels once per distinct required instant. Most baked actors share the current and trailing instant; recently started performances may each need their own start instant, at most one extra per actor. Sequence work includes track/key validation and sampled widths; per-node motion, velocity, gait and plants add delegated key/joint costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares indexes, translated-node membership and lazy channel maps across nodes only during this synchronous call. IResolveBeatProps supplies ordinary admitted DTOs and no synthesizer or actor callbacks; sampleMotion and state assembly read them without mutation. Getter/proxy mutation during reads is outside this equivalence premise, and nothing is reused across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Indexes, context and sampled-channel maps live for one call and are released on return or throw; unique current/trailing instants number at most one plus the baked actor count. The returned state owns one fresh record per scene node. A non-null pose is shallow-copied with root cleared and joints borrowed; plants and mount bindings are borrowed, while transform ownership follows the sampled or staged branch.
