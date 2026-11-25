# src/perform/HumanSegmentCarry.ts#HumanSegmentCarry.borne

## @evidence contracts/development/common.md#meaningful-documentation

Defines exact source/window/drive exclusions, the capture-instant order and ordered per-hand riding priority, with the recursion the order prevents; returns a fresh array of original held references.

## @evidence contracts/development/implementation.md#principled-implementation

The original active-window filter and subsequent riding-priority filter are independent ordered passes over unchanged internal hold records, so one pass can carry the same two side states without changing their decisions. `capture` evaluates a hold's source at its capture instant and reads the holds this filter admits there; admitting a hold only when its (capture instant, source end) precedes the evaluation's (second, carrier end) lexicographically makes that key strictly decrease along every nested capture, so each terminates. The same order is causality: no carry is read before the instant it is captured from.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Active-window admission precedes lazy per-side drive lookup, then the original first-riding-hold priority; carry-frame capture remains separate in carries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains inclusive starts, strict ends, source exclusion, riding fade and older-carrier cutoff exactly; the capture-instant order removes only holds whose source action has not yet ended at this second, which a running overlay drives anyway, or which ends with or after the carrier at this very second. Internal held producers own the closed two-side domain; no hold, contact or source pose is substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(H) hold traversal and at most two original plan drive scans replace two arrays/passes and a set/object. Empty holds allocate only the fresh returned array and perform no drive/contact lookup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only a fixed plan's per-side drive result is shared within this call; current hold windows and riding order are read at each exact second without retained selection or pose results.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Four scalar side states end with the call. The returned fresh array borrows the original holds, retains no reader or process, and lives only as long as its displayed evaluation.

# src/perform/HumanSegmentCarry.ts#HumanSegmentCarry.carries

## @evidence contracts/development/common.md#meaningful-documentation

States the port (MoveIt's pose constraints in a moving link's frame, the goal captured as a planning scene attaches a body to a link), the frame (the bone the placing action's goal rode, or the root body for a goal in the world, after REP 120), the displayed arm goals, held records and the optional borrowed FK source and lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

A port of MoveIt's pose constraints in a moving frame (moveit/moveit@fdb79acafb24efd9e138b0d309fb2463186d4ab2, BSD-3-Clause, attributed in the doc comment): moveit_core/kinematic_constraints/src/kinematic_constraint.cpp makes a `PositionConstraint` or `OrientationConstraint` whose frame is not fixed a `mobile_frame_`, and on every state places its region at `state.getFrameTransform(constraint_frame_id_) * constraint_region_pose_` and its rotation at `state.getFrameTransform(desired_rotation_frame_id_).linear() * desired_rotation_matrix_`. Here the carried hand's goal is attached to its frame bone (`on`), which every fit composes with that bone of the pose it fits. The goal's value is captured as `PlanningScene::processAttachedCollisionObjectMsg` (moveit_core/planning_scene/src/planning_scene.cpp) stores a body attached to a link, `object_pose_in_link = robot_state_->getGlobalLinkTransform(link_model).inverse() * obj_in_world->pose_`: the actual displayed source hand (and elbow) times the inverse of its frame bone's world transform at the source's end. The frame is the bone the action's own goal for the arm rode at its end (`on`, read from the action's goals, `courseArmGoal.goals`, where the arm is coursed); a goal laid in the world names none, and rides the frame REP 120 (public domain) rigidly attaches to the robot's root body, the waist, here the hips, which is this port's own mapping (MoveIt would keep a world-frame constraint in the world, which a walker leaves). One rule for every hold, with no per-law field. Every capture still evaluates the source pose; borrowed FK shares only exactly equal scalar prerequisites under the same unchanged skeleton topology.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

An empty-hold return and one ordered map of holding hands keep capture and ordinary FK in private helpers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No hold, source pose, capture, hand transform or fit is skipped; standalone calls retain their ordinary fresh-FK path, and the optional source never enters h.carry or a returned goal.

## @evidence contracts/development/implementation.md#efficient-algorithms

For H holds, O(H) record copies and no current FK (the fit places the frame bone it already resolves); each of M uncaptured holds adds its complete source-pose evaluation, one read of its action's goals at the capture instant and demanded frame/hand/elbow FK. Ordered joint admission remains, while unrelated world-bone outputs are omitted. A supplied parent shares exact math; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Existing h.carry stores each hand's numerical source relation once until forget. An explicit parent lends its same genuine projection and lazy exact reader to complete first source-pose evaluation and current/captured FK; changed pose/rest/parent scalars miss normally and all source poses/fits remain actual independent evaluations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The local getter borrows its parent's raw operation key until this call ends; canonical body FK owns O(K) successful dependency rows under that weak key. Holds keep only numerical carry frames/reference until forget. Returned arrays/tuples/goals/vectors are fresh, reference stays borrowed, and none retains the getter or key.

# src/perform/HumanSegmentCarry.ts#HumanSegmentCarry.decide

## @evidence contracts/development/common.md#meaningful-documentation

States the port, the point, the region's centre, the tolerance and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

MoveIt's `PositionConstraint::decide` (moveit/moveit@fdb79acafb24efd9e138b0d309fb2463186d4ab2, BSD-3-Clause, moveit_core/kinematic_constraints/src/kinematic_constraint.cpp): the link's point on the state, `state.getGlobalLinkTransform(link_model_) * offset_`, tested inside the constraint region placed on the same state by its frame, `state.getFrameTransform(constraint_frame_id_) * constraint_region_pose_`. Here the link's point is the hand joint the fit placed, the region a ball about the carried goal on its frame bone of the same pose, its radius the request's tolerance: the goal tolerance the arm's plan is solved to (`HumanArmTrajectoryTerms.TOLERANCE`, a millimetre). A state past it is refused, as a planner rejects a state its path constraint rejects.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One FK of the two bones, one distance, one refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance of its own: the plan's goal tolerance; no clamp or retry of the hand.

## @evidence contracts/development/implementation.md#efficient-algorithms

The frame bone and the hand only (`poseBones` with the two bones requested), borrowing the evaluation's exact FK where given.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each fit's pose is checked once, where it is placed.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.