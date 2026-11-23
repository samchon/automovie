# src/carrier/HumanSupportFrame.ts#HumanSupportFrame.contact

## @evidence contracts/development/common.md#meaningful-documentation

States continuation and the absent-contact default.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the same part's existing contact, preserving a prop or person identity through an action transition.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and the ground default.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No inferred frame from height or proximity.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the few declared entry contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A direct entry reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/carrier/HumanSupportFrame.ts#HumanSupportFrame.floor

## @evidence contracts/development/common.md#meaningful-documentation

States the measured datum, the footrest case and the absent-contact case.

## @evidence contracts/development/implementation.md#principled-implementation

Forward kinematics places each planted foot's actual sole sockets, including articulated toes; the lowest socket defines its bearing plane.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pose and the minimum of the bearing sockets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A raised heel's ankle height is never substituted for its contact height.

## @evidence contracts/development/implementation.md#efficient-algorithms

One forward kinematics and six socket readings at most.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses HumanFoot.sockets as the surface datum.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
