# src/compose/AutoMovieMotionHumanArmPlanned.ts#AutoMovieMotionHumanArmPlanned.IWarm

## @evidence contracts/development/common.md#meaningful-documentation

Names the record and its owner.

## @evidence contracts/development/design.md#principled-representation

The interface's own record, read under the planner's name.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One alias, read by the group and the planner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No second definition: the alias is the interface record.

# src/compose/AutoMovieMotionHumanArmPlanned.ts#AutoMovieMotionHumanArmPlanned.together

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

A group starts empty; its carries join it as they are built. Its `warm` and `last` are the action's handover maps themselves, so every group of one plan writes where the next plan of the action reads; inside a plan (`within`) the group also takes its place among the plan's groups (`ITogether.ordinal`), which keys its solutions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One literal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: no member is assumed, and a handed solution is only a start (`planned`).

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The group holds its carries and their solution, released with the primitives that close over it; the handover maps are the performance's.

# src/compose/AutoMovieMotionHumanArmPlanned.ts#AutoMovieMotionHumanArmPlanned.within

## @evidence contracts/development/common.md#meaningful-documentation

States what the scope gives each group, why, how scopes nest and what a refusing group records.

## @evidence contracts/development/implementation.md#principled-implementation

A replan of one law at a slower time makes the same groups in the same order, so a group's place keys the solution of the same problem; a handed solution is only a start (`HumanArmTrajectory.solve`'s `warm`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scoped record, saved and restored in finally, as `HumanLimbIncumbent.within` scopes its seeds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing of a handed solution is trusted; a group made outside any plan keeps no handover.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The handover maps are the action's own.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The scope lives for the synchronous plan and is restored on return or throw.

# src/compose/AutoMovieMotionHumanArmPlanned.ts#AutoMovieMotionHumanArmPlanned.IRefusal

## @evidence contracts/development/common.md#meaningful-documentation

States what is named and by whom.

## @evidence contracts/development/design.md#principled-representation

A group is named by the key its handover is filed under, its place among the plan's groups and its arms, which a replan of the same law repeats.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, written by `planned` and read by `HumanPerformanceTempo`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The key, not the refusal's text, names the group, and the very error it threw ties the name to the refusal the plan ended in: a refusal caught inside the plan and followed by another is not mistaken for it.

# src/compose/AutoMovieMotionHumanArmPlanned.ts#AutoMovieMotionHumanArmPlanned.IStill

## @evidence contracts/development/common.md#meaningful-documentation

States the instant a hold is checked at and what each member holds.

## @evidence contracts/development/design.md#principled-representation

The arms' planned carries, each with its goal on its hold, at one second of the plan's own clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two members `still` reads, the carries owned by IAutoMovieMotionHumanArmPlanned.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface's planned-carry type; no member serves one law or a test.

# src/compose/AutoMovieMotionHumanArmPlanned.ts#AutoMovieMotionHumanArmPlanned.stands

## @evidence contracts/development/common.md#meaningful-documentation

States what is solved, on what and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The necessary condition the trajectory planner itself tests before optimising, on the very readings it would make.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One span of a frame either side of the instant, one still solve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The course's own refusal is the answer; nothing is relaxed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three bases and sites and one still problem from its starts; no course is laid or optimised.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `planned`'s own readers and `HumanArmSeed.held`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/compose/AutoMovieMotionHumanArmPlanned.ts#AutoMovieMotionHumanArmPlanned.planned

## @evidence contracts/development/common.md#meaningful-documentation

States the problem, the waypoints and their spacing, the knots as waypoints, the sites, the refusal, and the hand's finger state each returned trajectory plays.

## @evidence contracts/development/implementation.md#principled-implementation

The arms' whole action is first laid as an animation system lays it (`AutoMovieMotionHumanArmCourse`: a minimum-jerk effector course with a closed-form via-point, the rig's analytic fit at every instant continued from the last) and kept when the trajectory model's own reading admits it (`HumanArmTrajectory.admitted`); otherwise it seeds one trajectory optimisation (TrajOpt). Either is read off the very postures it is written on, so the plan is a constant of the action. Every knot of the span (an instant carrying a pose constraint) is a waypoint of both, as trajopt imposes a pose term at a timestep (github.com/joschu/trajopt src/trajopt/problem_description.cpp; Schulman et al. 2014, section VII-B). Each planned hand's fingers are one joint-space state the plan carries, MoveIt's grasp convention (moveit_msgs/Grasp, BSD-3-Clause: grasp_posture with its grasp_pose): at each instant a base is built for, the hand's digit goals are fitted with the arm at its goal's own fit (`AutoMovieMotionHumanArmPlayed.grasp`). The base the planner reads the hand by holds those fingers, and the returned trajectory plays them between the instants linearly in each joint, as joint_trajectory_controller (ros_controllers, BSD-3-Clause) plays position-only points. So the display and the audit read the fingers the planner kept clear, with no digit fitted after the plan.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the common laid course, then try independent paths for a pair with separate sites when the course fails on collision. One coupled certificate precedes the original fallback optimiser. The readings (`AutoMovieMotionHumanArmPlannedReads`), the waypoints and problem (`AutoMovieMotionHumanArmPlannedProblem`) and the solve with its playback (`AutoMovieMotionHumanArmPlannedSolve`) are their own files, read through named scopes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Goals are read at every waypoint and the full coupled site, sweep, ROM and speed checks admit any new candidate. A warm solution, linked grip, perceived target or unresolved trial retains the original coupled solve.

## @evidence contracts/development/implementation.md#efficient-algorithms

An admitted first course needs no optimiser. A collision on independent sites can add at most two single-arm plans and one coupled grid certificate. The coupled optimiser's waypoints are cut only on fallback. Postures, removed-arm bases, their finger states (one digit fit per hand with digit goals, from that instant's goal fit), perceived goals and endpoint fits are computed once per exact instant within their own plan; the finger playback is a bisection over those instants; a base within a frame and a half of the base resolved last continues its limbs' fits from that base's seeds (frame-to-frame IK coherence) instead of sweeping each swivel cold.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Same body, cached raw posture/goal and endpoint second prove fit equivalence within this synchronous plan. The retry borrows completed base and goal seconds and the original group pace. Other candidate samples do not call the supplied posture or goal reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

This synchronous plan owns raw/base/site maps, at most two endpoint angle records per arm and one exact FK preparation until return/throw. Only completed fits publish; no global result/time cache is added. Returned trajectories use their existing playback factory and solved-waypoint data, plus each hand's finger state at the instants its bases were built (one record of digit joints per instant), retaining none of the other maps/getters or preparation callbacks.
