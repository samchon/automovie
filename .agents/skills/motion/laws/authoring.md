# Author by effector goals

Almost every action is an interaction: a part of the body meets the floor, a prop, a partner, or a point the performer aims at. That part is the end effector, effector for short, what it reaches is the target, and a goal puts the effector on its target for a window.

Author every movement as goals, and let inverse kinematics find the joint angles within the rig's range of motion. A goal survives a taller body, a longer arm, a different opponent or a moved prop; a joint angle fitted to one body puts the next body's hand beside the cup.

## Write the goal

A goal names five things:

| Part | Names | Example |
| --- | --- | --- |
| End effector | A measured point on the body | The palm center, the ball of the foot, the knuckles, the seat bones, the heel |
| Target | Where the effector goes | A declared region or socket of another entity, a prop's grip or surface, a point in the set, an imagined point the performer aims at |
| Approach | The direction and the effector's orientation, where the act needs one | A palm facing a partner, a sole flat on a step |
| Window | When the goal holds | From a grip closing to its release |
| Tracking | Whether the target is frozen at the window's start or tracked through it | A reach to a moving hand |

A goal on a moving body, such as a palm on the chin or a hand on the other forearm, attaches to that bone, so a layered sway or breath carries the hand with the body instead of leaving it at a world point.

A tracked target is followed as a person follows one: the goal reads the target where the performer perceived it a reaction time earlier, with the delay taken from the action's study, the primary sources on the real practice. A limb that reads the target at the current instant cannot be dodged, feinted or made to miss.

Take every distance, height and reach from the performer's own measured segments and the target's measured parts. A constant measured on one figure ties the action to that figure and fails on the next; when no measure can supply a value, name it as provisional with its source.

The action's study supplies the key poses, the timing and the windows. Take joint values straight from those key poses only where no goal determines the pose, such as a guard's carriage or a follow-through.

## Shape the path in time

Move an effector to its target on a smooth, bell-shaped speed profile, that of minimum jerk (Flash and Hogan 1985), because a constant-speed path reads as mechanical. A movement that delivers speed at its end, such as a throw or a strike, sequences from proximal to distal segments (Putnam 1993) and reaches its target before the speed falls to zero.

Lay an effector's path on the body that carries it. When the root travels during the stroke, as in a lunge or a step into a blow, give the path relative to the moving shoulder or hip, or carry it by what that joint is ahead of the advance the path assumed. A path fixed in the world and keyed to the stroke's own progress lets a body that advances on its own clock overtake its hand: the limb folds to its limit, the fit changes side there, and the tool's tip jumps within one frame.

## Out of reach

Compute the reach before posing: the root-to-target distance against the limb's reachable band. Declare the rule for a target outside it, whether too far or closer than the limb can fold to. The action either refuses with the feasible range, or takes a declared alternative that still reaches the goal, such as a step, a lean or a support hand. An alternative that changes the outcome, such as a stumble, applies only when the caller selects it, because the outcome belongs to whoever decided the scene.

A silent clamp moves the contact somewhere the screenplay did not ask for and hides the miss from every check. The action's documentation says which rule it follows, and the code must match that sentence.

## Decide the root once

Decide the root once, from every demand on it together: the contacts, the far reaches, and balance, which keeps the extrapolated center of mass, the center of mass shifted by its velocity, over the support. Then fit every limb from that root, because separate corrections per limb disagree, and balance left to a check is met after the pose is already wrong.

Place a body that bears on the floor by the joints that bear, each at the height it has when it bears: an ankle or a toe joint at its standing height, a wrist at the height of a laid palm. Resting a keyed pose on the lowest point of its collision shapes lifts the whole body by whatever hangs lowest in that pose, such as a straight hand under a plank's shoulder, and the true supports then float.

A contact that still cannot be reached shows the root is wrong: revise that one root, by lowering, leaning or stepping, and refit every limb. A contact dragged off its point to keep the root's path is the error a viewer sees first.

## Order the fits

Fit supports before reaching limbs: feet on the floor, seat bones on the seat, hands on a held bar. A later fit can pull an earlier contact away, so check every earlier contact after each later fit.

A bend hint, the direction given to a limb's middle joint, chooses which side the elbow or knee falls on. A solver may still prefer the side its range-of-motion cost favors, so check that the solved middle joint follows the hint. When no hint is given, keep the side the pose being fitted already bends toward at that instant.

When two limbs rest on each other, as in crossed arms, place them in one direction. Fit the first against the body, then the second against the first as solved. Re-placing each against the other in turn flips each elbow between its two possible sides and does not converge.

When a fit searches for a pose, such as a grip aperture or a root height, measure each trial after the joint limits are applied, or the search converges on a pose the body cannot take.
