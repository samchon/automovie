# src/carrying/carryPlace.ts#carryPlace

## @evidence contracts/development/common.md#meaningful-documentation

States the hold place's frame (the performer's moving floor frame), the outward normal, the FK loan's scope and the free hand's undefined result.

## @evidence contracts/development/implementation.md#principled-implementation

A pushed handle at the elbow's height is held with the upper arm hanging and the forearm level (Hoozemans et al. 1998), so the grip lies the upper arm below the measured shoulder and a forearm ahead; a box rides at the waist ahead of the current abdomen; a child's seat rides beside the loaded hip joint, a finger span outside the thigh. The box's and the child's places are shares of the body's measures standing in for a load that is not yet a prop.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Moved from `carry` with its trunk readers; `carry.plan` and the carry cases read a hand's place through it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The shares of the body's measures are documented stand-ins for the load's own size until loads are props; no body or scene is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most one demanded-bone trunk FK pass per call (the shoulder, the hip or the abdomen).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller's FK loan for the posture being evaluated is reused.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new place and retains nothing.
