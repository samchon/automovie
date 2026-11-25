# src/perform/HumanPerformanceContactBodies.ts#HumanPerformanceContactBodies

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes from what `HumanPerformanceContacts.contacts` hands it and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

Each person's colliders on the bones shown under the installed stops; 0 speed where the shown pose provably holds still; a met limb that strikes too gives the weapon whose axis lies nearest the striker's, so a mutual contact stops both.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `HumanPerformanceContacts.contacts`: the bodies its contact resolution sweeps against, apart from its other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `HumanPerformanceContacts.contacts`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `HumanPerformanceContacts.contacts` computed it before; its cost is the moved code's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the values `HumanPerformanceContacts.contacts` already holds instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.
# src/perform/HumanPerformanceContactBodies.ts#HumanPerformanceContactBodies.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member names the value it carries.

## @evidence contracts/development/design.md#principled-representation

The values `HumanPerformanceContacts.contacts` prepared before calling `HumanPerformanceContactBodies`, each typed as its owner declares it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanPerformanceContactBodies` only; every type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Each member is one prepared value; no optional combination arises.
# src/perform/HumanPerformanceContactBodies.ts#HumanPerformanceContactBodies.IOwner

## @evidence contracts/development/common.md#meaningful-documentation

Names a weapon's owner: the person, the action, the limb and the live window.

## @evidence contracts/development/design.md#principled-representation

Moved unchanged from `HumanPerformanceContacts.contacts`'s file; its units and frames are those its members state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanPerformanceContactBodies` and `HumanPerformanceContacts.contacts`; every member type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Moved unchanged; it adds no shape of its own.
