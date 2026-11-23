# src/scene/applyExpression.ts#applyExpression

## @evidence contracts/development/implementation.md#principled-implementation

Expands semantic presets through the viewer's declared ARKit factor table, `AUTOMOVIE_EXPRESSION_PRESET_CHANNELS`, whose gaze rows are the engine's `GAZE_PRESET_CHANNELS` so morph and eye-bone gaze expand alike, clamps finite weights to [0,1] with nonfinite inputs treated as zero, lets explicit blendshapes override expanded channels, lets optional dialogue viseme weights, summed onto the five mouth presets by `autoMovieVisemeChannelWeights`, replace the channels they set, and resolves morph names exact-first then case-insensitively; factors are illustrative expression mappings, not measured anatomical equivalence, and case-fold collisions depend on dictionary insertion order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One channel-weight map feeds native morph influences and optional VRM-style sinks; the shared preset table and viseme mapping are separate modules read by the lip-sync measurement too; private helpers own preset expansion, mouth layering, supported-channel reset and name lookup without modifying engine pose or model topology.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preset factors are explicit supported visual conventions rather than fixture-specific expected weights; no target method/global is replaced, and unsupported names remain untouched instead of inventing morph targets.

## @evidence contracts/development/common.md#meaningful-documentation

Documents sink/native-name paths, generated-model no-op and the viseme mouth layer with a worked case; the implementation answer makes clamping, preset factor status, explicit override and folded-name collision limits explicit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds W requested weights, traverses O objects and builds a folded D-entry dictionary for each morph mesh before supported-name resets/writes, then one constant-time revision traversal; time is O(W+objects+sum(dictionary entries and supported/requested channel writes)), temporary space is one weight map plus each active dictionary map.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares preset/channel tables and the expanded weights between all meshes/sinks in one call; morph dictionaries may mutate, so folded lookups are rebuilt rather than cached without an invalidation key.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows model/morph arrays/sinks and creates request-local maps only; owns no texture, geometry, animation task or worker, and channel writes remain in host-owned targets until the next supported-channel reset.
