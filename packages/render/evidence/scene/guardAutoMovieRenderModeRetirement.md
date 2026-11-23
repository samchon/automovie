# src/index.ts#guardAutoMovieRenderModeRetirement

## @evidence contracts/development/implementation.md#principled-implementation

Stores the actual restoration callback before running it, retains its original cleanup cause and population after failure, and refuses later same-scene acquisitions; successful cleanup removes only that record.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Each primitive still collects/restores its resources; nested owned cleanup can run beneath an active parent whose callback retains that population, while admission-only calls cannot start another pass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Cleared slots or discarded handles cannot invent release, active/failed admission cannot acquire another pass and nested independent cleanup must still run; supplied setup errors do not make healthy cleanup terminal or prove native release.

## @evidence contracts/development/common.md#meaningful-documentation

Defines scene identity, callback-held owner retention, failure propagation, setup-versus-cleanup outcome and public completion limits without another resource manager or renderer host.

## @evidence contracts/development/implementation.md#efficient-algorithms

Weak lookup and fixed outcome coordination add constant work; the supplied callback retains and traverses its actual mesh/material population with its own declared cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Repeat admission shares the exact failed outcome instead of redisposing or replacing unknown resources; a healthy completed installation withdraws its gate and a subsequent pass owns new work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The weak scene key retains only its active or failed callback and cause, including captured original resources; success deletes them and the scene's lifetime bounds unresolved ownership without acquiring a new GPU resource.
