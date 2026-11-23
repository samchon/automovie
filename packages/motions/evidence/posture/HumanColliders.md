# src/posture/HumanColliders.ts#HumanColliders.nearest

## @evidence contracts/development/implementation.md#principled-implementation

Retains the scalar union-distance pass, then measures full nearest witnesses on every shape of its winning bone through the engine's existing owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One current placement feeds the unchanged distanceOn policy and the original ordered full-witness pass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps both passes, the scalar distance result, winning-bone restriction and strict first-minimum tie behavior; no full result or minimizer is substituted for another query.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds O(S) placement once for S profile segments to the delegated scalar query and W full queries on the winning bone's W shapes, avoiding a second placement pass and its frame allocations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Body/profile/bones remain unchanged during this synchronous query and the engine leaves them untouched, so both passes share their actual placed frames; distance and full-witness computations still run separately.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Placement metadata lives only for this call; the returned distance and witnesses retain no placements, body, bones or query history.

## @evidence contracts/development/common.md#meaningful-documentation

States both passes, their preserved winner/tie policy, current-input premise, delegated costs and ownership.

# src/posture/HumanColliders.ts#HumanColliders.distance

## @evidence contracts/development/implementation.md#principled-implementation

Treats the point as a zero-length segment and delegates to the same signed union-distance owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call preserves the point/segment correspondence without duplicating geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses actual shape distances and the unchanged broad-phase/winner policy, without a point-specific approximation or tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays the documented placement and shape-query costs of distanceToSegment; the wrapper adds constant work and no numeric arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the segment query implementation; each distinct point still runs its actual current geometric queries.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new distance/bone record without retaining the point, body or posed frames.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the zero-length correspondence, signed units, failure and delegated ownership.

# src/posture/HumanColliders.ts#HumanColliders.distanceToSegment

## @evidence contracts/development/implementation.md#principled-implementation

Reads the minimum signed segment-to-shape distance, less the declared taper, using the existing conservative sphere screen and engine shape query.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Computes the original widest taper before placement, then delegates ordered shape traversal to distanceOn, which also serves nearest and ray probes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains the original greater-or-equal sphere rejection, strict first-minimum update, taper interpolation and empty-profile refusal; no candidate policy or numerical threshold changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds O(S) placement for S segments to one ordered pass over shapes and the delegated exact costs of shapes not screened out; no whole result is cached.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the unchanged distanceOn implementation; composite same-pose operations may supply their existing placements to that private owner while every new point/segment query recomputes its own distance.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Current placements and temporary shape bounds live for this call; only the scalar distance and bone escape.

## @evidence contracts/development/common.md#meaningful-documentation

States segment/point cases, taper units, traversal and rejection policy, delegated cost and failure.

# src/posture/HumanColliders.ts#HumanColliders.reading

## @evidence contracts/development/common.md#meaningful-documentation

Defines fixed body/bones, varying segments/tapers/rays, world units and synchronous lifetime; segment and cast share only the bound geometry.

## @evidence contracts/development/implementation.md#principled-implementation

Places actual profile geometry once, delegates each segment to the same signed union-distance owner and every ray to cast's unchanged sphere-tracing/normal-probe owner over that segment reader.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A lazy bound segment reader owns placement lifetime and HumanColliderDistance.prepare owns sphere/query-frame scratch; castOn owns the original ray loop used by this reader and standalone cast.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every segment, point, taper and ray probe is actually queried with original shape order, strict ties, screens, ray constants and empty-profile refusal; no distance, hit or contact verdict is cached.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays O(S) placement once across segment queries and ray marches on S segments, preparing at most F world spheres/engine frames on first use; each actual segment and at most 64 ray steps plus six normal probes retain their exact query costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The explicit caller keeps body/profile and posed bones unchanged until its synchronous contact completes; any geometry change requires another reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns one lazy closure, one placement and at most F spheres/readers through the contact operation; it retains no queried point, result, previous pose or global history and acquires no external handle.

# src/posture/HumanColliders.ts#HumanColliders.cast

## @evidence contracts/development/implementation.md#principled-implementation

