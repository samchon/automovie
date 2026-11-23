# src/posture/assembleHumanPosture.ts#assembleHumanPosture

## @evidence contracts/development/common.md#meaningful-documentation

Defines base precedence, zero defaults, root turning and pre-fit clamp order.

## @evidence contracts/development/implementation.md#principled-implementation

Maps every rig bone to the same explicit clinical triple or last base record, turns the original root/goals, then clamps each assembled record in order through the one-joint owner of the body's own pose clamp (`IHumanBody.projection`), the clamp clampPose maps over a pose, before IK.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Moves the existing seeded assembly unchanged into one owner shared by ordinary resolution and fixed-base candidate operations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every direct joint still enters the actual engine clamp; no range, default, base precedence or goal/plant refusal is changed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(B+J) joint assembly/indexing plus the actual clamp costs for B rig bones and J base records; a direct joint's clamped record is made from its three angles by the projector's angle-taking form (`prepareHumanPostureProjection.values`, the same record the record clamp gives), one record a joint where a record and its clamp were two; a fixed-base candidate operation can perform this unchanged work once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The returned direct pose/turned goals belong to this actual source assembly. Every assembly of a body clamps through that body's one projector; every actual joint is still projected, and no numerical limb result is prepared or reused here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary base indexing ends on return/throw; the caller owns the clamped pose and receives borrowed or freshly turned goals, without retained source history or handles.
