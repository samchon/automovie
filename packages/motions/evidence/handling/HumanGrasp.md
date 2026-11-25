# src/handling/HumanGrasp.ts#HumanGrasp.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

Reuses the target's world grip point, inward approach, wrapped axis and metre width without requiring collider output a hand placement never reads.

## @evidence contracts/development/design.md#principled-representation

A Pick of the complete target retains its exact frames/units while distinguishing a hand's geometric goal from digit-closure collider data.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanGraspTarget produces this view for HumanHeldUse.second; hand and around consume precisely these members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No field is guessed, widened or substituted; complete target consumers keep ITarget with its colliders and grip kind.

# src/handling/HumanGrasp.ts#HumanGrasp.target

## @evidence contracts/development/common.md#meaningful-documentation

Inputs identify a context prop, affordance and absolute film second; output is the complete world target; missing geometry is refused.

## @evidence contracts/development/implementation.md#principled-implementation

The context supplies the prop's displayed frame at that second, and `at` performs the rigid affordance transform and width reading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One prop read and frame evaluation delegate geometry to at and its shared HumanGraspTarget owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No frame is inferred or reused across seconds, and absent affordance/colliders keep their existing refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds constant dispatch to at's O(S+V) shape/selected-span work, plus the context frame reader's own cost; it creates no independent solve or scan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the complete target geometry owner without caching an effectful context lookup or displayed frame.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns fresh target wrappers that reference the prop's shape records.

# src/handling/HumanGrasp.ts#HumanGrasp.at

## @evidence contracts/development/common.md#meaningful-documentation

States prop/affordance/current world frame, complete world target output and missing-handle/shape refusals.

## @evidence contracts/development/implementation.md#principled-implementation

HumanGraspTarget composes the same rigid affordance, inward normal and wrapped axis, choosing authored aperture or the nearest collider's exact projected span.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of the target owner, HumanGraspTarget.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing handle or collider list is refused; complete targets always carry the prop's colliders.

## @evidence contracts/development/implementation.md#efficient-algorithms

Admission scans A affordances; complete wrapping scans S shapes, and inferred width adds S centre comparisons plus the selected shape's span cost V. Authored aperture omits that width scan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both complete and hand-only targets use HumanGraspTarget; explicit fixed-geometry consumers retain its producer, while this facade admits current inputs on every call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The target reader ends at return; only fresh target and collider wrappers escape.

# src/handling/HumanGrasp.ts#HumanGrasp.hand

## @evidence contracts/development/common.md#meaningful-documentation

States the body and side, the world target, the optional degree tilt and the world wrist point and rest-relative hand rotation returned.

## @evidence contracts/development/implementation.md#principled-implementation

HumanGraspHand aligns the grip frame with the approach and the wrapped axis, tilts it about the approach and lays the palm half the width back from the grip point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation to the hand-geometry owner, which a repeated search prepares directly.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The width is the target's; no collider is needed for a hand goal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two hand-offset reads and one rigid goal; no IK.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same HumanGraspHand owner serves grasp searches and the second hand's support.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh wrist and retains nothing.

# src/handling/HumanGrasp.ts#HumanGrasp.reachable

## @evidence contracts/development/common.md#meaningful-documentation

Documents the world wrist goals, degree turns and tilts, the lazy stroke keys, the shown hand, the required measure, the caller's admission and the returned arm reference.

## @evidence contracts/development/implementation.md#principled-implementation

Reachability ranking of a part's symmetric grasps (Miller et al. 2003) over full coupled posture fits within the joint ranges, held over the stroke; HumanGraspSearch runs the lower-bound ordered search.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of the search owner, which also serves the clasp's per-turn queries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A grip the required measure rejects never wins over one it accepts; a goal the caller refuses is tried only when it refuses every one. Rotation and position enter one cost through the hand's own length, not an exchange rate set by hand.

## @evidence contracts/development/implementation.md#efficient-algorithms

C grasp fits for C admitted turn and tilt goals, plus the stroke-key fits of the candidates the grasp-error lower bound does not prune.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All fits of one call share one FK workspace; each fit resolves its own posture.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The workspace and candidate fits end with the call; only the chosen wrist, pose, reference and scalar reports escape.

# src/handling/HumanGrasp.ts#HumanGrasp.standing

## @evidence contracts/development/common.md#meaningful-documentation

Defines displayed bone input and the stand-law posture centred on its feet under the hips' heading.

## @evidence contracts/development/implementation.md#principled-implementation

HumanGraspReach takes the displayed hips heading and foot midpoint, subtracts the body's rotated rest-foot midpoint and calls the existing stand law.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegated owner supplies the same prediction used by handshake and handover.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The root comes from the displayed feet and the body's rest geometry, never from guessed proportions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant bone lookups and rigid arithmetic precede stand.posture's normal construction; this facade introduces no FK or body scan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares one standing prediction with all grasp consumers and the same stand law the partner actually performs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh stand posture and retains no displayed bone map, body memory, query history or handle.

# src/handling/HumanGrasp.ts#HumanGrasp.around

## @evidence contracts/development/common.md#meaningful-documentation

The overloads distinguish complete closure targets from the exact fields a hand goal consumes; both keep world points, unit directions and metre width.

## @evidence contracts/development/implementation.md#principled-implementation

The approach rotated about the wrapped axis by the turn (`HumanGraspReach.around`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner handles both structural views and preserves every additional supplied target field.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No collider placeholder, width proxy, normalization or different turn rule is introduced.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant target-copy and quaternion-vector work with no data traversal.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both views use HumanGraspReach.around's same existing wrapped-axis computation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new target view and retains no state or handle.

# src/handling/HumanGrasp.ts#HumanGrasp.extent

## @evidence contracts/development/common.md#meaningful-documentation

States the placed colliders, the unit world axis and the metre width of their union.

## @evidence contracts/development/implementation.md#principled-implementation

The width of the projected union is its existing maximum support minus minimum support, computed by span.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One span query and one subtraction retain one shape-projection owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No axis normalization, collider approximation or tolerance; an empty list gives the infinite span `span` returns.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(S+V) span traversal covers S shapes and their total queried hull vertices V, with constant additional arithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses span and the engine physicalShapeSpan rather than recomputing width with another geometric formula.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains no collider list, span history or handles; only the numeric width is returned.

# src/handling/HumanGrasp.ts#HumanGrasp.span

## @evidence contracts/development/common.md#meaningful-documentation

Defines unit world-axis input and low/high world-origin metre projections of all placed shapes.

## @evidence contracts/development/implementation.md#principled-implementation

Reduces each exact engine physicalShapeSpan by ordered minimum/maximum, which is the support interval of their union on the same axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shape loop and low/high accumulator delegate shape-specific support geometry to the engine.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every collider is queried; an empty list returns Infinity and -Infinity.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S+V) time for S placed shapes and total queried hull vertices V; two scalar accumulators add constant space and the full scan is required for exact union extrema.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Extent and all grasp consumers use this same union reducer and shared engine projection owner without result caching or copied shape geometry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each engine span is consumed immediately; the fresh two-number tuple is the only output and no shapes, frames, history or handle are retained.
