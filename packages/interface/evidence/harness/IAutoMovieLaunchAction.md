# src/harness/IAutoMovieLaunchAction.ts#IAutoMovieLaunchAction

## @evidence contracts/development/design.md#principled-representation

compileLaunch uses analytic constant-gravity aim and 30 Hz default trajectory sampling. Moving aim uses at most eight fixed-point iterations, accepting the best visited time residual or early convergence below 1e-6 seconds, so an emitted contact is a computed aim event rather than independent collision detection. Linear playback approximates the parabola between keys; extreme binary64 solve arithmetic and feasible trajectory counts remain limitations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The projectile, aim, speed and optional reaction are the whole launch; gravity and arc are engine defaults, and the recoil is an ordinary `react` action injected into the performance rather than a launch-specific motion.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unreachable or more-than-1e-9-seconds-late flight is refused rather than trimmed; point/group onHit cannot be silently discarded and the launcher receives no invented throw. Sequence playback gives flight tracks no authority before start and holds their landing afterward; injected recoil is exempt from ordinary region-overlap refusal, and fall events do not prove falling motion.

## @evidence contracts/development/common.md#meaningful-documentation

States the reactive-timing purpose, every refusal, where the flight starts and how it is solved and led, how the clip covers the shot, the events, and that the shooter does not move; members give the projectile requirement, aim kinds, the speed unit and bounds, and the reaction's effect.
