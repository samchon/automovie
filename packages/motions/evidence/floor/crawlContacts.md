# src/floor/crawlContacts.ts#crawlContacts

## @evidence contracts/development/common.md#meaningful-documentation

States what it builds from the plan's prepared values and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

Each hand from its landing and each foot from the start bear while the limb is in stance, the foot rolling about its toes' tip without unloading (`crawlFeet.prepareRoll`); on the hands and knees each knee bears from the instant it lands while it is in stance, and a bear crawl's knees, held over the floor, bear nothing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `crawl.plan`: its `contacts`, built from what that plan prepared, apart from the plan's other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `crawl.plan`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called once per plan where `crawl.plan` built it before; its cost is the moved code's, and any reader it returns evaluates as it did.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the plan's prepared values instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what the returned value holds, for as long as the plan holds it.

# src/floor/crawlContacts.ts#crawlContacts.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member names the plan value it carries.

## @evidence contracts/development/design.md#principled-representation

The values `crawl.plan` prepared before its `contacts`, each typed as that plan declares it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `crawlContacts.of` only; every type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Each member is one prepared value; no optional combination arises.
