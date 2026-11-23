# src/furniture/CareBedConstruction.ts#CareBedConstruction.hospital

## @evidence contracts/development/common.md#meaningful-documentation

States what is built and each contact.

## @evidence contracts/development/implementation.md#principled-implementation

The litter at the drawn height within the sheet's range, the patient surface's size and the overall size the sheet gives, the casters at the overall length's ends in by their radius and across by `CASTER_SPREAD`; each siderail fills the strip between the patient surface and the overall width with siderails up, its top the drawn rail height above the mattress.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Casters, base, mattress, the rails, then the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No backrest section, knee gatch, head or foot board: no source read places the backrest's hinge, so the bed lies flat.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Eight parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one bed.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/furniture/CareBedConstruction.ts#CareBedConstruction.gurney

## @evidence contracts/development/common.md#meaningful-documentation

States what is built, what is left out and its contacts.

## @evidence contracts/development/implementation.md#principled-implementation

The Prime's height range, patient surface and length, its ComfortGel mattress on the litter, its casters at the corners of its overall size in by their radius.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Casters, base, mattress, then the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No siderails, push handles or fifth wheel; the casters are the sheet's 8 in, each at a corner of the overall length and the width with the siderails down, in by its radius.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Six parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one stretcher.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/furniture/CareBedConstruction.ts#CareBedConstruction.crib

## @evidence contracts/development/common.md#meaningful-documentation

States what is built, where the support lies and each contact.

## @evidence contracts/development/implementation.md#principled-implementation

The interior at the drawn size inside 16 CFR 1508.3(a)'s tolerance, the rails' tops at the makers' overall height and the support 1508.3's rail height below them, the slats counted so that the clear gap between neighbours stays within 1508.4(a)'s 2 3/8 in.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Support, mattress, posts, rails, slats, then the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The slats', rails' and posts' sections are this namespace's construction estimates.

## @evidence contracts/development/implementation.md#efficient-algorithms

One rod per slat, about sixty in all.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one bed.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/furniture/CareBedConstruction.ts#CareBedConstruction.bunk

## @evidence contracts/development/common.md#meaningful-documentation

States what is built and each contact.

## @evidence contracts/development/implementation.md#principled-implementation

The maker's overall size, clearance and gap between the beds; the guardrails' tops at 16 CFR 1513.3(a)(6)'s 5 in over the thickest mattress the maker allows, the climbing side's rail ending 1513.3(a)(3)'s 15 in from the foot end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Posts, bases and mattresses, guardrails, then the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No ladder: no source read gives a bunk ladder's rung spacing. The frames under the mattresses hang below them by a construction estimate.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Ten parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one bed.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
