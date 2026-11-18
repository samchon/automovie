# Effector goals

Almost every action is a set of goals, each putting an end effector on its target for a window.

Write movement as goals and let inverse kinematics find the joint angles, because a goal survives another body or a moved prop and a fitted joint angle does not.

## Writing a goal

| Part | Names |
| --- | --- |
| End effector | A measured point on the body, such as the palm center or the seat bones |
| Target | A declared region or socket, a prop's grip or surface, a point in the set or an aim point |
| Approach | The direction and orientation the act needs |
| Window | When the goal holds, such as from grip to release |
| Tracking | Whether the target is frozen at the window's start or tracked through it |

Take every distance from the measured body and target, and mark any other value provisional with its source. Take the key poses, timing and windows from the action's study, its primary sources, and a key pose's joint values only where no goal decides the pose.

A goal on a body attaches to the bone under its target, so a layered sway carries it along. Read a tracked target one reaction time late, with the delay from the study, or the limb cannot be dodged, feinted or made to miss.

## The path in time

Move an effector on the bell-shaped speed profile of minimum jerk (Flash and Hogan 1985). A throw, strike or kick moves its segments from the trunk outward (Putnam 1993) and arrives still fast.

When the root travels during the stroke, give the path relative to the moving shoulder or hip. A path fixed in the world lets the body overtake its hand, folding the arm and making a held tool's tip jump.

## Out of reach

Before posing, compare the root-to-target distance with the limb's reachable band. Outside it, the action refuses with the reachable range or takes a declared alternative that still reaches, such as a step. An alternative that changes the outcome needs the caller's choice, because the [outcome is an input](declaration.md#outcome-as-input).

Document the rule and make the code follow it exactly, because a silent clamp moves the contact and hides the miss.

## The root

Place the root once, from the contacts, the reaches and balance together, then fit every limb from it, because separate corrections per limb disagree. If a contact still cannot be reached, lower, lean or step the root and refit every limb, leaving the contact in place.

Rest a body that bears on the floor with each bearing joint at its bearing height, such as a wrist at a laid palm's height. Resting it on its lowest collision shape lifts it, and the real supports float.

## Fit order

Fit supports, hands on a held bar included, before reaching limbs, and recheck the earlier contacts after each fit, because a later fit can pull them away.

Check that each elbow and knee bends to the side its hint asks, since the solver's range-of-motion cost may prefer the other. Without a hint, keep the side the pose already bends to.

Fit limbs that rest on each other, as in crossed arms, one after the other, because fitting each against the other in turn never settles.

A fit that searches measures each trial after the joint limits apply, or it settles on a pose the body cannot take.
