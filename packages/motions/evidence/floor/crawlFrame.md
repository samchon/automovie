# src/floor/crawlFrame.ts#crawlFrame.pitched

## @evidence contracts/development/common.md#meaningful-documentation

States the search, its range and the reading's sense.

## @evidence contracts/development/implementation.md#principled-implementation

Bisection needs only the reading's change of sense over the range, which a trunk pitched toward the floor gives.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bisection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The range and the halvings are named.

## @evidence contracts/development/implementation.md#efficient-algorithms `HALVINGS` readings.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The crawl's pitch and the way down's lean are both found by it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/floor/crawlFrame.ts#crawlFrame.wrists

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the frame and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

The hand owner's identical rigid palm alignment and wrist placement supply only the datum being measured, with the same downward palm normal and forward direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rigid hand placement per side, without constructing an unused elbow hint or arm goal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The palm is laid at the origin facing up, so the offset is the hand's alone.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two constant-cost rigid hand placements once per plan; the unused default elbow-strain searches are not demanded by a wrist-offset reading.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Callers keep the result for the plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/floor/crawlFrame.ts#crawlFrame.laid

## @evidence contracts/development/common.md#meaningful-documentation

States what is written and each input.

## @evidence contracts/development/implementation.md#principled-implementation

The arm's own palm target and goal place each wrist, as `wrists` does at the origin.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One target and one goal per side.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Two goals per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/floor/crawlFrame.ts#crawlFrame.prepareLaid

## @evidence contracts/development/common.md#meaningful-documentation

States explicit fixed palm geometry and unchanged elbow searches. Callers must keep current root/trunk/forward unchanged across their same-call palm callbacks; the generic laid facade retains its original callback/read sequence instead of opting into this contract.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the same flat-palm/upward-floor-normal/explicit-forward geometry to prepareCrawlPalms, which shares each actual wrist between its native default bend and final contact-goal owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One prepared two-palm owner preserves ordered left/right writes while keeping surface geometry, actual bend solving and goal assembly with their original owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not substitute a bend preset or cache a pose, elbow solution or time query; each actual target still executes its default bend policy.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed orientation/offset/contact geometry and flat shapes share across a plan; each current wrist is placed once for its actual bend and contact goal, with both original numerical bend searches retained.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The explicit caller holds body/hand surfaces, flat shape, floor normal and forward fixed for the reader and preserves current trunk scalars across its two palm callbacks. Actual native crawl callers satisfy this source contract; generic callbacks use laid's unprepared original sequence.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns two fixed hand readers until release and borrows the module's two immutable flat shape maps; neither the readers nor those constants retain an evaluated posture, FK workspace or query history.

# src/floor/crawlFrame.ts#crawlFrame.flatHands

## @evidence contracts/development/common.md#meaningful-documentation

States the unused-goal consumer, retained finger fallback and new output ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Writes the same ordered left/right flat shape maps that prepareLaid writes; joint-space descent arms then apply their original held-finger fallback.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One joint-map merge exposes the finger shaping separately from the independently demanded palm targets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No actual contact goal or fitted arm is replaced: callers use this only where both original palm goals were overwritten before resolution.

## @evidence contracts/development/implementation.md#efficient-algorithms

Copies J current joints plus the thirty fixed digit entries; no unused default elbow search or target goal is constructed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Borrows the same two immutable side-only flat maps as the laid-palm owner, while current posture joints and returned maps remain independent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

No state is retained by a call; its returned posture owns a fresh joint map and borrows only immutable angle tuples.

# src/floor/crawlFrame.ts#crawlFrame.armed

## @evidence contracts/development/common.md#meaningful-documentation

States what is written and each input.

## @evidence contracts/development/implementation.md#principled-implementation

Free arm movements are smooth in joint space (Soechting and Lacquaniti 1981), so the arm is blended between two sets of angles (`blendHumanJoint`), never re-solved toward a goal that moves.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three blended joints and the fingers per arm.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The fingers start from the held ones, or the posture's where the arm holds none.

## @evidence contracts/development/implementation.md#efficient-algorithms

One lazy O(B) rig index serves the six interior joint blends for B rig bones, with each actual interpolation's existing cost; endpoint shares allocate no metadata reader, and fixed flat shapes/key lists are not rebuilt.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One synchronous blendHumanJoint metadata owner serves the six actual arm joints, and the two side-only flat shapes/key lists are shared constants; current endpoints and posture fingers remain per-query.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The synchronous joint-metadata reader ends on return or throw; two side-only immutable flat shape maps and key lists are bounded module constants, and no current posture or blended result is retained.

# src/floor/crawlFrame.ts#crawlFrame.prepareArmed

## @evidence contracts/development/common.md#meaningful-documentation

States fixed body/arm endpoints and changing current posture, finger fallback and progress.

## @evidence contracts/development/implementation.md#principled-implementation

The same writeArms owner applies each joint's blendHumanJoint.between rule and the original flat-finger interpolation, then removes the two arm goals.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Six fixed joint readers precede one current-posture writer shared with armed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Between retains original endpoint tuples, clipping, NaN and ROM rules; each current finger fallback is read from the supplied posture and no elbow solution or evaluated pose is cached.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each joint's fixed quaternion/chart prerequisites are prepared lazily once instead of per query; every read retains six current interpolations/readbacks plus the existing ordered finger maps.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The owning descent keeps body and the held/target clinical tuples unchanged. Only their six bounded numerical preparations persist; current posture fields, fallback fingers and outputs remain independent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One plan owns six bounded between readers until release, with no retained queried share, blended posture, current FK map or solver workspace.

# src/floor/crawlFrame.ts#crawlFrame.posed

## @evidence contracts/development/common.md#meaningful-documentation

States each input, its unit and sign.

## @evidence contracts/development/implementation.md#principled-implementation

The spine and the chest share the hike's return by `CHEST`, so the shoulders stay level over the hands.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One posture literal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The root is the caller's, from `rootFor`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/floor/crawlFrame.ts#crawlFrame.over

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, each input, its unit and the sign.

## @evidence contracts/development/implementation.md#principled-implementation

Each hip joint's height is the thigh's reach over its knee; a pelvis pitched by the trunk lifts one hip over the other by turning about the spine's axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One height per side and one turn.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An upright pelvis cannot lift a hip by that turn, so it turns none.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/floor/crawlFrame.ts#crawlFrame.rootFor

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the frame.

## @evidence contracts/development/implementation.md#principled-implementation

The hip joints are read off the body at the posture's heading and pelvis, so the root follows from them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read and one difference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The hips' own angles count, so a hiked pelvis keeps its middle where asked.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
