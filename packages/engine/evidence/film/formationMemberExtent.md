# src/film/formationMemberExtent.ts#formationMemberExtent

## @evidence contracts/development/implementation.md#principled-implementation

Reads computeModelRestExtentY's portable part/proxy extent from the group's runtime model and uses the shared stand-in only for a missing or too-short measurement. Hero and member sizing share this model representation; external bytes and renderer-only deformation are outside the measurement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns only the formation-to-model join; measurement is `computeModelRestExtentY` and the fallback constants are the ones `nodeSubjectExtent` applies, so a member and a node subject cannot be sized by different rules.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no model group, and the threshold is the shared `MIN_MEASURED_SUBJECT_HEIGHT` rather than a private literal, so no formation is sized by its own rule.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit and reference point, why slot bounds lack a height, how the model is found and measured, why heroes and members agree, and each fallback case with its source.

## @evidence contracts/development/implementation.md#efficient-algorithms

One linear search over all supplied models plus the matched model's delegated portable-geometry measurement. Repeated calls repeat both costs; callers that sample the same immutable model repeatedly own extent reuse.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one formation and the model list; a pass framing one unit over many samples owns any reuse of the extent.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned two numbers.
