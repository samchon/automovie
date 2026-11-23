# src/sport/highJump.ts#highJump.arched

## @evidence contracts/development/common.md#meaningful-documentation

States the shape and that its angles are provisional.

## @evidence contracts/development/implementation.md#principled-implementation

An exercise key on the body (`ExerciseKey.from`), so what it leaves unstated is the body's own standing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One key.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `ExerciseKey.from`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/sport/highJump.ts#highJump.piked

## @evidence contracts/development/common.md#meaningful-documentation

States the shape and that its angles are provisional.

## @evidence contracts/development/implementation.md#principled-implementation

An exercise key on the body (`ExerciseKey.from`), so what it leaves unstated is the body's own standing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One key.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `ExerciseKey.from`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/sport/highJump.ts#highJump.crossbar

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, where and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The affordance's translation carried into the world by the prop's frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and the demanded Y component of the same rigid transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing bar is refused with the prop's contacts, never replaced by a number.

## @evidence contracts/development/implementation.md#efficient-algorithms

A first-match affordance scan and one world frame read resolve the bar.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the same bar reader as the flight's plane-crossing query.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/sport/highJump.ts#highJump.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The vertical launch is sqrt(2 g (bar - centre)), the fall time to the lying centre's height closes the horizontal launch, the turns are constant rates over their phases, and the touchdown is the bisected instant the lowest shape meets the surface.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The lying height, the take-off, the flight posture, the touchdown, the landing, then the posture by phase.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every bound refuses with its numbers; nothing is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four jump plans and all touchdown bisection stations remain. One actual take-off canonical solve supplies both COM and frozen joints. Each changing flight query shares its actual COM/floor map; playback omits unused bounds, and synchronous ROM/FK metadata share only prerequisites. No sample changes and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Existing take-off/flight/mat owners share two fixed key-pair preparations. The ascending key blend and yaw share the same current clipped cubic progress. The initial lying floor/COM observations borrow one local FK/projector source; each changing flight shape shares its own actual COM/floor map without a time memo. Raw callbacks forward only synchronous parent FK/projector loans through take-off, dynamic flight and landing, retaining full current joint projection.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains take-off, mass model and two fixed key-pair readers. Query frame, bones and floor reader release on return/throw; borrowed FK/projector loans stay with their synchronous caller and never enter the plan, floor closure or previous-query state.
