# src/sport/admitPuckContact.ts#admitPuckContact

## @evidence contracts/development/common.md#meaningful-documentation

Defines the local contact time, fitted face, puck rim and refusal conditions.

## @evidence contracts/development/implementation.md#principled-implementation

Samples both fitted grip sockets and measures the rim against the finite working face and its direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Grip realization precedes face and direction tests.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An approximate wrist reach or a nominal tool frame cannot alone admit contact.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fits only the demanded grip ancestors at closure and impact during planning.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the existing posed-bone, carried prop and two-handed grip owners.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps no fitted pose or frame after the contact decision.
