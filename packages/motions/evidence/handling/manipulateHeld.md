# src/handling/manipulateHeld.ts#manipulateHeld

## @evidence contracts/development/common.md#meaningful-documentation

Gives the ownership split, contact frame, release premise, timing and refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Rigid carriage preserves hand-local contact geometry. Each thumb fit uses the engine's clamped inverse kinematics on the original three-joint chain. Minimum-jerk joint blends have zero velocity and acceleration at their knots.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the hold, builds the isolated rig, fits the ordered contacts, then evaluates the sampled joint path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Admits only the holding thumb, validates every requested contact and refuses a press whose measured residual exceeds the keyed-contact bound.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each authored contact requires one digit fit on four bones. Display uses a binary knot lookup and blends only the three claimed joints.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the rigid hold once and reuses one topology for the isolated chain. The plan keeps fitted angles as part of its joint trajectory.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns only its channel, joint knots and entry posture and acquires no handles or shared mutable state.
