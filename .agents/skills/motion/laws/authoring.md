# Effector goals

Define the action's interaction through time-bounded effector goals. Fit them with the owning package's primitives, using analytic two-bone IK for a limb when its assumptions hold. Plan coupled fits under [pose by time](transitions.md#pose-by-time).

## Writing a goal

| Part | Names |
| --- | --- |
| End effector | A measured body point, such as palm center or seat bones |
| Target | A region, socket, prop grip or surface, set point or aim point |
| Approach | The direction and orientation the act needs |
| Window | When the goal holds, such as from grip to release |
| Tracking | Freeze the target at window start or track it throughout |

Measure distances from the body and target. Cite provisional values. Take key poses, timing and windows from primary studies. Specify joint angles only where goals leave them open.

A goal on a body follows the bone under its target. Use the study's delay for a performer's reaction to another person's movement. Read an active material contact at the current pose under [support frames](contacts.md#windows-and-support-frames).

## The path in time

Take knot times, velocities and accelerations from measured phases, and join the knots under [pose by time](transitions.md#preparation). An action that makes contact at speed needs its own boundary velocities and segment timing (Putnam 1993).

When the root travels during a stroke, express the effector path in the moving shoulder or hip frame.

## Out of reach

Check root-to-target distance before posing. Outside the limb's reach, report its reachable range or use a declared alternative that reaches. Let the caller approve any change to the [outcome](declaration.md#outcome-as-input).

Document and implement the reach rule. Reject a goal that would require moving the contact by clamping.

## The root

Plan the root from contacts, reaches and studied postural compensation. Evaluate balance only for an explicit request or a physical response that needs it, over the active interval. If lowering, leaning or stepping is needed, fit the affected limbs against the same supports.

Place bearing joints at their contact heights.

## Fit order

Fit supports, including hands on a held bar, before reaching limbs. Recheck previous contacts after each fit.

Check that each elbow and knee bends to the side its hint asks, since the solver's range-of-motion cost may prefer the other. Without a hint, keep the side the pose already bends to.

Fit limbs resting on one another in dependency order.

A fit that searches measures each trial after the joint limits apply, or it settles on a pose the body cannot take.
