# src/sport/AquaticSailPosture.ts#AquaticSailPosture

## @evidence contracts/development/common.md#meaningful-documentation

States what it builds from the plan's prepared values and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The tack's posture by time: the crew crouched below the boom or standing back up, each foot crossing the cockpit in front of the standing shank and bearing on its ball through its swing (the forefoot rocker, Perry and Burnfield), the pelvis carried across the deck, and each hand on its handle where the drives put it, read from the courses the plan laid.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `AquaticSail.plan`: its `plan`, built from what that plan prepared, apart from the plan's other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `AquaticSail.plan`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called once per plan where `AquaticSail.plan` built it before; its cost is the moved code's, and any reader it returns evaluates as it did.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the plan's prepared values instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what the returned value holds, for as long as the plan holds it.

# src/sport/AquaticSailPosture.ts#AquaticSailPosture.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member names the plan value it carries.

## @evidence contracts/development/design.md#principled-representation

The values `AquaticSail.plan` prepared before its `plan`, each typed as that plan declares it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `AquaticSailPosture.of` only; every type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Each member is one prepared value; no optional combination arises.
