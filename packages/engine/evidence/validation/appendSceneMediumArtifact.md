# src/validation/appendSceneMediumArtifact.ts#appendSceneMediumArtifact

## @evidence contracts/development/common.md#meaningful-documentation

States the three range rules and the reason for each bound, the fog exclusion and the read-as-unknown premise, with each parameter's meaning.

## @evidence contracts/development/implementation.md#principled-implementation

Single-scattering extinction needs nonnegative finite coefficients, and the Henyey-Greenstein phase function `(1 − g²) / (4π (1 + g² − 2g cos θ)^1.5)` is finite only for `g` strictly inside (−1, 1): at `g = 1` the forward direction gives 0/0, the NaN the march would draw. The fog exclusion follows issue #4084, since the fog's renderer law and the medium would both fade the same air.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one owner of the medium's rules, shared by resolveStagedMedium for a stage and validateSceneMedium for a scene; each caller states what counts as a fog on its record and where the medium sits.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No value is clamped or repaired; the open anisotropy bounds are where the phase function is defined.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Constant work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Appends to the caller's collector and retains nothing.