# Effector goals

Define each action as time-bounded effector goals. Solve joint angles by inverse kinematics.

## Writing a goal

| Part | Names |
| --- | --- |
| End effector | A measured point on the body, such as the palm center or the seat bones |
| Target | A declared region or socket, a prop's grip or surface, a point in the set or an aim point |
| Approach | The direction and orientation the act needs |
| Window | When the goal holds, such as from grip to release |
| Tracking | Whether the target is frozen at the window's start or tracked through it |

Measure distances from the body and target. Cite provisional values. Take key poses, timing and windows from primary studies. Specify joint angles only where goals leave them open.

A goal on a body attaches to the bone under its target, so a layered sway carries it along. Read a tracked target one reaction time late, with the delay from the study, or the limb cannot be dodged, feinted or made to miss.

## The path in time

Move an effector on the bell-shaped speed profile of minimum jerk (Flash and Hogan 1985). A throw, strike or kick moves its segments from the trunk outward (Putnam 1993) and arrives still fast.

When the root travels during a stroke, express the effector path in the moving shoulder or hip frame.

## Out of reach

Check root-to-target distance before posing. Outside the limb's reach, report its reachable range or use a declared alternative that reaches. Let the caller approve any change to the [outcome](declaration.md#outcome-as-input).

Document and implement the reach rule. Reject a goal that would require moving the contact by clamping.

## The root

Place the root once from contacts and reaches. Compute balance only for a staged physical outcome or at the caller's request. Take a planted posture's compensation from its studied key poses. If needed, lower, lean or step and refit every limb while keeping contacts fixed.

Place bearing joints at their contact heights.

## Fit order

Fit supports, including hands on a held bar, before reaching limbs. Recheck previous contacts after each fit.

Check that each elbow and knee bends to the side its hint asks, since the solver's range-of-motion cost may prefer the other. Without a hint, keep the side the pose already bends to.

Fit limbs resting on one another in dependency order.

A fit that searches measures each trial after the joint limits apply, or it settles on a pose the body cannot take.
