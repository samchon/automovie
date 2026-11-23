# src/harness/IAutoMovieReachAction.ts#IAutoMovieReachAction

## @evidence contracts/development/design.md#principled-representation

reachPose solves hinged two-bone geometry, then scores swivel candidates through clinical decomposition and the same ROM overshoot used by validation. Static output reaches its solved pose at half-span; dynamic bone/actor-frame output uses 24 Hz samples plus envelope landmarks, so target contact and continuous ROM safety between keys are not independently proved.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A hand and a target on the shared base are the whole verb; arm lengths, rest frames and joint ranges come from the actor's rig, so no angle or IK option is exposed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A supplied rig with an unbendable arm and an unresolved target are refused; the arm gate skips a missing rig, and missing actor/rig context can still yield no synthesized motion. Out-of-range solutions remain for ROM refusal rather than being clamped into an invented contact, and a geometrically unreachable target reaches only the shell.

## @evidence contracts/development/common.md#meaningful-documentation

States the rig the verb needs, each refusal and why, the solver and its out-of-range behavior, the reach point of a node target, the clip shape, when it is resampled, the `"auto"` length and the default region; members give the arm side and the target requirement.
