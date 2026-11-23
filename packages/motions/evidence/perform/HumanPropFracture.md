# src/perform/HumanPropFracture.ts#HumanPropFracture

## @evidence contracts/development/common.md#meaningful-documentation

States the observed contact, authored split, fixed orientation and first floor support.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the observed hit clock and displayed model transform, rotates the provider's local launch velocities into world space, and solves the first downward floor contact of each fixed-orientation piece from its actual world collider minimum and uniform gravity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Calls the model's split once, then prepares the dated contact and one sampler per detached piece.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The author supplies the fracture budget. The plan adds no material assumptions, bounce, spin, fragment collisions or shape approximations.

## @evidence contracts/development/implementation.md#efficient-algorithms

Plan work is the provider's split plus one bounds traversal per piece. A query reads one carrier frame when a remainder exists and one closed-form sample per detached piece still in flight.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both the displayed launch frame and each fragment's flight and floor stop are prepared once. Airborne queries reuse the engine projectile reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains its contact, the carrier reader and its pieces' flight and rest data. Releasing the plan releases these records.
