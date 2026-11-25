# src/posture/HumanAuditModel.ts#HumanAuditModel.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

States each member, its frame and unit.

## @evidence contracts/development/design.md#principled-representation

The tangle model, its parts placed in profile order, each part's probes in world metres, and the other segments.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a clearance consumer reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The parts and probes are the model's own, in its order.

# src/posture/HumanAuditModel.ts#HumanAuditModel.frame

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The single collider placement owner (`HumanColliders.placed`) and the tangle model's probes carried by each placed segment's pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One placement, one probe transform per part.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every part and probe is placed; none is screened here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the body's probes, once per posed frame its caller reads.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments; the model is the tangle model's per-body memo.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh placements and points; borrows the others and externals.

# src/posture/HumanAuditModel.ts#HumanAuditModel.segments

## @evidence contracts/development/common.md#meaningful-documentation

States what it returns, who reads it and its sources.

## @evidence contracts/development/implementation.md#principled-implementation

The audits read every pair of segments of two bodies, as trajopt and tesseract read every link pair (`trajopt/src/collision_terms.cpp`, `tesseract/collision/bullet/src/bullet_utils.cpp`, research-engines section 1.1), an allowed contact excluded by name as MoveIt's allowed-collision matrix lists it (research-engines section 2); so a limb keeps clear of every segment the model holds, not a subset chosen by hand.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read of the tangle model's parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bone is left out but by the caller's declared rests.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the body's segments; the model is the tangle model's own, built once per body.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the audit's own model, so the fits and the audit read one set.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh set; retains nothing.
