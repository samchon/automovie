# src/film/propAnchorFrame.ts#propAnchorFrame

## @evidence contracts/development/implementation.md#principled-implementation

Composes staged-piece/affordance or ancestor/element matrices and projects the result through Matrix4.decompose into TRS with normalized rotation; nested nonuniform scales can introduce unrepresented shear. A surface anchor uses the widest convex piece's interior mean, lifted onto its height rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Element placement is the shared `builtElementRestMatrices`, piece placement the shared `setPieceMatrix`, and the interior point and height rule come from the space module, so this function keeps only the target-kind dispatch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every target kind answers by a stated rule, and missing, cyclic or absent-face records answer null rather than a guessed frame; numerical decomposition refusals propagate instead; no prop, building or affordance is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States the purpose with its motivating case, the answer per target kind and each `null` case, that rest pose ignores operating states, the first-record lookup rule and why, and the meaning of each parameter.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear lookups over the named lists plus, for a building element, one id index and one matrix product per ancestor; a surface anchor costs the convex decomposition of one patch.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Resolves one target per call and coordinates no work across calls; a caller anchoring many props to one building may keep the returned frames.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The matrix lookup is dropped on return and nothing is retained; the caller owns the returned transform.
