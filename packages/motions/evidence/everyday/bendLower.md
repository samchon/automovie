# src/everyday/bendLower.ts#bendLower.hipShare

## @evidence contracts/development/common.md#meaningful-documentation

States the geometry, its sources, the split rule and the result's range.

## @evidence contracts/development/implementation.md#principled-implementation

The hip's height over the floor is the ankle height plus each segment's length times the cosine of its tilt from the vertical; divided by the same chain straight, it is the share of the standing height.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression over the body's measures and the strategy's angles.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The knee angles are the cited classes', the ankle's the measured crouch's; no body is special-cased.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/bendLower.ts#bendLower.lower

## @evidence contracts/development/common.md#meaningful-documentation

States what is lowered, moved and pitched, each parameter's unit and range, and the squat's heel lift in the implementation comments.

## @evidence contracts/development/implementation.md#principled-implementation

Moves the hips' goal down by the strategy's share of the hip height and back by `back` in the posture's frame, inclines the trunk by the lumbopelvic rhythm with the pelvis limited by hip flexion (HumanTrunk.pelvisLimit), lifts a squat's heels about the ball (HumanFoot.pivot) with the toes bent to stay flat, and re-solves the planted legs, lowering the pelvis where a leg cannot reach.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One posture transform shared by the plan, the balance solve and the reach bisection; the inclination split, foot pivot and leg solve are imported from their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The drop is `hipShare`'s, from the body's own leg at the cited knee angles; HEEL is a named provisional lift with no source found; no body or case is special-cased. The pelvis limit is read over the lifted ankles, so the hip stays within its flexion range and the foot holds its contact through the squat.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: one trunk incline, at most two foot pivots and one leg-lowering solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A synchronous parent FK source may share exact raw-pelvis hip dependencies with the current evaluation; every current hip/root/plant and scalar lowering remains calculated, without a retained lowered pose or a new ROM policy.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new posture and retains nothing.

# src/everyday/bendLower.ts#bendLower.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed body, per-evaluation posture and angle, proportion and displacement units.

## @evidence contracts/development/implementation.md#principled-implementation

Keep the strategy's trigonometry and the planted legs' unchanged knee reach separate from current angles, foot pivots and hip positions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Raw and prepared paths share the current-pose transform; only the canonical body's fixed measures are bound separately.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unknown bodies keep their live geometry. No frame, pose result, tolerance or changed contact enters preparation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Precompute fixed segment geometry once. Both phases use the original current-posture equations and the same actual ankle targets.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The body factory owns measure lifetime. Every actual sample supplies current hip FK, support and heading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One body and its strategy scalars live with the reader. Current angles, limbs and the synchronous FK source are never retained.

# src/everyday/bendLower.ts#bendLower.pitch

## @evidence contracts/development/common.md#meaningful-documentation

States the quantity solved, the search range, the reach model and the refusal with its feasible height.

## @evidence contracts/development/implementation.md#principled-implementation

The gap between the shoulder-to-target distance and the arm's reach (`REACH` of upper arm plus forearm, near full extension, plus the palm offset), the shoulder read from the lowered trunk's forward kinematics, is scanned every `SCAN` degrees for the first inclination that closes it, then bisected between that one and the one before. The gap does not fall all the way: the shoulder swings down past a target at counter height, so the gap at the deepest inclinations opens again, and a bisection over the whole range would refuse a counter a slight lean reaches. Each shoulder within reach across the floor also gives the lowest height the hand reaches there, the reach sphere's bottom under it, kept for the refusal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One solve that reuses `lower` for the body and HumanTrunk for the shoulder.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The reach share is the measured `REACH` and the `DEEPEST` bound is a named provisional constant; an unreachable target is refused with what it can reach, not clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most 31 scanned and 30 bisected gap evaluations, each one lowered posture and one trunk forward-kinematics pass; the 30 steps bound the error below 5e-9 degrees.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each evaluation depends on its own inclination, so nothing repeats within a call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/bendLower.ts#bendLower.fold

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, on which pose and its unit.

## @evidence contracts/development/implementation.md#principled-implementation

The key lowered as `lower` lowers it, resolved once, read by the audit's own pose reader for the trunk-thigh pairs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One key, one resolve, one pose reading.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The audit's model and references are the measure; no depth is authored.

## @evidence contracts/development/implementation.md#efficient-algorithms

Read once per solved key at plan time, never per instant.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `lower` and `AutoMovieMotionHumanAuditTangle.pose`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/bendLower.ts#bendLower.lateralTilt

## @evidence contracts/development/common.md#meaningful-documentation

States the angle, its lever and its unit.

## @evidence contracts/development/implementation.md#principled-implementation

The arc tangent of the target's lateral offset from the rest hips over the rest height of the shoulder above them, in the standing frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One frame transform and one arc tangent.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The lever is the body's own rest geometry; no angle is authored.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The bend law's alignment and the pick-up's side lean share it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/bendLower.ts#bendLower.solve

## @evidence contracts/development/implementation.md#principled-implementation

Project the centre onto the actual support hull along the author's heading. Convert that hip translation into the sine-scaled retreat of the lowered key and solve its inclination again only if necessary.

## @evidence contracts/development/implementation.md#efficient-algorithms

A free or supported key needs one reach solve. Only an active, unsupported key asks for another at its corrected retreat.
