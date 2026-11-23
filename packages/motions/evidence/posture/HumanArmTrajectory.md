# src/posture/HumanArmTrajectory.ts#HumanArmTrajectory.ISite

## @evidence contracts/development/common.md#meaningful-documentation

Names the existing model-owned site and its hold-waypoint role.

## @evidence contracts/development/design.md#principled-representation

Reuses the model's point, orientation and contact declaration instead of duplicating them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

ArmPlanned produces these sites and the trajectory context/model consume them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias adds no validation, sampled replacement or broader contact guarantee.

# src/posture/HumanArmTrajectory.ts#HumanArmTrajectory.IArm

## @evidence contracts/development/common.md#meaningful-documentation

States side, first/last rest, waypoint sites, optional IK guess, declared rests and paired grasp.

## @evidence contracts/development/design.md#principled-representation

Keeps one arm's fixed endpoint/contact data beside the existing joint-space rest representation; site order matches the problem times.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The context, seed and model read these fields; no per-query answer or solver history is part of an arm request.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing sites express no hold constraint and absent back reuses rest; no synthetic rig, repaired range or alternate branch is encoded.

# src/posture/HumanArmTrajectory.ts#HumanArmTrajectory.IProblem

## @evidence contracts/development/common.md#meaningful-documentation

Names the shared body, ordered seconds, corresponding bases and arm sites, and the action-progress callback.

## @evidence contracts/development/design.md#principled-representation

Time-aligned bases/sites and joint variables let the model judge the same composed body and paired contacts at each waypoint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

ArmPlanned builds these inputs for solve, context, model and seed; the returned trajectory contains neither this problem nor its producer callback.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Matching arrays, stable dependencies and the original model's admissibility are caller/solver premises; this record does not certify reach, clearance or a global optimum.

# src/posture/HumanArmTrajectory.ts#HumanArmTrajectory.IProblem.share

## @evidence contracts/development/common.md#meaningful-documentation

Names action seconds, the rest/hold endpoints and the caller-provided progress curve that HumanArmSeed reads for its reach/return paths and waypoint seed coordinates.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

This callable field declares the timing input; the caller's clock owns its actual curve and HumanArmSeed owns its use in seed construction.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

The signature has no body; the problem passes this timing callback to HumanArmSeed instead of defining another clock.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

The declaration executes no interpolation or repair; the supplied callback must retain the action's timing semantics.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature does no work; callback cost belongs to the provided clock and the actual path/waypoint queries made by HumanArmSeed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The signature coordinates no evaluation; HumanArmSeed reads the supplied progress at its existing call sites, and playback uses solved coordinates instead.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The signature acquires nothing; the problem and seed builder borrow the callback during solve, and the playback factory receives no callback.

# src/posture/HumanArmTrajectory.ts#HumanArmTrajectory.IAdmitted

## @evidence contracts/development/common.md#meaningful-documentation

Names the owner of the record and its role between `admitted` and `solve`.

## @evidence contracts/development/design.md#principled-representation

The owner's record unchanged: the course's readers, its verdict and its reading.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An alias, so ArmPlanned and ArmCourse keep one namespace for the course and the solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is restated or adapted.

# src/posture/HumanArmTrajectory.ts#HumanArmTrajectory.IState

## @evidence contracts/development/common.md#meaningful-documentation

Documents HumanArmTrajectory.IState: The interface contract (`IAutoMovieMotionHumanArmTrajectory.IState`).

## @evidence contracts/development/design.md#principled-representation

The record is the interface's (`IAutoMovieMotionHumanArmTrajectory.IState`); the alias adds nothing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kept so this owner's readers name the record by its owner, as master keeps such aliases.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No copy of the record: one declaration, in `@automovie/interface`.

# src/posture/HumanArmTrajectory.ts#HumanArmTrajectory.ISolved

## @evidence contracts/development/common.md#meaningful-documentation

States the two members and their order.

## @evidence contracts/development/design.md#principled-representation

The playback readers beside the solution they play, one per arm in the problem's order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

ArmPlanned reads both: the readers for the carry, the state for a replan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The state is the solution itself, not a summary of it.

# src/posture/HumanArmTrajectory.ts#HumanArmTrajectory.IMirrorTold

## @evidence contracts/development/common.md#meaningful-documentation

States who sets and who reads each member.

## @evidence contracts/development/design.md#principled-representation

One record shared by `solve`, its plan and its caller.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by planHumanArmTrajectory and read by solve and AutoMovieMotionHumanArmPlanned.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A record rather than a return value, so a thrown refusal still carries it.

# src/posture/HumanArmTrajectory.ts#HumanArmTrajectory.solve

## @evidence contracts/development/common.md#meaningful-documentation

States the seeds, the three refinements, the admission, ordered action seconds, the mirror solve and the refusal; playback borrows the final setup/time/coordinate data through a separate factory.

## @evidence contracts/development/implementation.md#principled-implementation

TrajOpt's few knots with a continuous reading between them (Schulman et al. 2013, sections V and VI), the reading here the model's own evaluation of the played interpolant on the frame grid, so nothing the film samples rests on the knots alone; a second initialisation only when the first ends unadmitted (their multiple initialisations).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The site refinement, one optimisation, then the admit-split-continue loop; a module-private factory creates each returned reader outside the builder's lexical environment.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A trajectory is returned only when its frame-grid reading, the optimiser's own last evaluation of the knots' interpolant, is within the model's tolerance; no bound is scaled to stand in for the reading.

## @evidence contracts/development/implementation.md#efficient-algorithms

The optimiser's variables and its rounds' readings are the knots', a few per transport, their intervals checked by swept spheres, and the frame grid is read once per converged path to certify it (TrajOpt's continuous-time check, Schulman et al. 2014, section IV-C); an interval the grid fails between knots is split and solved again, and only a miss at the knots themselves continues on the grid's own instants. A laid course is optimised only on the stretches about its failing instants, the closed form kept wherever the model admits it, so the solve's size is the defect's, not the span's. Measured on a tai chi push on f-small, whose course fails at one instant of a 12 s span: 36 s to 8.4 s. A hold's configuration found by the precheck is the planner seed's own, not solved twice.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A course's reading lends its context builder and its grid context, the same body, arms, bases and sites by identity, so the grid's frames and waypoint records are built once for the course and the solve; continued contexts keep the waypoint records of the knots they share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned readers retain only the setup list, final times, coordinate arrays and their arm index; the problem/read callbacks, contexts and readings are released on return or throw.