Uses the original sphere-tracing distance steps and six central-difference probes to estimate the accepted point's outward normal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Constructs a bound geometry reader and delegates to its cast method; castOn keeps one original ray march, hit test and gradient owner shared with repeated rays on a prepared reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves CAST_STEPS=64, CAST_TOLERANCE=1e-5, CAST_PROBE=1e-4, inside-start behavior and every queried point; no pose-identity cache, query-result reuse or new success condition is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most 64 march queries and six hit probes retain all point-to-sphere and physical shape-query costs. Vector3.addScaled preserves scale-before-add arithmetic without a discarded scaled vector per step; fixed probe-axis vectors allocate no per-hit axis records. O(S) placement is paid once; each of F shapes prepares its sphere and engine frame at most once at their original first screen/query phases, with O(S+F) local metadata.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Bones/profile stay unchanged and queries do not mutate them, so probes share current placements, world spheres and engine-owned fixed-shape frames in original order. Opaque readers are acquired only at the first unscreened query; every changed point still runs the same actual distance owner and sphere predicate. The engine owns the same component read/multiply/add order, and private immutable probe axes retain the original positive half-step on each component.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Placements start at the first distance read, spheres at their first screen and opaque readers at their first unscreened shape query; all end on hit, miss or throw. At most F readers retain fixed geometry, never query points/results, and the hit retains no body, frames, spheres or readers.

## @evidence contracts/development/common.md#meaningful-documentation

States ray units, signed-distance stepping, inherited numerical policies, lazy metadata scope and hit/miss ownership.

# src/posture/HumanColliders.ts#HumanColliders.lowest

## @evidence contracts/development/implementation.md#principled-implementation

Reduces each currently placed profile shape's actual minimum world Y using the engine bounds owner's same shape formula, frame composition and hull vertex order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

HumanColliderPlacement stages the original current placement inputs before one ordered scalar shape-minimum sweep; this facade preserves its original positive-Infinity refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every shape, the original Math.min sequence and empty-profile refusal without substituting candidate approximations or a contact tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Stages O(S) actual segment Y/rotation/name/shape inputs, then fixed primitive work or O(V) for each V-vertex hull. The shared scalar owner omits unused X/Z, posed wrappers and max extrema while retaining every Y expression/comparison; no previous posture's minimum is reused.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same placement/bounds owners as floor readers while freshly computing the supplied current pose's minimum.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar and retains no current pose, shape or bounds array.

## @evidence contracts/development/common.md#meaningful-documentation

Defines exact bounds reduction, world Y units, shape coverage and empty-profile behavior.

# src/posture/HumanColliders.ts#HumanColliders.prepareMinima

## @evidence contracts/development/common.md#meaningful-documentation

States fixed body/group membership, whole-profile default, current bones, world-metre output order, fresh arrays and original Infinity/NaN policies.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates genuine neutral-entry selection and scalar placement to HumanColliderPlacement; each selected shape's original engine minimum-Y formula updates every matched group in profile/shape/group order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One facade exposes the shared fixed-group producer to floor and gymnastics consumers, with placement, staging and numerical bounds kept in their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains selected profile duplicates, missing-bone skips, overlapping groups, shape/vertex order and Math.min nonfinite behavior. No supplied indices, floor answer, contact allowance or substituted collider enters the API.

## @evidence contracts/development/implementation.md#efficient-algorithms

The owning producer indexes K memberships across G groups and selects R of S entries once. Each query stages four O(R) scalar/reference arrays and computes each selected shape bound once before group updates, omitting unused placed/pose/XYZ records without a measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed unchanged neutral geometry and copied group names establish membership equivalence. Every selected current bone transform and shape minimum still evaluates; no pose, query result or time sample is reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the producer's selected neutral references and bounded name/group metadata until release. The facade retains nothing; query staging ends on return/throw and only a fresh numeric array escapes, without input maps, sets, dynamic frames or growing history.

# src/posture/HumanColliders.ts#HumanColliders.IPlaced

## @evidence contracts/development/design.md#principled-representation

Inherits the same canonical bone, current world frame and neutral shape references used by every collider query.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Preserves the existing augmentable HumanColliders.IPlaced interface while the actual placement owner defines its members once.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Imports the actual placement representation without a second shape definition or cached nearest answer.

## @evidence contracts/development/common.md#meaningful-documentation

States the owning placement type and preserved public name.

