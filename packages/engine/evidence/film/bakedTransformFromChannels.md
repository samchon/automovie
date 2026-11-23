# src/film/bakedTransformFromChannels.ts#bakedTransformFromChannels

## @evidence contracts/development/implementation.md#principled-implementation

Reads the sampler's canonical node/path keys and constructs a world TRS only when both required channels exist; optional scale follows the same selected authority, with unit scale matching attach and launch's scale-free clips.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Separates map-to-frame assembly from sampleClipSequence so bakedTransformFromClipsAt and resolveBeatSnapshot share the same null and scale semantics while the snapshot samples each exact instant once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No producer id or node has special authority; absent required channels remain absent and no staged scale is guessed from unrelated scene state.

## @evidence contracts/development/common.md#meaningful-documentation

States the already-sampled map premise, required channels, caller-owned missing-frame fallback, scalar copies and borrowed unit-scale ownership.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Three map reads and a fixed-size TRS assembly take constant work, apart from key construction proportional to node-id length.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Consumes the caller's current map without sampling or retaining it; the snapshot owns sharing of maps across nodes at one instant.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the fresh frame and component records; the module retains only one fixed unit-scale record that consumers must not mutate.
