# src/everyday/gestureHands.ts#gestureHands.IPrior

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning and the envelope's range.

## @evidence contracts/development/design.md#principled-representation

The posture before the arms, one world hand request per moving hand and a dimensionless share in [0, 1].

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three members the planner's frame producer returns and the gesture and brace laws build.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the posture and hand-request types.

# src/everyday/gestureHands.ts#gestureHands.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States what is fixed per plan and what is read per posture, each input's unit and the output's ownership.

## @evidence contracts/development/implementation.md#principled-implementation

The palm-plane turn is a rotation about the hand's own long axis; the digit aim is HumanHandShape.aim; the elbow hint is the hanging or named preset of AutoMovieMotionHumanBend widened by the goal's and the Effort's shares; the fingers interpolate linearly from the posture's angles to the shape's by the share, the thumb and an emblem taking no extra curl.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The fixed turn and the relaxed and emblem shapes are built once; the hand reader builds a request and calls the same finger writer that planned-arm playback calls alone.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No frame sample or solved pose is kept; each read uses the goal and posture it is given.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation builds the relaxed and emblem joints and at most one quaternion. Each working shape compiles its fifteen finger entries once; a finger read writes fifteen triples, into the caller's record when one is given.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The side, turn, emblem and body belong to one gesture plan, and the hand-surface row producer is rebuilt only when the goal's surface or shape changes; posture, target, curl and envelope are read afresh at every call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The gesture holds this reader, one relaxed and one emblem record, one row producer and at most four shape tables until its plan is released; no output or goal is retained.

# src/everyday/gestureHands.ts#gestureHands.IHandRead

## @evidence contracts/development/common.md#meaningful-documentation

States both members and their units.

## @evidence contracts/development/design.md#principled-representation

A world hand request and clinical-degree finger angles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two members the gesture law and `reaching` read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the hand-request and posture types.

# src/everyday/gestureHands.ts#gestureHands.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes a complete live hand goal from finger shaping when a planned arm supplies the displayed geometry, with fresh triples and explicit optional caller-owned output maps.

## @evidence contracts/development/design.md#principled-representation

Separates current effector geometry from the hand's own clinical finger shape; both share one fixed plan preparation and the same finger interpolation owner.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Planning and endpoint gestures use hand, while playback of preplanned arms uses fingers without creating discarded world targets or bend hints.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses the existing stroke goal's exact shape/curl fields and existing hand result; it contains no solved arm, target proxy, time sample or contact tolerance.

# src/everyday/gestureHands.ts#gestureHands.IPrepared.hand

## @evidence contracts/development/common.md#meaningful-documentation

Defines current posture/goal, envelope range, fresh request/triples and optional caller-owned joint output, whose identity is returned without retention.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

Signature only; prepare owns actual palm turn, digit aim, bend and finger interpolation.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

The declaration specifies one complete hand read; prepare supplies its implementation.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No body here can replace a hand goal, change a surface or skip an actual query.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Prepare documents the actual live-geometry and finger-writing costs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The signature shares no result; prepare owns fixed hand metadata and every current input read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

This declaration retains no pose/goal; prepare owns the reader's bounded plan lifetime.

# src/everyday/gestureHands.ts#gestureHands.IPrepared.fingers

## @evidence contracts/development/common.md#meaningful-documentation

Defines actual shape/curl, envelope range, fresh triples, independence from the world goal and optional caller-owned output returned without retention.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

Signature only; prepare supplies the same actual relaxed-to-working interpolation as the complete hand reader.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

Declares the finger-only read used when planned arms already supply displayed geometry.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

The declaration contains no replacement surface, target, curl formula or solved arm.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Prepare documents the bounded named entries and fresh fifteen-joint writing cost.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Prepare owns shared named angle entries; this signature stores no interpolated answer.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The declaration retains no result or frame; prepare owns and releases its fixed metadata.

# src/everyday/gestureHands.ts#gestureHands.reaching

## @evidence contracts/development/common.md#meaningful-documentation

States the bound, the two ends, why the straight distance does not do, and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

The hand's request on the goal at full envelope, as the stroke asks it, made the arm's goal and measured by the observation the touch and hand-to-face laws time their transports by.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One request, one goal, one measurement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The arc is the arm's fitted blend, not a distance; the bound is the audit's own.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture solve without the arm, one arm fit and the observation's arc samples per end, at plan time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each end is measured once by its caller.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the request and the goal end with the call.

# src/everyday/gestureHands.ts#gestureHands.planned

## @evidence contracts/development/common.md#meaningful-documentation

States the planned span, the entry and rest arms, the frame producer and the separate envelope.

## @evidence contracts/development/implementation.md#principled-implementation

The coupled arm trajectory solver of `AutoMovieMotionHumanArmPlanned`, each arm's goal the gesture's hand request for that arm at the planner's posture.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One frame producer supplies the base posture and both hands' requests, each arm selects its own request, and the envelope stays a scalar time law.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every goal, constraint and timing is the gesture's; the envelope must be the time law `prior` uses. Limitation: the planner asks for the posture and then for each arm's goal on it separately, so the frame `prior` built for that posture is kept with it in a WeakMap local to this call, keyed by the posture object, and a posture the planner did not produce is rebuilt by `prior`; passing the frame to the goal belongs to the planner's interface.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each planner posture read builds one gesture frame, which both arms' goals read instead of rebuilding it; trajectory optimisation costs what the planner states.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A frame is shared only with goals asked on the very posture object it built; no time key or other plan reuses it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The WeakMap is local to the planning call and holds numeric frames only; it is released when planning returns or throws, and the trajectories keep their solved waypoints only.

# src/everyday/gestureHands.ts#gestureHands.written

## @evidence contracts/development/common.md#meaningful-documentation

States what is written and from what.

## @evidence contracts/development/implementation.md#principled-implementation

Each planned arm is written by `AutoMovieMotionHumanArmPlayed.written`: its upper arm, forearm and hand angles at the second and its hand's finger state as the plan plays it replace the posture's, and the arm's limb goal and the hand's digit goals are dropped, so no fit after the plan moves either (MoveIt's grasp convention, moveit_msgs/Grasp, BSD-3-Clause).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the planned arms.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fit or correction: the trajectory is the planner's.

## @evidence contracts/development/implementation.md#efficient-algorithms

One trajectory read and the arm's and the hand's joint writes per arm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure write with nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new posture and retains nothing.
