# src/motion/human/posture/IAutoMovieHumanEffectorPointLimit.ts#IAutoMovieHumanEffectorPointLimit

## @evidence contracts/development/common.md#meaningful-documentation

An effector-local point and its maximum world displacement in metres from the goal's requested rigid pose. Limb fitting and tool trajectories share this physical tolerance.

## @evidence contracts/development/design.md#principled-representation

A rigid effector point plus a Euclidean tolerance against the goal's asked world frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

StrikingHeld supplies working-line limits and limb trajectory fitting consumes them, so a tool's tolerated displacement has one owner across those operations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The law supplies the physical metre bound and the planner reserves numerical allowance inside it. The contract does not claim that an arbitrary requested goal is reachable.
