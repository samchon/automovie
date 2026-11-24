# src/posture/HumanColliderPlacement.ts#HumanColliderPlacement.IPlaced

## @evidence contracts/development/common.md#meaningful-documentation

Documents HumanColliderPlacement.IPlaced: One placed collider segment.

## @evidence contracts/development/design.md#principled-representation

The record is the interface's (`IAutoMovieMotionHumanColliders.IPlaced`); the alias adds nothing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kept so this owner's readers name the record by its owner, as master keeps such aliases.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No copy of the record: one declaration, in `@automovie/interface`.

# src/posture/HumanColliderPlacement.ts#HumanColliderPlacement

## @evidence contracts/development/implementation.md#principled-implementation

Uses the original bone world position plus rotated neutral offset and the same quaternion product for segment orientation, with the established mirrored neutral definitions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One neutral-metadata owner and one ordered placement pass separate fixed profile work from current geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves profile order, first matching right twin, absent-bone skip and every transform expression; supplied posed bones are never cached across calls.

## @evidence contracts/development/implementation.md#efficient-algorithms

Placement visits S segments and translates each owned rotated offset in place, omitting a second position vector per placed entry. Cold names/offsets cost O(B+S) for B rig bones; only entries with actual posed bones materialize mirrored shapes once, costing their V hull vertices. Name-only observations create no reflected vertices.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The weak body owner shares unchanged offsets and lazy mirrored definitions; module-owned point/turn helpers avoid two stateless closures per mirrored row. Pure reflection has no validation side effect for an unobserved segment. Nearest/cast operations may borrow completed placement only while body/bones stay unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fresh posed arrays/frames belong to the caller and borrow shape definitions; the existing weak body cache retains one neutral list per live body, and no current pose is stored globally.

## @evidence contracts/development/common.md#meaningful-documentation

Defines current-input stability, canonical placement, mirror/skip order, cold and warm costs and ownership.

# src/posture/HumanColliderPlacement.ts#HumanColliderPlacement.preparePlaced

## @evidence contracts/development/common.md#meaningful-documentation

States fixed name/body scope, current-map inputs, fresh placements, ordering and request invalidation.

## @evidence contracts/development/implementation.md#principled-implementation

A profile entry whose name is outside the actual requested frame set cannot be placed by a map containing only those frames. Snapshot those entries in original order and delegate all actual position/rotation arithmetic to the same place owner as of.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One producer binds this body's genuine neutral metadata to copied names; its callback accepts only current bones, so no unrelated body/prepared-list pair can be injected.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves every selected profile duplicate, original order, absent-bone skip and transform expression. No shape search, posed answer, contact verdict or tolerance is precomputed, and ordinary of retains its complete profile traversal.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(K+S) pass copies K names and selects R of S neutral entries; first neutral metadata costs O(B+S) without reflected vertices or topology search. Each query traverses R and creates fresh actual placements; only their first observed mirrored shapes additionally copy their V hull vertices. No speedup is measured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

This body's unchanged rest/profile metadata and copied request names fix the selected list. Every query still reads its actual bone position/quaternion, and changing a frame or its presence recomputes or omits the placement normally.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns one callback and R borrowed immutable neutral entries until its fixed-demand operation ends. Temporary name indexing releases after binding; no bone map, placed frame or query history is retained, and the established neutral-body cache keeps its weak lifetime.

# src/posture/HumanColliderPlacement.ts#HumanColliderPlacement.lowest

## @evidence contracts/development/common.md#meaningful-documentation

Defines current canonical bones, unchanged neutral geometry, world Y and the empty Infinity result.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the original origin-Y plus rotated neutral offset, bone-times-neutral orientation and the physical owner's same local-shape minimum-Y formulas.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The scalar entry shares minima with fixed-group readers, leaving full pose placement with place.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every profile duplicate, missing-bone skip, shape/vertex order and Math.min/NaN behavior; no goal, contact, bound or physical check is omitted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Stages S scalar Y values, rotations, names and borrowed shape lists in four arrays instead of three unused placed/pose/position records per segment; all actual shape/vertex bounds still run.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed neutral metadata is shared under the unchanged-body contract. Every query reads current bones, and placement inputs are staged before any shape bound as in the original two phases.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Four temporary O(S) arrays end on return/throw, and only a scalar escapes. No bone map, posed frame or floor result is cached.

# src/posture/HumanColliderPlacement.ts#HumanColliderPlacement.prepareMinima

## @evidence contracts/development/common.md#meaningful-documentation

States whole-profile default, copied group membership/order, actual canonical bone inputs, world metres and unchanged-body/reader lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Group membership is built from actual names and applied to each placed bone. One shape bound supplies the same ordered Math.min updates for every matching group, including overlapping groups and duplicate profile entries.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Preparation snapshots name membership and selects the actual neutral union; a separate binder retains only selected entries and private group metadata for the common scalar reduction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Accepts no external group indices, placed frames or derived floor answers. All current placement inputs are staged before bounds, preserving missing-bone skips and the original profile/shape/vertex traversal.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(S+G+K) preparation indexes K memberships across G groups and selects R of S entries. Queries use four O(R) staging arrays plus G output numbers, without placed/pose/XYZ records; each actual selected shape is bounded once before its matching group updates.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The genuine neutral producer and copied name memberships fix the query domain. Every call still consumes current bone transforms and computes all requested minima, with no time, posture or target-result memo.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader owns selected neutral references and O(K) private name/index metadata until its operation ends. Each call releases staging and returns G fresh numbers; no body, input set, bone map, posed frame or result history is retained by the binder.

# src/posture/HumanColliderPlacement.ts#HumanColliderPlacement.prepare

## @evidence contracts/development/implementation.md#principled-implementation

Delegates every neutral hull's face preparation to physicalHullFaces in the original segment/shape order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One neutral-list pass prepares geometry without constructing a current pose.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every hull and its original points array, without precomputing a motion answer or changing the hull algorithm.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits every shape and delegates its first-use hull topology cost. Cold neutral metadata additionally costs O(B+S), and the first actual mirrored lists copy their V vertices; warm lists/hulls share their completed preparation without repeating either construction.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the existing per-body neutral metadata and the existing hull-face owner's per-points preparation; current posed queries remain fresh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Introduces no new cache population: the moved neutral WeakMap and hull owner's existing cache keep their established body/points lifetimes.

## @evidence contracts/development/common.md#meaningful-documentation

States what is prepared, traversal order, delegated geometry cost and absence of posed-result retention.

# src/posture/HumanColliderPlacement.ts#HumanColliderPlacement.bones

## @evidence contracts/development/common.md#meaningful-documentation

Defines canonical name selection, scoped-FK purpose and borrowed immutable metadata.

## @evidence contracts/development/implementation.md#principled-implementation

Collider placement reads only neutral segments with a matching posed canonical bone, so requesting these names and their engine-resolved ancestors supplies every frame it consumes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Existing neutral preparation owns both its segment records and the corresponding canonical name set; collider consumers use the same owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Includes every neutral segment's actual canonical name and preserves missing-profile-bone skips; no posed frame, collision answer or contact threshold is substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

First neutral metadata costs O(B+S) indexing/set/offset work for B bones and S segments; no mirrored collider vertices are materialized by this name-only demand. Later reads return fixed metadata in constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The unchanged-body neutral cache owns names and offsets; each mirrored shape list is separately materialized only when geometry is observed. Any body/profile change requires a new body under the established cache contract.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The existing weak body entry retains at most B canonical names with its neutral segment list, released with that body; callers borrow the set and no posed result/history is retained.
