# src/film/forgeCast.ts#forgeCast

## @evidence contracts/development/implementation.md#principled-implementation

Joins entries to the script by cast node through a first-declaration map, collects every violation with `ViolationCollector` instead of stopping at the first, and delegates rig validity to `validateModel`, whose `$input`-rooted paths are rewritten by replacing their leading `$input` once.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns only the casting rules and the skeleton requirement; model geometry and skeleton graph rules stay in `validateModel`, so cast forging and prop forging share one model validator.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no node, rig or archetype; an imported member offered a stand-in, a duplicate or a stranger is refused rather than silently ignored or overwritten.

## @evidence contracts/development/common.md#meaningful-documentation

States both contracts with the id join and its reason, the origin and skeleton rules, how model violations are re-pathed, that all violations are returned together, and that returned models are not copied.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in cast members plus entries, with each entry's `validateModel` call dominating in proportion to that model's parts and bones; node lookups are map and set hits rather than scans.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure gate over one script and plan that coordinates no work across calls or consumers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after return; the result references the caller's model objects and owns its violation list, bounded by a few violations per entry and member plus each model's own.
