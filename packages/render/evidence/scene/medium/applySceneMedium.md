# src/scene/medium/applySceneMedium.ts#applySceneMedium

## @evidence contracts/development/implementation.md#principled-implementation

Stores a copy of the three coefficients on the scene's `userData` under the shared key, because three.js has no participating-medium object and every host that draws the scene can reach `userData`; null or absent deletes the key, so clear air leaves no trace.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call per scene, mirroring `applySceneFog`, so a production that builds its own graph attaches the film's medium the same way `buildScene` does.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No coefficient is converted or defaulted; a medium validateSceneMedium refuses throws before anything is stored, so a production that builds its own graph cannot attach an anisotropy at which the march's phase function is 0/0, and the fog exclusion stays with the scene admission buildScene runs.

## @evidence contracts/development/common.md#meaningful-documentation

States why it is exported, what it stores and where, its reader, the absent meaning, the refusal of an invalid medium and who admits the fog exclusion.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Constant work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The scene owns the stored record.