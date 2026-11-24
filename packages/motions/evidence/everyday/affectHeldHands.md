# src/everyday/affectHeldHands.ts#affectHeldHands

## @evidence contracts/development/common.md#meaningful-documentation

States which hands are kept, how each kind of contact is kept and what a free hand gets.

## @evidence contracts/development/implementation.md#principled-implementation

A contact outside the body stays at its pre-layer frame; one on the body rides the touched bone's rigid motion from before to after the layer; the elbow hint is the pre-layer elbow.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Select the open contact windows, read the pre- and post-layer bones once, then write one goal per held hand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only hands inside an open contact window are held; an arm the action already holds by a goal keeps it, carried with its bone when the contact is on the body.

## @evidence contracts/development/implementation.md#efficient-algorithms

One demanded-bone forward kinematics before the layer, and one after it only when a contact is on the body.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one demanded-bone reader prepared for the call serves both readings, before and after the layer; the bone chain between a hand and its touched bone reads the body's bone records' parents.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the prepared reader ends with the call.
