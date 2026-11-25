# src/posture/deriveHumanPosture.ts#deriveHumanPosture

## @evidence contracts/development/common.md#meaningful-documentation

States what is shared, what is clamped again, the result's equality with a plain assembly and when it falls back to one.

## @evidence contracts/development/implementation.md#principled-implementation

Assembly makes each bone's record from that bone's own three angles and clamps it by the body's one-joint clamp, a function of the record alone, so a bone with exactly the same angles has the record the other assembly holds; the root is the posture's root and heading through the same turn owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One walk of the rig's bones comparing two tuples a bone, the changed records clamped by the body's joint owner, and the root rebuilt only when it changed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A posture with a whole-body rotation, an assembly made on a base pose, a root-less pose and a body whose projector lends no joint owner are assembled plainly. An absent tuple equals only an absent tuple, so a bone newly set to zero is clamped again.

## @evidence contracts/development/implementation.md#efficient-algorithms

B exact tuple comparisons and one record and clamp a changed bone, in place of B records and B clamps.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A bone's clamped record is shared when its three angles are exactly equal by Object.is, or absent in both postures; the root when its three coordinates and the three heading angles are exactly equal. Both assemblies are in hand and compared in full; nothing is kept between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the result shares records and possibly the root with the given assembly, which callers treat as immutable.
