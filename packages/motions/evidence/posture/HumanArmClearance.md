# src/posture/HumanArmClearance.ts#HumanArmClearance.trunk

## @evidence contracts/development/common.md#meaningful-documentation

States which segments are returned and what is read.

## @evidence contracts/development/implementation.md#principled-implementation

Placement is `HumanColliders.placed`, the single owner; this function only keeps the trunk's segments.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One filter.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Filters actual placed profile segments by the existing trunk set without altering their geometry, clearance or source order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the profile's segments.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanColliders.placed`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmClearance.ts#HumanArmClearance.obstacles

## @evidence contracts/development/common.md#meaningful-documentation

States which segments are returned and what the pose must already hold.

## @evidence contracts/development/implementation.md#principled-implementation

A hand sent to a leg, or past one, bends its elbow away from it as it does from the ribs; the limb fit places the legs before the arms, so the legs stand where the posture puts them. Two forearms sent across each other (a self-hug, a hand on the other forearm) lie one over the other, so the arm placed second keeps clear of the first.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One placement when needed, followed by the same selection filter.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The set is the audit's own segments, not a narrower one the fit could pass and the audit refuse; an arm not yet placed is left out, since where it will be is not known.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the profile's segments.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The frame builder can supply its exact same-evaluation placement, while four fixed HumanArmObstacleBones subsets share canonical membership with scoped source FK; actual profile geometry and original placement order remain current.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh filtered array borrowing its actual placed segments; stores no placement, pose or body beyond the call.

# src/posture/HumanArmClearance.ts#HumanArmClearance.overshoot

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, each input and the meaning of 0; the rule is the reading's own.

## @evidence contracts/development/implementation.md#principled-implementation

The reading is `HumanArmOvershoot.of`, kept as this owner's entry so every caller of the clearance reads one name.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Passes every geometry, goal and resting allowance unchanged to the existing overshoot owner, so delegation adds no clearance policy or tolerance.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The reading's own.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `HumanArmOvershoot.of`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmClearance.ts#HumanArmClearance.posed

## @evidence contracts/development/common.md#meaningful-documentation

States what is replaced and what is kept.

## @evidence contracts/development/implementation.md#principled-implementation

The pose holds each joint's clinical triple, so the arm is written as its triples.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map over the joints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A joint the pose does not carry is not added; the canonical pose carries every bone.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the joints with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing computed twice.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/posture/HumanArmClearance.ts#HumanArmClearance.fingered

## @evidence contracts/development/common.md#meaningful-documentation

States what is written, what is ignored and why.

## @evidence contracts/development/implementation.md#principled-implementation

The tangle audit reads the fingers as the pose shows them, so the room that keeps them clear must read the same fingers; the pose holds each joint's clinical triple.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map over the joints, as `posed`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only that hand's digit bones are written.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the joints with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing computed twice.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/posture/HumanArmClearance.ts#HumanArmClearance.room

## @evidence contracts/development/common.md#meaningful-documentation

States what is replaced, what is read and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

The arm's three joints are written into the pose (`posed`) and the bones resolved by the engine's forward kinematics, so the forearm judged is the one the pose displays; the other arm is where the pose shows it, so a carry clears it as it stands.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

roomTerms owns one posed-arm FK/placement and original ordered overshoot/allowance/audit/allowance reads; room applies the unchanged final Math.max while baseline shares those actual inputs across its two projections.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The obstacles are the limb fit's (`obstacles`), so a carried arm and a fitted one are judged against the same shapes.

## @evidence contracts/development/implementation.md#efficient-algorithms

One full FK traversal and collider construction precede every original overshoot/audit query. A search-owned reader shares only completed same-scalar joint/bone math; fresh outputs, changed ancestor propagation and all scans remain.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses posed, poseBones, obstacles, overshoot and the tangle arm reading. A borrowed actual engine reader belongs to this unchanged-rig search; each full posed input still runs. The two clearance readers share one exact collider placement, without pose writes or a pose-identity query cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows but never retains the optional FK reader; the caller releases it when its synchronous search ends. Local fresh bones/placements and every query temporary end with this call.

# src/posture/HumanArmClearance.ts#HumanArmClearance.baseline

## @evidence contracts/development/common.md#meaningful-documentation

Returns the same forearm-only and segment-only degree readings as two room calls with the other allowance Infinity, using one current pose/profile placement.

## @evidence contracts/development/implementation.md#principled-implementation

Both readings consume the same FK, overshoot and tangle values; applying the original zero/Infinity allowances afterward preserves each independent metric, including nonfinite propagation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

roomTerms owns the original ordered numerical queries; room and this paired reader apply their existing Math.max expressions to those terms.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both physical queries still run in their original order; no finite-only gate, altered clearance, profile order, threshold or candidate omission is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

One admitted full FK/profile placement and both actual queries replace two identical pairs for each carry endpoint; constant scalar projections produce both results, with no measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The explicit caller fixes body, pose, arm, external colliders and reader for this synchronous paired observation; only that one unchanged observation is shared, without pose or metric caching.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh two-number record and retains no pose, placement, input, reader or query history.

# src/posture/HumanArmClearance.ts#HumanArmClearance.cleared

## @evidence contracts/development/common.md#meaningful-documentation

States the two movements, the one rule behind them, the order of the search, the bisection, the fallback and each argument's unit.

## @evidence contracts/development/implementation.md#principled-implementation

The least correction that clears the arm, over the two freedoms that carry a forearm off what it passes; the direction comes from the shapes in the way, so no obstacle is named.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of HumanArmClearing.of over the room and range readings built here.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No margin is added and no joint leaves its range; a turn that leaves a range is skipped, not clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Without a loan, the original single clear-arm reading allocates no FK workspace or ROM map; only a second room read creates the search reader. A supplied reader is demanded at the first actual observation. All scans, candidates and ROM scores remain; fixed same-scalar FK and each of two first-bone scans can be shared without a measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses room, actual FK/range owners and HumanArmClearing. A parent may explicitly lend its current synchronous reader; otherwise the local reader remains lazy. posed changes only three arm records, so exact unchanged dependencies can share math while current constraints, every candidate and scores remain actual reads.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

This synchronous search releases its FK snapshots, local ROM reader and at most two bone records on return or throw. Only the chosen clinical arm escapes; no pose, callback, target, candidate or reader history is retained.
