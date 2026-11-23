# src/scene/IAutoMovieImportedModelOptions.ts#IAutoMovieImportedModelOptions

## @evidence contracts/development/design.md#principled-representation

Adapts an already-loaded root with optional semantic bone mapping and expression/frame hooks; createImportedModelObject wraps the root so pose application does not overwrite caller-authored root transforms.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Loading and imported SDK ownership remain with the host, while the viewer consumes only Object3D and callback seams required for the common player path.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing or null bone entries are omitted by normalization rather than fabricated; all imported roots receive the same owned wrapper regardless of incidental runtime class.

## @evidence contracts/development/common.md#meaningful-documentation

States loaded-root wrapping, optional normalized bone input, expression sink ownership and post-pose/expression flushing order.

# src/scene/IAutoMovieImportedModelOptions.ts#IAutoMovieImportedModelOptions.afterAutoMovieFrame

## @evidence contracts/development/implementation.md#principled-implementation

Receives the same sampled frame after AutoMoviePlayer applies pose and expression, allowing an imported runtime to advance its own dependent state in the shared frame clock.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

An optional frame callback exposes runtime integration without adding imported SDK update methods to the common model object.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Hosts supply the callback explicitly and receive elapsed/delta seconds; no foreign update loop or global clock is replaced.

## @evidence contracts/development/common.md#meaningful-documentation

States optionality and ordering after pose and expression writes; the frame type documents the sampled time and applied state.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

This callback contract chooses no imported-runtime processing strategy.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Frame flushing is effectful and the player invokes it per update rather than sharing a cached result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The host owns any runtime state retained or scheduled by its callback; the options type starts no task itself.
