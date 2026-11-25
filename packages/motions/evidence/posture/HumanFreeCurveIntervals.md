# src/posture/HumanFreeCurveIntervals.ts#HumanFreeCurveIntervals

## @evidence contracts/development/common.md#meaningful-documentation

States the interval readers, what they read and who reads them.

## @evidence contracts/development/implementation.md#principled-implementation

A directed dyadic interval's endpoint correction classifies it once; its boundary is built by left-before-right subdivision only. The geodesic triangle inequality rejects a direct interval before IK when its requested foot turn exceeds both acceptance radii and the angular roundoff reserve.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The curve's interval readers, moved verbatim from `prepareHumanFreeCurve`, read the scope the curve hands them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An endpoint fit is only a seed construction, never a certificate for an unsolved interior.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each resident interval is classified once; eviction may recompute it.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each interval has one canonical parent and left-anchor construction, so a rebuilt record is the same regardless of query order.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

At most 1024 unlinked numerical interval records per curve, the oldest evicted first.

# src/posture/HumanFreeCurveIntervals.ts#HumanFreeCurveIntervals.IScope

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what the curve holds.

## @evidence contracts/development/design.md#principled-representation

The curve's own authoring, interval records and correction, named, so the readers read them explicitly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, each read by a reader.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The scope holds the curve's values as they are; nothing is copied or derived.

# src/posture/HumanFreeCurveIntervals.ts#HumanFreeCurveIntervals.IIntervals

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its inputs and result.

## @evidence contracts/development/design.md#principled-representation

The curve's own interval reader signatures.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two readers, both read by the curve's solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No reader serves one law or a test.

# src/posture/HumanFreeCurveIntervals.ts#HumanFreeCurveIntervals.IInterval

## @evidence contracts/development/common.md#meaningful-documentation

States that an interval owns numeric anchors only.

## @evidence contracts/development/design.md#principled-representation

Whether the endpoint fit admits direct correction, and the validated boundary or its exhaustion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No child link or pose is kept.