# src/posture/HumanColliders.ts#HumanColliders.placed

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the unchanged canonical neutral-offset and median-reflection placement to HumanColliderPlacement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One facade preserves current consumers while the neutral metadata and actual frame producer live together.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves profile order, first right-twin selection, absent-bone skip and all original transform expressions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays HumanColliderPlacement.of's O(S) current-frame work plus its documented first-use neutral preparation; the facade adds no array or copy.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Keeps existing per-body neutral metadata with its owner; each call reads current bones, while nearest/cast share their returned frames only for their unchanged synchronous operation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the producer's fresh placed array and owns no second cache or current-frame lifetime beyond its caller.

## @evidence contracts/development/common.md#meaningful-documentation

States placement ownership, geometry conventions, ordering, costs and fresh output lifetime.

# src/posture/HumanColliders.ts#HumanColliders.preparePlaced

## @evidence contracts/development/common.md#meaningful-documentation

Defines fixed unchanged body/name demand, varying current bones, absent-frame skip, ignored extra frames and fresh ordered output.

## @evidence contracts/development/implementation.md#principled-implementation

The actual placement owner selects its genuine neutral profile entries once, then uses the same neutral-offset/world-rotation formula as placed for every current demanded frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One facade returns HumanColliderPlacement's body-bound fixed-entry producer; no second neutral representation or placement loop is added here.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves every selected profile entry, duplicate and original order, current absent-bone skip and all placement expressions; no posed frame, collider result or derived external geometry is accepted or cached.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(S) neutral-entry selection replaces the full S-entry profile traversal on each of Q reads. Each read visits only D demanded entries and performs their actual current placement, without hull search or a measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The body and requested-name snapshot establish fixed neutral-entry membership; changing either requires new preparation. Every supplied current bone frame is still read and placed normally, with fresh outputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the producer's bounded selected neutral entries until its binding/action ends; the facade retains no reader, current bones, placed array or query/time history.

# src/posture/HumanColliders.ts#HumanColliders.bones

## @evidence contracts/development/common.md#meaningful-documentation

Defines the read-only canonical FK demand and unchanged-body metadata lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

The neutral placement owner lists every canonical bone whose posed frame a profile segment consumes, with ancestors handled by the engine's requested FK.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One facade delegates name ownership to HumanColliderPlacement alongside its neutral segments.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No collider shape, contact, pose or query result is omitted or reused; missing canonical profile names preserve existing placement skips.

## @evidence contracts/development/implementation.md#efficient-algorithms

Delegates first O(B+S) fixed indexing then constant borrowed reads; scoped FK can avoid bones with no profile observation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the established unchanged-body neutral metadata cache, without another body or posed-result cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The existing weak body owner holds at most B names with its neutral segments; this facade retains nothing and callers leave the borrowed set unchanged.

# src/posture/HumanColliders.ts#HumanColliders.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes fixed neutral/hull preparation from current posed-frame construction.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates original neutral reflection and hull-face preparation to their single placement and engine owners.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One facade call preserves body preparation while HumanColliderPlacement owns its neutral traversal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Prepares the same original shapes and faces without a current-pose or nearest-result cache.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays the owning neutral and hull-face first-use costs at body preparation; current query placement still takes its documented O(S) work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The moved existing neutral WeakMap and existing hull-point preparation share only their established unchanged-body/geometry inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Adds no cache: the owning existing weak body and points lifetimes remain, and no posed bones or ray state is retained here.

# src/posture/HumanColliders.ts#HumanColliders.bound

## @evidence contracts/development/common.md#meaningful-documentation

States each kind's sphere, its frame and what it allows.

## @evidence contracts/development/implementation.md#principled-implementation

Each sphere contains its shape: a capsule's farthest point is its half length plus its radius from its centre, a box's its half diagonal, a hull's a vertex.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates unchanged shape-local containing formulas to HumanColliderBound, separately from this facade's current posed distance queries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unknown kind throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Primitive kinds take constant work; hulls read their existing cached centre/radius, with the hull owner's geometry preparation cost only on a cold points array.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A hull's centre and radius come from `physicalHullFaces`, which keeps them by its points.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new ball record with a fresh primitive origin or borrowed immutable hull centre; this function retains no shape or result, and the hull owner keeps its existing geometry cache.
