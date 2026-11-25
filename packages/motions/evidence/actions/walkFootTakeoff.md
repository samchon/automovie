# src/actions/walkFootTakeoff.ts#walkFootTakeoff

## @evidence contracts/development/common.md#meaningful-documentation

States the chosen socket, the tie rule and the returned point's frame.

## @evidence contracts/development/implementation.md#principled-implementation

The sole leaves the floor last where it lies lowest in the release posture, so the swing's settle holds that socket still; the heel is read at the release stance and the ball and toe with its toes' bend.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Moved from `walkFoot` unchanged; `walkFoot.prepareSwing` reads it once per swing that settles.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the foot owner's sockets; nothing is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three socket readings.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per prepared swing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new record and retains nothing.

# src/actions/walkFootTakeoff.ts#walkFootTakeoff.IDeparture

## @evidence contracts/development/common.md#meaningful-documentation

Documents the socket and its world point.

## @evidence contracts/development/design.md#principled-representation

A sole socket of the foot owner's closed set and its world point in metres at release.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; `walkFoot.prepareSwing` holds it through the swing's settle.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional member.
